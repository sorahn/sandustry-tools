import { expect, test } from "bun:test";
import { DOGICA_PIXEL_FONT } from "../src/fonts/dogica-pixel";

test("dogica lowercase glyphs use packed rows and measured advances", () => {
  const e = DOGICA_PIXEL_FONT.glyphFor("e");
  expect(e.width).toBeGreaterThan(0);
  expect(e.height).toBeGreaterThan(0);
  expect(e.rows).toHaveLength(e.height);
  expect(e.advance).toBeGreaterThanOrEqual(e.width);
});

test("every lowercase letter has a glyph", () => {
  for (const character of "abcdefghijklmnopqrstuvwxyz")
    expect(DOGICA_PIXEL_FONT.glyphFor(character).rows.some((row) => row !== 0)).toBe(true);
});
