import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = fileURLToPath(new URL("../../system/", import.meta.url));

export async function buildWeb() {
  await mkdir(output, { recursive: true });
  await Promise.all([
    copyFile(root + "app/index.html", output + "index.html"),
    copyFile(root + "app/style.css", output + "style.css")
  ]);
  await build({
    entryPoints: [root + "app/main.js"],
    bundle: true,
    format: "esm",
    minify: false,
    sourcemap: true,
    outfile: output + "system.js",
    target: ["es2022"]
  });
  console.log("System interface built at /system/");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await buildWeb();
