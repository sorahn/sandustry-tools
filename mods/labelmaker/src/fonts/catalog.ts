import dogicaPixelGzip from "./dogica-pixel.font.json";
import kiwiSodaGzip from "./kiwisoda.font.json";
import macsMinecraftGzip from "./macs-minecraft.font.json";
import minecraftGzip from "./minecraft.font.json";
import pixollettaGzip from "./pixolletta.font.json";

export type BundledFontEntry = {
  readonly id: string;
  readonly label: string;
  readonly gzip: string;
};

/** Ordered inclusion list; this order is also the future font-picker order. */
export const BUNDLED_FONT_CATALOG: readonly BundledFontEntry[] = [
  { id: "minecraft", label: "Minecraft", gzip: minecraftGzip as unknown as string },
  { id: "kiwisoda", label: "KiwiSoda", gzip: kiwiSodaGzip as unknown as string },
  { id: "pixolletta", label: "Pixolletta", gzip: pixollettaGzip as unknown as string },
  { id: "dogica-pixel", label: "Dogica Pixel", gzip: dogicaPixelGzip as unknown as string },
  { id: "macs-minecraft", label: "Mac's Minecraft", gzip: macsMinecraftGzip as unknown as string },
];
