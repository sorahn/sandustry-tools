#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";

const [manifestPath, descriptionPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !descriptionPath || !outputPath) {
  console.error("Usage: render-modinfo.mjs <manifest> <description> <output>");
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.description = readFileSync(descriptionPath, "utf8").trim();
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
