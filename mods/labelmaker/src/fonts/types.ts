export type LabelGlyph = {
  readonly width: number;
  readonly height: number;
  readonly rows: readonly number[];
  readonly advance: number;
};

export type LabelFont = {
  readonly glyphs: Readonly<Record<string, LabelGlyph>>;
  readonly blankGlyph: LabelGlyph;
  readonly glyphFor: (character: string) => LabelGlyph;
  /** Point size used when the font was extracted. */
  readonly fontSize?: number;
  /** Zero-based glyph row used as this font's baseline. */
  readonly baselineRow?: number;
  /** Vertical offset, in bitmap rows, applied when composing glyphs. */
  readonly yOffset?: number;
  /** Whether every glyph reserves the same horizontal advance. */
  readonly fixedWidth?: boolean;
};
