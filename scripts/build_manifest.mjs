/**
 * Writes public/manifest.json: every file in the bundle, plus the date
 * of the cut. The index page reads it to build the "Download all" zip, so
 * the zip's contents are whatever is actually on disk rather than a list
 * hardcoded in the component.
 *
 *   node scripts/build_manifest.mjs [YYYY-MM-DD]
 *
 * Pass a date to stamp the cut; defaults to today.
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = "public";
const OUT = path.join(ROOT, "manifest.json");
const SKIP = new Set(["manifest.json", ".DS_Store"]);

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const version = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const files = (await walk(ROOT))
  .map((p) => path.relative(ROOT, p).split(path.sep).join("/"))
  .sort();

let bytes = 0;
for (const f of files) bytes += (await fs.stat(path.join(ROOT, f))).size;

await fs.writeFile(
  OUT,
  JSON.stringify({ version, files, bytes }, null, 2) + "\n",
);
console.log(
  `${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB, version ${version}`,
);
