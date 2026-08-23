import type { LabelFont, LabelGlyph } from "./types";

export type LabelFontData = {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly glyphs: Readonly<Record<string, LabelGlyph>>;
  readonly blankGlyph: LabelGlyph;
  readonly baselineRow?: number;
  readonly fixedWidth?: boolean;
};

export function fontFromData(data: LabelFontData): LabelFont {
  const glyphFor = (character: string): LabelGlyph => data.glyphs[character] ?? data.blankGlyph;
  return {
    glyphs: data.glyphs,
    blankGlyph: data.blankGlyph,
    glyphFor,
    baselineRow: data.baselineRow,
    fixedWidth: data.fixedWidth,
  };
}
