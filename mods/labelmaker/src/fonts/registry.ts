import { BUNDLED_FONT_CATALOG } from "./catalog";
import { fontFromData, type LabelFontData } from "./font-data";
import { loadPureTtfFont, type TtfAssetApi } from "./ttf";
import type { LabelFont } from "./types";

const loadedFonts = new Map<string, LabelFont>();

export type BundledFontOption = {
  readonly id: string;
  readonly label: string;
};

async function decodeFont(encoded: string): Promise<LabelFontData> {
  if (typeof DecompressionStream !== "function")
    throw new Error("Labelmaker requires browser gzip decompression support.");
  const binary = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  const stream = new Blob([binary]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text()) as LabelFontData;
}

export async function loadBundledFonts(api: TtfAssetApi): Promise<void> {
  await Promise.all(
    BUNDLED_FONT_CATALOG.map(async (entry) => {
      const data = entry.gzip
        ? await decodeFont(entry.gzip)
        : await loadPureTtfFont(api, entry.assetPath!, {
            name: entry.label,
            fontSize: entry.fontSize!,
            fixedWidth: entry.fixedWidth,
          });
      loadedFonts.set(entry.id, fontFromData(data));
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

export function getBundledFontOptions(): BundledFontOption[] {
  return BUNDLED_FONT_CATALOG.map(({ id, label }) => {
    const font = loadedFonts.get(id);
    const size = font?.fontSize === undefined ? "" : ` ${font.fontSize}px`;
    const mono = font?.fixedWidth ? " (mono)" : "";
    return { id, label: `${label}${size}${mono}` };
  });
}
