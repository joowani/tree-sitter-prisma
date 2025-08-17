package tree_sitter_prisma_test

import (
	"testing"

	tree_sitter_prisma "github.com/joowani/tree-sitter-prisma/bindings/go"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestParsesPrismaModel(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_prisma.Language())
	if language == nil {
		t.Fatal("Error loading Prisma grammar")
	}
	parser := tree_sitter.NewParser()
	defer parser.Close()
	if err := parser.SetLanguage(language); err != nil {
		t.Fatalf("Error loading Prisma grammar: %v", err)
	}
	tree := parser.Parse([]byte("model User { id Int @id }"), nil)
	if tree == nil {
		t.Fatal("Error parsing Prisma model")
	}
	defer tree.Close()
	if root := tree.RootNode(); root.Kind() != "program" || root.HasError() {
		t.Errorf("Unexpected syntax tree: %s", root.ToSexp())
	}
}
