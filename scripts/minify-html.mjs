import { readFile, writeFile } from "node:fs/promises";
import { minify } from "html-minifier-terser";

const file = new URL("../dist/index.html", import.meta.url);
const html = await readFile(file, "utf8");
const output = await minify(html, {
  collapseWhitespace: true,
  collapseInlineTagWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  sortAttributes: true,
  sortClassName: true,
  minifyCSS: true,
  minifyJS: true,
});
await writeFile(file, output);