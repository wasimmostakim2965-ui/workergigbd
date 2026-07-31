import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Use tsx for TypeScript files since it handles them natively
const tsx = require("tsx/cjs/api.js");

// First, transpile with tsx to handle TypeScript properly
await tsx.api.compileFiles(
  [path.join(__dirname, "server/_core/index.ts")],
  {
    target: "node18",
    format: "esm",
    outDir: path.join(__dirname, "dist"),
    shim: false,
    transpileOnly: true,
  }
);

// Copy to dist/index.js with proper ESM extension
const fs = await import("fs");
const outFile = path.join(__dirname, "dist", "index.js");
if (fs.existsSync(outFile)) {
  console.log("Server built successfully with tsx!");
}
