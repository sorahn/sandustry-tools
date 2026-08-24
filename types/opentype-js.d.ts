declare module "opentype.js" {
  export type PathCommand =
    | { type: "M" | "L"; x: number; y: number }
    | { type: "Q"; x1: number; y1: number; x: number; y: number }
    | {
        type: "C";
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        x: number;
        y: number;
      }
    | { type: "Z" };

  export type GlyphPath = {
    commands: readonly PathCommand[];
  };

  export type Glyph = {
    advanceWidth: number;
    getPath(x: number, y: number, fontSize: number): GlyphPath;
  };

  export type Font = {
    unitsPerEm: number;
    charToGlyph(character: string): Glyph;
  };

  const opentype: {
    parse(buffer: ArrayBuffer): Font;
  };

  export default opentype;
}
