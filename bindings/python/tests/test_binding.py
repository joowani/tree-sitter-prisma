from unittest import TestCase

from tree_sitter import Language, Parser
import tree_sitter_prisma


class TestLanguage(TestCase):
    def test_parses_a_prisma_model(self):
        parser = Parser(Language(tree_sitter_prisma.language()))
        tree = parser.parse(b"model User { id Int @id }")
        self.assertEqual(tree.root_node.type, "program")
        self.assertFalse(tree.root_node.has_error)
        self.assertEqual(tree.root_node.named_children[0].type, "model_declaration")

    def test_handles_missing_optional_queries(self):
        for name in ["HIGHLIGHTS_QUERY", "INJECTIONS_QUERY", "LOCALS_QUERY", "TAGS_QUERY"]:
            with self.subTest(query=name):
                self.assertIsNone(getattr(tree_sitter_prisma, name))
                self.assertIsNone(getattr(tree_sitter_prisma, name))
        with self.assertRaises(AttributeError):
            getattr(tree_sitter_prisma, "MISSING_QUERY")
