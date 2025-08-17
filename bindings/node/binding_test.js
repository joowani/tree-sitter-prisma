import assert from "node:assert";
import { test } from "node:test";
import Parser from "tree-sitter";
import language from "./index.js";

test("can parse a Prisma model", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse("model User { id Int @id }");
  assert.equal(tree.rootNode.type, "program");
  assert.equal(tree.rootNode.hasError, false);
  assert.equal(tree.rootNode.namedChild(0).type, "model_declaration");
});

test("exports node types and handles missing optional queries", () => {
  assert.ok(language.nodeTypeInfo.some(node => node.type === "model_declaration"));
  for (const name of ["HIGHLIGHTS_QUERY", "INJECTIONS_QUERY", "LOCALS_QUERY", "TAGS_QUERY"]) {
    assert.equal(language[name], undefined);
    assert.equal(language[name], undefined);
  }
});

test("can query enum names separately from comments and attributes", () => {
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse(`enum Role {
    ADMIN @map("admin")
    USER /* note */
      @map("user")
  }`);
  assert.equal(tree.rootNode.hasError, false);
  // noinspection SpellCheckingInspection
  const query = new Parser.Query(language, "(enumeral (identifier) @enum.name)");
  assert.deepEqual(query.captures(tree.rootNode).map(({ node }) => node.text), ["ADMIN", "USER"]);
});

test("line comments preserve declarations across line endings and at EOF", () => {
  const parser = new Parser();
  parser.setLanguage(language);

  for (const newline of ["\n", "\r\n", "\r"]) {
    for (const prefix of ["//", "// comment", "///", "/// documentation"]) {
      const source = `${prefix}${newline}model User { id Int @id }${newline}//`;
      const tree = parser.parse(source);
      assert.equal(tree.rootNode.hasError, false, JSON.stringify(source));
      assert.deepEqual(
        tree.rootNode.namedChildren.map(node => node.type),
        [prefix.startsWith("///") ? "comment" : "developer_comment", "model_declaration", "developer_comment"],
        JSON.stringify(source),
      );
      assert.equal(tree.rootNode.namedChild(0).text, prefix);
      assert.equal(tree.rootNode.namedChild(2).text, "//");
    }
  }
});
