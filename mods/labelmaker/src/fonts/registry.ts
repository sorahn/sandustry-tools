import deltaruneGzip from "./deltarune.font.json";
import dogicaPixelGzip from "./dogica-pixel.font.json";
import minecraftGzip from "./minecraft.font.json";
import pixelComicSansGzip from "./pixel-comic-sans.font.json";
import pixollettaGzip from "./pixolletta.font.json";
import psyberiusSansGzip from "./psyberius-sans.font.json";
import { fontFromData, type LabelFontData } from "./font-data";
import type { LabelFont } from "./types";

const BUNDLED_FONT_DATA: Readonly<Record<string, string>> = {
  "psyberius-sans": psyberiusSansGzip as unknown as string,
  deltarune: deltaruneGzip as unknown as string,
  "dogica-pixel": dogicaPixelGzip as unknown as string,
  minecraft: minecraftGzip as unknown as string,
  "pixel-comic-sans": pixelComicSansGzip as unknown as string,
  pixolletta: pixollettaGzip as unknown as string,
};

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
    Object.entries(BUNDLED_FONT_DATA).map(async ([id, encoded]) => {
      loadedFonts.set(id, fontFromData(await decodeFont(encoded)));
    }),
  );
}

export function getBundledFont(id = "psyberius-sans"): LabelFont {
  const font = loadedFonts.get(id);
  if (!font) throw new Error(`Labelmaker font is not loaded: ${id}`);
  return font;
}

export function getBundledFontIds(): string[] {
  return Object.keys(BUNDLED_FONT_DATA);
}
