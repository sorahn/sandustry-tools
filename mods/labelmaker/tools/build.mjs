import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const [entryPoint, outfile] = process.argv.slice(2);
if (!entryPoint || !outfile) {
  console.error("usage: build.mjs ENTRY.tsx OUTPUT.js");
  process.exit(2);
}

const gzipFontPlugin = {
  name: "labelmaker-gzip-fonts",
  setup(pluginBuild) {
    pluginBuild.onLoad({ filter: /\.font\.json$/ }, async ({ path }) => {
      const source = await readFile(path, "utf8");
      JSON.parse(source);
      const encoded = gzipSync(source).toString("base64");
      return {
        contents: `export default ${JSON.stringify(encoded)};`,
        loader: "js",
        resolveDir: path.slice(0, path.lastIndexOf("/")),
      };
    });
  },
};

await build({
  entryPoints: [entryPoint],
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  mainFields: ["browser", "module", "main"],
  drop: ["console"],
  jsxFactory: "sandkit.react.createElement",
  jsxFragment: "sandkit.react.Fragment",
  alias: {
    "~shared": new URL("../../../shared", import.meta.url).pathname,
    fs: fileURLToPath(new URL("./empty-fs.js", import.meta.url)),
  },
  plugins: [gzipFontPlugin],
  outfile,
});
