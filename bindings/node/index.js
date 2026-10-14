import { readFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

// A `bun build --compile` executable has no package directory for node-gyp-build to search, so
// require the prebuild directly. Its path has to stay static for Bun to embed the addon.
// noinspection JSUnresolvedReference,JSUnresolvedFunction
const binding = typeof process.versions.bun === "string" && Bun.isStandaloneExecutable
  ? require(`../../prebuilds/${process.platform}-${process.arch}/tree-sitter-prisma.node`)
  : (await import("node-gyp-build")).default(root);

try {
  // Bun only embeds static paths, and `import()` rejects absolute Windows paths like `root`.
  const nodeTypes = await import("../../src/node-types.json", { with: { type: "json" } });
  binding.nodeTypeInfo = nodeTypes.default;
} catch { }

// A standalone Bun executable has no package directory to read query files from, so its queries stay undefined.
// noinspection JSUnresolvedReference
if (!(typeof process.versions.bun === "string" && Bun.isStandaloneExecutable)) {
  const queries = [
    ["HIGHLIGHTS_QUERY", `${root}/queries/highlights.scm`],
    ["INJECTIONS_QUERY", `${root}/queries/injections.scm`],
    ["LOCALS_QUERY", `${root}/queries/locals.scm`],
    ["TAGS_QUERY", `${root}/queries/tags.scm`],
  ];

  for (const [prop, path] of queries) {
    Object.defineProperty(binding, prop, {
      configurable: true,
      enumerable: true,
      get() {
        delete binding[prop];
        try {
          binding[prop] = readFileSync(path, "utf8");
        } catch { }
        return binding[prop];
      }
    });
  }
}

export default binding;
