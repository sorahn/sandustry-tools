import { expect, test } from "bun:test";
import { labelBitmap } from "../src/blueprint";
import { DOGICA_PIXEL_FONT } from "../src/fonts/dogica-pixel";

function rowsToBitmap(rows: readonly number[], width: number): number[][] {
  return rows.map((row) =>
    Array.from({ length: width }, (_, x) => (row & (1 << (width - x - 1)) ? 1 : 0)),
  );
}

function glyphBitmap(character: string): number[][] {
  const glyph = DOGICA_PIXEL_FONT.glyphFor(character);
  const padding = glyph.advance - glyph.width;
  return rowsToBitmap(glyph.rows, glyph.width).map((row) => [
    ...row,
    ...Array<number>(padding).fill(0),
  ]);
}

test("renders a Dogica glyph into a deterministic bitmap", () => {
  expect(labelBitmap("a", DOGICA_PIXEL_FONT)).toEqual(glyphBitmap("a"));
});

test("uses each Dogica glyph advance as horizontal spacing", () => {
  const glyph = DOGICA_PIXEL_FONT.glyphFor("a");
  const bitmap = labelBitmap("aa", DOGICA_PIXEL_FONT);

  expect(bitmap).toHaveLength(glyph.height);
  expect(bitmap[0]).toHaveLength(glyph.advance * 2);
  expect(bitmap.map((row) => row.slice(0, glyph.advance))).toEqual(glyphBitmap("a"));
  expect(bitmap.map((row) => row.slice(glyph.advance))).toEqual(glyphBitmap("a"));
  expect(
    bitmap.every((row) => row.slice(glyph.width, glyph.advance).every((cell) => cell === 0)),
  ).toBe(true);
});

test("renders an empty Dogica label as an empty bitmap", () => {
  expect(labelBitmap("", DOGICA_PIXEL_FONT)).toEqual([]);
});

test("maps unsupported characters to the Dogica blank glyph", () => {
  expect(labelBitmap("\u{1f600}", DOGICA_PIXEL_FONT)).toEqual(labelBitmap(" ", DOGICA_PIXEL_FONT));
});
