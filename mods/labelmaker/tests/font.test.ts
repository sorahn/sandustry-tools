import { expect, test } from "bun:test";
import { glyphFor } from "../src/font";

test("calibrated lowercase glyphs preserve the supplied e and j rows", () => {
  expect(glyphFor("e")).toEqual([
    "00000",
    "00000",
    "01110",
    "10001",
    "11111",
    "10000",
    "10001",
    "01110",
  ]);
  expect(glyphFor("j")).toEqual(["01", "00", "01", "01", "01", "01", "01", "01", "01", "01", "10"]);
});

test("every lowercase letter has a glyph", () => {
  for (const character of "abcdefghijklmnopqrstuvwxyz")
    expect(glyphFor(character).some((row) => row.includes("1"))).toBe(true);
});
