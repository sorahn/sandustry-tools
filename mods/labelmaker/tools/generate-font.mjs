#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const [fontPath, outputPath, pointSizeArg = "8", fontNameArg = "generated", glyphHeightArg] =
  process.argv.slice(2);
if (!fontPath || !outputPath) {
  console.error("usage: generate-font.mjs FONT.ttf OUTPUT.ts [POINT_SIZE]");
  process.exit(2);
}

readFileSync(fontPath);
const pointSize = Number(pointSizeArg);
const glyphHeight = Number(glyphHeightArg ?? pointSize);
const fontName = fontNameArg
  .replace(/[^a-zA-Z0-9]+(.)/g, (_, character) => character.toUpperCase())
  .replace(/^[^a-zA-Z_]+/, "");
const exportName = fontNameArg.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
const characters = Array.from({ length: 96 }, (_, index) => String.fromCodePoint(32 + index));
const glyphTextPath = "/private/tmp/labelmaker-font-glyph.txt";

function render(character) {
  writeFileSync(glyphTextPath, character);
  const output = execFileSync(
    "magick",
    [
      "-font",
      fontPath,
      "-pointsize",
      String(pointSize),
      "-background",
      "none",
      "-fill",
      "white",
      `label:@${glyphTextPath}`,
      "-alpha",
      "extract",
      "-threshold",
      "50%",
      "txt:-",
    ],
    { encoding: "utf8" },
  );
  const pixels = [];
  let width = 0;
  let height = 0;
  for (const line of output.split("\n")) {
    const match = line.match(/^(\d+),(\d+): \((\d+)/);
    if (!match) {
      const header = line.match(/enumeration: (\d+),(\d+)/);
      if (header) {
        width = Number(header[1]);
        height = Number(header[2]);
      }
      continue;
    }
    pixels.push({ x: Number(match[1]), y: Number(match[2]), on: Number(match[3]) > 32767 });
  }
  let visualLeft = width;
  let visualRight = -1;
  let visualBottom = -1;
  for (const pixel of pixels) {
    if (!pixel.on) continue;
    visualLeft = Math.min(visualLeft, pixel.x);
    visualRight = Math.max(visualRight, pixel.x);
    visualBottom = Math.max(visualBottom, pixel.y);
  }
  if (visualRight < visualLeft) return { width: 0, height: 0, rows: [], advance: width };
  const visualWidth = visualRight - visualLeft + 1;
  const outputHeight = Math.max(glyphHeight, visualBottom + 1);
  const packedRows = Array.from({ length: outputHeight }, () => 0);
  for (const pixel of pixels) {
    if (pixel.on) packedRows[pixel.y] |= 1 << (visualRight - pixel.x);
  }
  return { width: visualWidth, height: outputHeight, rows: packedRows, advance: width };
}

const glyphs = {};
let fallbackAdvance = 1;
for (const character of characters) {
  if (character === "\u007f") continue;
  if (character === " ") {
    const pair = (text) =>
      Number(
        (writeFileSync(glyphTextPath, text),
        execFileSync(
          "magick",
          [
            "-font",
            fontPath,
            "-pointsize",
            String(pointSize),
            "-background",
            "none",
            `label:@${glyphTextPath}`,
            "-format",
            "%w",
            "info:",
          ],
          {
            encoding: "utf8",
          },
        )),
      );
    fallbackAdvance = pair("X X") - pair("XX");
    continue;
  }
  glyphs[character] = render(character);
}

const blankGlyph = {
  width: 0,
  height: glyphHeight,
  rows: Array(glyphHeight).fill(0),
  advance: fallbackAdvance,
};

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
};
`;
writeFileSync(outputPath, output);
