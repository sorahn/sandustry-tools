#!/usr/bin/env node

// Extracts the lowercase glyphs from resources/ascii-text.webp. The source
// image is a sprite sheet: each native font pixel is rendered at about 4.25
// image pixels, and each row of cells has its own shared glyph top.
import { execFileSync } from "node:child_process";

const width = 827;
const height = 1662;
const pixelScale = 4.25;
const darknessCutoff = Number(process.env.LABELMAKER_DARKNESS_CUTOFF ?? 128);
const source = process.argv[2] ?? "resources/ascii-text.webp";
const gray = execFileSync("magick", [source, "-colorspace", "gray", "-depth", "8", "gray:-"], {
  maxBuffer: width * height + 1024,
});

const groups = [
  {
    characters: "ABCDEFGHIJKLMN",
    y0: 0,
    y1: 128,
    x: [0, 55, 109, 163, 217, 271, 325, 379, 433, 478, 532, 586, 640, 702, 756],
  },
  {
    characters: "OPQRSTUVWXYZ",
    y0: 128,
    y1: 256,
    x: [0, 59, 113, 175, 229, 283, 337, 395, 449, 520, 574, 628, 686],
  },
  {
    characters: "abcdefghijklmno",
    y0: 281,
    y1: 409,
    x: [0, 55, 109, 163, 217, 271, 316, 370, 424, 461, 502, 556, 597, 659, 713, 767],
  },
  {
    characters: "pqrstuvwxyz",
    y0: 409,
    y1: 537,
    x: [0, 55, 109, 158, 212, 257, 311, 365, 427, 485, 539, 593],
  },
  {
    characters: "0123456789",
    y0: 562,
    y1: 690,
    x: [0, 55, 100, 154, 208, 262, 316, 370, 424, 478, 532],
  },
  {
    characters: '$¢€£¥¤+-*/÷=%‰"',
    anchor: "/",
    y0: 715,
    y1: 843,
    x: [0, 55, 109, 167, 221, 275, 329, 383, 428, 477, 526, 580, 629, 687, 739, 784],
  },
  {
    characters: "'#@&_(),.;:¿?¡!\\|",
    anchor: "?",
    y0: 843,
    y1: 971,
    x: [0, 38, 92, 154, 220, 278, 323, 368, 409, 446, 487, 524, 579, 633, 683, 720, 769, 806],
  },
  {
    characters: "{}<>[]§¶µ' ^~®℗™",
    anchor: "[",
    y0: 971,
    y1: 1099,
    x: [0, 50, 99, 144, 189, 234, 279, 328, 386, 435, 472, 517, 571, 637, 703, 755],
  },
];

function isBlack(x, y) {
  return gray[y * width + x] < darknessCutoff;
}

function blockIsDark(x0, x1, y0, y1) {
  let total = 0;
  let count = 0;
  for (let y = y0; y < y1; y += 1)
    for (let x = x0; x < x1; x += 1) {
      total += gray[y * width + x];
      count += 1;
    }
  return total / count < darknessCutoff;
}

function boundsFor(group, index) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let y = group.y0 + 1; y < group.y1; y += 1)
    for (let x = group.x[index] + 1; x < group.x[index + 1]; x += 1)
      if (isBlack(x, y)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
  return { minX, minY, maxX, maxY };
}

for (const group of groups) {
  let top = Infinity;
  for (let index = 0; index < group.characters.length; index += 1)
    top = Math.min(top, boundsFor(group, index).minY);
  if (group.characters[0] === "p") top -= pixelScale;

  for (let index = 0; index < group.characters.length; index += 1) {
    const character = group.characters[index];
    const { minX, maxX, maxY } = boundsFor(group, index);
    const glyphWidth = Math.round((maxX - minX + 1) / pixelScale);
    const glyphHeight = Math.round((maxY - top + 1) / pixelScale);
    const rows = [];
    for (let row = 0; row < glyphHeight; row += 1) {
      let value = "";
      for (let column = 0; column < glyphWidth; column += 1) {
        const x0 = Math.floor(minX + column * pixelScale);
        const x1 = Math.ceil(minX + (column + 1) * pixelScale);
        const y0 = Math.floor(top + row * pixelScale);
        const y1 = Math.ceil(top + (row + 1) * pixelScale);
        value += blockIsDark(x0, x1, y0, y1) ? "1" : "0";
      }
      rows.push(value);
    }
    console.log(`  ${character}: ${JSON.stringify(rows)},`);
  }
}
