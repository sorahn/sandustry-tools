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
  /** Zero-based glyph row used as this font's baseline. */
  readonly baselineRow?: number;
  /** Whether every glyph reserves the same horizontal advance. */
  readonly fixedWidth?: boolean;
};
