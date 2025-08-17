# tree-sitter-prisma

[Prisma](https://www.prisma.io/) grammar for [Tree-sitter](https://github.com/tree-sitter/tree-sitter).

### Playground

```shell
# Install tree-sitter CLI
cargo install tree-sitter-cli --locked

# Clone this repository and navigate into it
git clone https://github.com/joowani/tree-sitter-prisma && cd tree-sitter-prisma

# Compile the parser
tree-sitter build --wasm

# Start the playground at http://127.0.0.1:8000
tree-sitter playground
```

### References

- [Tree-sitter Documentation](https://tree-sitter.github.io/tree-sitter/)
- [Prisma Schema](https://www.prisma.io/docs/orm/prisma-schema)

### Credits

The grammar is originally based
on [victorhqc/tree-sitter-prisma](https://github.com/victorhqc/tree-sitter-prisma).
