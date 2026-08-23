import type { LabelFont, LabelGlyph } from "./types";

export type LabelFontData = {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly glyphs: Readonly<Record<string, LabelGlyph>>;
  readonly blankGlyph: LabelGlyph;
  readonly fontSize?: number;
  readonly baselineRow?: number;
  readonly yOffset?: number;
  readonly fixedWidth?: boolean;
};

export function fontFromData(data: LabelFontData): LabelFont {
  const glyphFor = (character: string): LabelGlyph => data.glyphs[character] ?? data.blankGlyph;
  return {
    glyphs: data.glyphs,
    blankGlyph: data.blankGlyph,
    fontSize: data.fontSize,
    glyphFor,
    baselineRow: data.baselineRow,
    yOffset: data.yOffset,
    fixedWidth: data.fixedWidth,
  };
}
