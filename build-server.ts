import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const result = await esbuild.build({
  absWorkingDir: __dirname,
  entryPoints: [path.join(__dirname, "server/_core/index.ts")],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outfile: path.join(__dirname, "dist/index.js"),
  resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json", ".mts"],
  sourcemap: false,
  minify: false,
});

if (result.errors.length > 0) {
  console.error("Build failed:", result.errors);
  process.exit(1);
}

console.log("Server built successfully!");
