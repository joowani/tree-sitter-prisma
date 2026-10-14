; Capture names follow the tree-sitter highlight theme. No two patterns capture the same node, so the result does not
; depend on whether an editor gives precedence to the first or the last matching pattern.

; Keywords

[
  "datasource"
  "enum"
  "generator"
  "model"
  "type"
  "view"
] @keyword

; Declarations

; A datasource name is the namespace of native type attributes such as `@db.VarChar`.
(datasource_declaration
  (identifier) @module)

(generator_declaration
  (identifier) @module)

(model_declaration
  (identifier) @type)

(view_declaration
  (identifier) @type)

(enum_declaration
  (identifier) @type)

(type_declaration
  (identifier) @type)

(type_declaration
  (assignment_expression
    (variable) @type))

(enumeral
  (identifier) @constant)

(column_declaration
  (identifier) @property)

(statement_block
  (assignment_expression
    (variable) @property))

; Field types

([
  (column_type
    (identifier) @type.builtin)
  (type_declaration_type) @type.builtin
  (type_declaration
    (assignment_expression
      (identifier) @type.builtin))
]
  (#any-of? @type.builtin "BigInt" "Boolean" "Bytes" "DateTime" "Decimal" "Float" "Int" "Json" "String"))

([
  (column_type
    (identifier) @type)
  (type_declaration_type) @type
  (type_declaration
    (assignment_expression
      (identifier) @type))
]
  (#not-any-of? @type "BigInt" "Boolean" "Bytes" "DateTime" "Decimal" "Float" "Int" "Json" "String"))

; `Unsupported("...")` is the only field type written as a call.
(column_type
  (call_expression
    .
    (identifier) @type.builtin))

(column_type
  (maybe) @punctuation.special)

; Attributes

[
  "@"
  "@@"
] @attribute

(attribute
  [
    (identifier) @attribute
    (member_expression
      (identifier) @attribute
      (property_identifier) @attribute)
    (call_expression
      .
      [
        (identifier) @attribute
        (member_expression
          (identifier) @attribute
          (property_identifier) @attribute)
      ])
  ])

(block_attribute_declaration
  [
    (identifier) @attribute
    (member_expression
      (identifier) @attribute
      (property_identifier) @attribute)
    (call_expression
      .
      [
        (identifier) @attribute
        (member_expression
          (identifier) @attribute
          (property_identifier) @attribute)
      ])
  ])

; Arguments

; Prisma has no user-defined functions, so every function call is built in.
(arguments
  (call_expression
    .
    (identifier) @function.builtin))

(type_expression
  (call_expression
    .
    (identifier) @function.builtin))

(statement_block
  (assignment_expression
    (call_expression
      .
      (identifier) @function.builtin)))

; A named argument such as `onDelete: Cascade`.
(type_expression
  .
  (identifier) @variable.parameter)

; A bare value is an enum value, such as `USER` in `@default(USER)` or `Cascade` in `onDelete: Cascade`.
(arguments
  (identifier) @constant)

(type_expression
  (identifier)
  (identifier) @constant)

; A list item names a field or a database extension, such as `authorId` in `fields: [authorId]`. Its optional
; arguments configure it, as in `@@index([title(ops: raw("gin_trgm_ops"))])`.
(array
  (identifier) @variable)

(array
  (call_expression
    .
    (identifier) @variable))

; Literals

(string) @string

(number) @number

[
  (true)
  (false)
  (null)
] @constant.builtin

; Comments

; Prisma keeps `///` comments in its schema AST as documentation for the declaration or field that follows.
(comment) @comment.documentation

[
  (developer_comment)
  (block_comment)
] @comment

; Operators and punctuation

"=" @operator

(binary_expression
  operator: _ @operator)

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  "."
  ":"
] @punctuation.delimiter
