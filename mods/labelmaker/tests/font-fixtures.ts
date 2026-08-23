import { readFileSync } from "node:fs";
import { fontFromData, type LabelFontData } from "../src/fonts/font-data";

export function loadFontFixture(filename: string) {
  const url = new URL(`../src/fonts/${filename}`, import.meta.url);
  const data = JSON.parse(readFileSync(url, "utf8")) as LabelFontData;
  return fontFromData(data);
}
