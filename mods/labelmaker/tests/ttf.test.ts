import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";
import { extractPureTtfFont } from "../src/fonts/ttf";

test("pure TTF extraction converts a packaged font into the label schema", async () => {
  const file = await readFile(new URL("../assets/fonts/press-start-2p.ttf", import.meta.url));
  const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  const font = extractPureTtfFont(buffer, {
    name: "Press Start 2P",
    fontSize: 8,
    fixedWidth: true,
  });

  expect(Object.keys(font.glyphs)).toHaveLength(96);
  expect(font.glyphs.A).toEqual({
    width: 7,
    height: 8,
    rows: [28, 54, 99, 99, 127, 99, 99, 0],
    advance: 8,
  });
  expect(font.blankGlyph.advance).toBe(8);
});

test("pure TTF extraction preserves a shared baseline for descenders", async () => {
  const file = await readFile(new URL("../assets/fonts/press-start-2p.ttf", import.meta.url));
  const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  const font = extractPureTtfFont(buffer, { name: "Press Start 2P", fontSize: 8 });

  expect(font.glyphs.A.height).toBe(font.glyphs.j.height);
  expect(font.glyphs.A.rows.at(-1)).toBe(0);
  expect(font.glyphs.j.rows.at(-1)).not.toBe(0);
});
