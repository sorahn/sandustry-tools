import { BUNDLED_FONT_CATALOG } from "./catalog";
import { fontFromData, type LabelFontData } from "./font-data";
import type { LabelFont } from "./types";

const loadedFonts = new Map<string, LabelFont>();

async function decodeFont(encoded: string): Promise<LabelFontData> {
  if (typeof DecompressionStream !== "function")
    throw new Error("Labelmaker requires browser gzip decompression support.");
  const binary = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  const stream = new Blob([binary]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text()) as LabelFontData;
}

export async function loadBundledFonts(): Promise<void> {
  await Promise.all(
    BUNDLED_FONT_CATALOG.map(async ({ id, gzip }) => {
      loadedFonts.set(id, fontFromData(await decodeFont(gzip)));
    }),
  );
}

export function getBundledFont(id = BUNDLED_FONT_CATALOG[0]?.id): LabelFont {
  const font = loadedFonts.get(id);
  if (!font) throw new Error(`Labelmaker font is not loaded: ${id}`);
  return font;
}

export function getBundledFontIds(): string[] {
  return BUNDLED_FONT_CATALOG.map(({ id }) => id);
}
