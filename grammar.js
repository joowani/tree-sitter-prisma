// noinspection JSUnusedLocalSymbols
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PRECEDENCE = {
  ASSIGN: 0,
  COMMENT: 1,
  TERNARY: 1,
  STRING: 2,
  OR: 2,
  AND: 3,
  REL: 4,
  PLUS: 5,
  TIMES: 6,
  EXP: 7,
  CALL: 8,
  MEMBER: 9
};

module.exports = grammar({
  name: 'prisma',

  extras: $ => [
    $.comment,
    $.developer_comment,
    /[\s\uFEFF\u2060\u200B\u00A0]/
  ],

  inline: $ => [
    $._expression,
    $._attribute_expression,
    $._call_signature,
    $._formal_parameter,
    $._constructable_expression,
    $._declaration,
  ],

  supertypes: $ => [
    $._declaration
  ],

  rules: {
    program: $ => repeat($._declaration),

    datasource_declaration: $ => prec(PRECEDENCE.MEMBER, seq(
      'datasource',
      $.identifier,
      $.statement_block,
    )),

    model_declaration: $ => prec(PRECEDENCE.MEMBER, seq(
      'model',
      $.identifier,
      $.statement_block,
    )),

    view_declaration: $ => prec(PRECEDENCE.MEMBER, seq(
      'view',
      $.identifier,
      $.statement_block,
    )),

    generator_declaration: $ => prec(PRECEDENCE.MEMBER, seq(
      'generator',
      $.identifier,
      $.statement_block,
    )),

    type_declaration: $ => prec(PRECEDENCE.MEMBER, seq(
      'type',
      choice(
        seq($.identifier, $.statement_block),
        seq(
          $.identifier,
          alias($.identifier, $.type_declaration_type),
          optional(repeat($.attribute))
        ),
        seq($.assignment_expression, optional(repeat($.attribute)))
      ),
    )),

    enum_declaration: $ => prec(PRECEDENCE.MEMBER, seq(
      'enum',
      $.identifier,
      $.enum_block,
    )),

    declaration: $ => choice(
      $.datasource_declaration,
      $.model_declaration,
      $.view_declaration,
      $.generator_declaration,
      $.type_declaration,
      $.enum_declaration,
    ),

    _declaration: $ => choice(
      $.datasource_declaration,
      $.model_declaration,
      $.view_declaration,
      $.generator_declaration,
      $.type_declaration,
      $.enum_declaration,
    ),

    developer_comment: $ => token(
      seq('//', /[^/].*/),
    ),

    comment: $ => prec(PRECEDENCE.COMMENT, token(
      seq('///', /.*/),
    )),

    statement_block: $ => seq(
      '{',
      optional(
        repeat(
          choice(
            $.column_declaration,
            $.assignment_expression,
            $.block_attribute_declaration,
          )
        )
      ),
      '}'
    ),

    enum_block: $ => seq(
      '{',
      optional(repeat($.enumeral)),
      '}'
    ),

    column_declaration: $ => seq(
      $.identifier,
      $.column_type,
      optional(repeat(
        $.attribute
      )),
    ),

    assignment_pattern: $ => seq(
      $.identifier,
      '=',
      $._constructable_expression,
    ),

    assignment_expression: $ => prec.right(PRECEDENCE.ASSIGN, seq(
      alias($.identifier, $.variable),
      '=',
      $._expression
    )),

    binary_expression: $ => choice(
      ...[
        ['&&', PRECEDENCE.AND],
        ['||', PRECEDENCE.OR],
        ['>>', PRECEDENCE.TIMES],
        ['>>>', PRECEDENCE.TIMES],
        ['<<', PRECEDENCE.TIMES],
        ['&', PRECEDENCE.AND],
        ['^', PRECEDENCE.OR],
        ['|', PRECEDENCE.OR],
        ['+', PRECEDENCE.PLUS],
        ['-', PRECEDENCE.PLUS],
        ['*', PRECEDENCE.TIMES],
        ['/', PRECEDENCE.TIMES],
        ['%', PRECEDENCE.TIMES],
        ['**', PRECEDENCE.EXP],
        ['<', PRECEDENCE.REL],
        ['<=', PRECEDENCE.REL],
        ['==', PRECEDENCE.REL],
        ['===', PRECEDENCE.REL],
        ['!=', PRECEDENCE.REL],
        ['!==', PRECEDENCE.REL],
        ['>=', PRECEDENCE.REL],
        ['>', PRECEDENCE.REL],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          $._expression,
          field('operator', operator),
          $._expression
        ))
      )
    ),

    member_expression: $ => prec(PRECEDENCE.MEMBER, seq(
      choice(
        $.identifier,
        $.member_expression
      ),
      '.',
      alias($.identifier, $.property_identifier)
    )),

    column_type: $ => seq(
      choice($.identifier, $.call_expression),
      optional(choice(
        $.maybe,
        $.array
      )),
    ),

    type_expression: $ => seq(
      $.identifier,
      ':',
      $._expression,
    ),

    call_expression: $ => prec(PRECEDENCE.CALL, seq(
      $._constructable_expression,
      $.arguments,
    )),

    attribute: $ => seq(
      '@',
      $._attribute_expression,
    ),

    block_attribute_declaration: $ => seq(
      '@@',
      $._attribute_expression,
    ),

    arguments: $ => seq(
      '(',
      commaSep(optional($._expression)),
      ')'
    ),

    _call_signature: $ => seq(
      field('parameters', $.formal_parameters)
    ),

    formal_parameters: $ => seq(
      '(',
      optional(seq(
        commaSep1($._formal_parameter)
      )),
      ')'
    ),

    _formal_parameter: $ => choice(
      $.identifier,
      $.string,
      $.array,
      $.assignment_pattern,
    ),

    _attribute_expression: $ => choice(
      $.identifier,
      $.call_expression,
      $.member_expression
    ),

    _expression: $ => choice(
      $._constructable_expression,
      $.assignment_expression,
      $.call_expression,
      $.binary_expression,
    ),

    _constructable_expression: $ => choice(
      $.identifier,
      $.type_expression,
      $.member_expression,
      $.number,
      $.string,
      $.true,
      $.false,
      $.null,
      $.array,
    ),

    identifier: $ => {
      const alpha = /[^\x00-\x1F\s0-9:;`"'@#.,|^&<=>+*\/\\%?!~()\[\]{}\uFEFF\u2060\u200B]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+}/
      const alphanumeric = /[^\x00-\x1F\s:;`"'@#.,|^&<=>+*\/\\%?!~()\[\]{}\uFEFF\u2060\u200B]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+}/
      return token(seq(alpha, repeat(alphanumeric)))
    },

    string: $ => token(choice(
      seq("'", /([^'\n]|\\(.|\n))*/, "'"),
      seq('"', /([^"\n]|\\(.|\n))*/, '"')
    )),

    enumeral: $ => {
      const alpha = /[^\x00-\x1F\s0-9:;`"'@#.,|^&<=>+*\/\\%?!~()\[\]{}\uFEFF\u2060\u200B]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+}/
      const alphanumeric = /[^\x00-\x1F\s:;`"'@#.,|^&<=>+*\/\\%?!~()\[\]{}\uFEFF\u2060\u200B]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+}/
      return token(seq(alpha, repeat(alphanumeric)))
    },

    number: $ => /\d+/,

    array: $ => seq(
      '[',
      commaSep(optional(
        $._expression
      )),
      ']'
    ),

    maybe: $ => '?',
    true: $ => 'true',
    false: $ => 'false',
    null: $ => 'null',
  }
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}