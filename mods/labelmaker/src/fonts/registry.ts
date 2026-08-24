import { BUNDLED_FONT_CATALOG } from "./catalog";
import { fontFromData, type LabelFontData } from "./font-data";
import { loadPureTtfFont, type TtfAssetApi } from "./ttf";
import type { LabelFont } from "./types";

const loadedFonts = new Map<string, LabelFont>();

export type BundledFontOption = {
  readonly id: string;
  readonly label: string;
  readonly fontSize: number;
  readonly fixedWidth?: boolean;
  readonly bold?: boolean;
  readonly retro?: boolean;
};

export type BundledFontGroup = {
  readonly label: string;
  readonly options: readonly BundledFontOption[];
};

export async function loadBundledFonts(api: TtfAssetApi): Promise<void> {
  await Promise.all(
    BUNDLED_FONT_CATALOG.map(async (entry) => {
      const data = entry.gzip
        ? await decodeFont(entry.gzip)
        : await loadPureTtfFont(api, entry.assetPath!, {
            name: entry.label,
            fontSize: entry.fontSize!,
            gridUnits: entry.gridUnits,
            geometryTolerance: entry.geometryTolerance,
            fixedWidth: entry.fixedWidth,
            strictAdvances: true,
            strictGeometry: true,
          });
      loadedFonts.set(entry.id, fontFromData(data));
    }),
  );
}

async function decodeFont(encoded: string): Promise<LabelFontData> {
  if (typeof DecompressionStream !== "function")
    throw new Error("Labelmaker requires browser gzip decompression support.");
  const binary = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  const stream = new Blob([binary]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text()) as LabelFontData;
}

export function getBundledFont(id = BUNDLED_FONT_CATALOG[0]?.id): LabelFont {
  const font = loadedFonts.get(id);
  if (!font) throw new Error(`Labelmaker font is not loaded: ${id}`);
  return font;
}

export function getBundledFontIds(): string[] {
  return BUNDLED_FONT_CATALOG.map(({ id }) => id);
}

export function getBundledFontOptions(): BundledFontGroup[] {
  const groups = new Map<number, BundledFontOption[]>();
  const retroOptions: BundledFontOption[] = [];
  for (const { id, label, fontSize, fixedWidth, bold, retro } of BUNDLED_FONT_CATALOG) {
    const font = loadedFonts.get(id);
    const resolvedFontSize = font?.fontSize ?? fontSize ?? 0;
    const mono = font?.fixedWidth ? " (mono)" : "";
    const weight = bold ? " (bold)" : "";
    const sizeLabel = retro ? ` ${resolvedFontSize}px` : "";
    const option = {
      id,
      label: `${label}${sizeLabel}${weight}${mono}`,
      fontSize: resolvedFontSize,
      fixedWidth,
      bold,
      retro,
    };
    const options = retro ? retroOptions : (groups.get(resolvedFontSize) ?? []);
    options.push(option);
    if (!retro) groups.set(resolvedFontSize, options);
  }
  const result = [...groups.entries()]
    .sort(([sizeA], [sizeB]) => sizeA - sizeB)
    .map(([fontSize, options]) => ({
      label: `${fontSize}px`,
      options: options.sort((a, b) => a.label.localeCompare(b.label)),
    }));
  if (retroOptions.length)
    result.push({
      label: "Custom catalog",
      options: retroOptions.sort((a, b) => a.label.localeCompare(b.label)),
    });
  return result;
}
