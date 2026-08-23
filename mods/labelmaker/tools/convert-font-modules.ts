import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const fontRoot = resolve(import.meta.dir, "../src/fonts");
const fonts = [
  ["psyberius-sans", "psyberius-sans.ts", "PSYBERIUS_SANS_FONT"],
  ["deltarune", "deltarune.ts", "DELTARUNE_FONT"],
  ["dogica-pixel", "dogica-pixel.ts", "DOGICA_PIXEL_FONT"],
  ["minecraft", "minecraft.ts", "MINECRAFT_FONT"],
  ["pixel-comic-sans", "pixel-comic-sans.ts", "PIXEL_COMIC_SANS_FONT"],
  ["pixolletta", "pixolletta.ts", "PIXOLLETTA_FONT"],
] as const;

await mkdir(fontRoot, { recursive: true });
for (const [id, filename, exportName] of fonts) {
  const module = await import(`${fontRoot}/${filename}`);
  const font = module[exportName];
  if (!font) throw new Error(`Missing ${exportName} in ${filename}`);
  const data = {
    schemaVersion: 1,
    name: id,
    glyphs: font.glyphs,
    blankGlyph: font.blankGlyph,
    ...(font.baselineRow === undefined ? {} : { baselineRow: font.baselineRow }),
    ...(font.fixedWidth === undefined ? {} : { fixedWidth: font.fixedWidth }),
  };
  await writeFile(`${fontRoot}/${id}.font.json`, `${JSON.stringify(data, null, 2)}\n`);
}
