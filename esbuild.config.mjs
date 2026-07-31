import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: [path.join(__dirname, "server/_core/index.ts")],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outdir: "dist",
  resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json", ".mts"],
  loader: {
    ".ts": "ts",
    ".tsx": "tsx",
  },
  sourcemap: false,
  minify: false,
});
