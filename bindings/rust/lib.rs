//! This crate provides Prisma language support for the [tree-sitter] parsing library.
//!
//! The parser uses tree-sitter ABI 15, so it needs version 0.25 or later of the `tree-sitter` crate.
//!
//! Typically, you will use the [`LANGUAGE`] constant to add this language to a tree-sitter [`Parser`], and then use the
//! parser to parse some code:
//!
//! ```
//! let code = r#"
//! model User {
//!   id Int @id
//! }
//! "#;
//! let mut parser = tree_sitter::Parser::new();
//! let language = tree_sitter_prisma::LANGUAGE;
//! parser.set_language(&language.into())?;
//! let tree = parser.parse(code, None).ok_or("Error parsing Prisma source")?;
//! assert!(!tree.root_node().has_error());
//! # Ok::<(), Box<dyn std::error::Error>>(())
//! ```
//!
//! [`Parser`]: https://docs.rs/tree-sitter/0.27.1/tree_sitter/struct.Parser.html
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter_language::LanguageFn;

unsafe extern "C" {
    fn tree_sitter_prisma() -> *const ();
}

/// The tree-sitter [`LanguageFn`] for this grammar.
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_prisma) };

/// The content of the [`node-types.json`] file for this grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers/6-static-node-types
pub const NODE_TYPES: &str = include_str!("../../src/node-types.json");

#[cfg(with_highlights_query)]
/// The syntax highlighting query for this grammar.
pub const HIGHLIGHTS_QUERY: &str = include_str!("../../queries/highlights.scm");

#[cfg(with_injections_query)]
/// The language injection query for this grammar.
pub const INJECTIONS_QUERY: &str = include_str!("../../queries/injections.scm");

#[cfg(with_locals_query)]
/// The local variable query for this grammar.
pub const LOCALS_QUERY: &str = include_str!("../../queries/locals.scm");

#[cfg(with_tags_query)]
/// The symbol tagging query for this grammar.
pub const TAGS_QUERY: &str = include_str!("../../queries/tags.scm");

#[cfg(test)]
mod tests {
    #[test]
    fn test_parses_a_prisma_model() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE.into())
            .expect("Error loading Prisma parser");
        let tree = parser
            .parse("model User { id Int @id }", None)
            .expect("Error parsing Prisma model");
        assert_eq!(tree.root_node().kind(), "program");
        assert!(!tree.root_node().has_error());
    }

    #[test]
    fn test_loads_the_highlights_query() {
        tree_sitter::Query::new(&super::LANGUAGE.into(), super::HIGHLIGHTS_QUERY)
            .expect("Error loading highlights query");
    }
}
