#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const [imagePath, outputPath, fontNameArg = "generated"] = process.argv.slice(2);
if (!imagePath || !outputPath) {
  console.error("usage: generate-raster-font.mjs IMAGE.png OUTPUT.ts [FONT_NAME]");
  process.exit(2);
}

const cellSize = 8;
const imageWidth = 128;
const imageHeight = 112;
const fontName = fontNameArg
  .replace(/[^a-zA-Z0-9]+(.)/g, (_, character) => character.toUpperCase())
  .replace(/^[^a-zA-Z_]+/, "");
const exportName = fontNameArg.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
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
const output = `import type { LabelFont, LabelGlyph } from "./types";

export const ${exportName}_GLYPHS: Readonly<Record<string, LabelGlyph>> = ${JSON.stringify(glyphs, null, 2)};

export const ${exportName}_BLANK_GLYPH: LabelGlyph = ${JSON.stringify(blankGlyph, null, 2)};

export function ${fontName}GlyphFor(character: string): LabelGlyph {
  return ${exportName}_GLYPHS[character] ?? ${exportName}_BLANK_GLYPH;
}

export const ${exportName}_FONT: LabelFont = {
  glyphs: ${exportName}_GLYPHS,
  blankGlyph: ${exportName}_BLANK_GLYPH,
  glyphFor: ${fontName}GlyphFor,
  fixedWidth: true,
};
`;
writeFileSync(outputPath, output);
