import esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ["src/main.ts"],
  outfile: "main.js",
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
