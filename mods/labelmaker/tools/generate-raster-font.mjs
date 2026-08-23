#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const [imagePath, outputPath, fontNameArg = "generated"] = process.argv.slice(2);
if (!imagePath || !outputPath) {
  console.error("usage: generate-raster-font.mjs IMAGE.png OUTPUT.json [FONT_NAME]");
  process.exit(2);
}

const cellSize = 8;
const imageWidth = 128;
const imageHeight = 112;
const rgba = execFileSync("magick", [imagePath, "-depth", "8", "rgba:-"]);
if (rgba.length !== imageWidth * imageHeight * 4)
  throw new Error(`expected ${imageWidth}×${imageHeight} RGBA pixels, got ${rgba.length / 4}`);

function isFilled(x, y) {
  return rgba[(y * imageWidth + x) * 4] < 100;
}

function render(character) {
  const code = character.codePointAt(0) - 32;
  const cellX = (code % 16) * cellSize;
  const cellY = Math.floor(code / 16) * cellSize;
  let left = cellSize;
  let right = -1;
  for (let y = 0; y < cellSize; y += 1)
    for (let x = 0; x < cellSize; x += 1)
      if (isFilled(cellX + x, cellY + y)) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }

  if (right < left)
    return { width: 0, height: cellSize, rows: Array(cellSize).fill(0), advance: cellSize };
  const rows = Array.from({ length: cellSize }, () => 0);
  for (let y = 0; y < cellSize; y += 1)
    for (let x = left; x <= right; x += 1)
      if (isFilled(cellX + x, cellY + y)) rows[y] |= 1 << (right - x);
  return { width: right - left + 1, height: cellSize, rows, advance: cellSize };
}

const glyphs = {};
for (let code = 32; code <= 127; code += 1)
  glyphs[String.fromCodePoint(code)] = render(String.fromCodePoint(code));
const blankGlyph = glyphs[" "];
writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      schemaVersion: 1,
      name: fontNameArg,
      glyphs,
      blankGlyph,
      fixedWidth: true,
    },
    null,
    2,
  )}\n`,
);
