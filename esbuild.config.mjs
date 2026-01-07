import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isWatch = process.argv.includes("--watch");
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  absWorkingDir: projectRoot,
  entryPoints: ["src/main.ts"],
  outfile: path.join(projectRoot, "main.js"),
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2018",
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "@lezer/*",
    "crypto"
  ],
  logLevel: "info"
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("[esbuild] watching...");
} else {
  await esbuild.build(buildOptions);
}
