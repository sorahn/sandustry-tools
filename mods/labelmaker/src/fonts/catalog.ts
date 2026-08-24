import dogicaPixelGzip from "./dogica-pixel.font.json";
import kiwiSodaGzip from "./kiwisoda.font.json";
import macsMinecraftGzip from "./macs-minecraft.font.json";
import minecraftGzip from "./minecraft.font.json";

export type BundledFontEntry = {
  readonly id: string;
  readonly label: string;
  readonly gzip?: string;
  readonly assetPath?: string;
  readonly fontSize?: number;
  readonly gridUnits?: number;
  readonly geometryTolerance?: number;
  readonly fixedWidth?: boolean;
  readonly bold?: boolean;
  readonly retro?: boolean;
};

/** Ordered inclusion list; this order is also the font-picker order. */
export const BUNDLED_FONT_CATALOG: readonly BundledFontEntry[] = [
  {
    id: "silkscreen",
    label: "Silkscreen",
    assetPath: "assets/fonts/silkscreen.ttf",
    fontSize: 8,
    gridUnits: 125,
    // Silkscreen encodes some intended grid points as 3.96 instead of 4.0.
    geometryTolerance: 0.05,
  },
  {
    id: "micro5",
    label: "Micro5",
    assetPath: "assets/fonts/micro5.ttf",
    fontSize: 11,
    gridUnits: 150,
  },
  {
    id: "pixolletta",
    label: "Pixolletta",
    assetPath: "assets/fonts/pixolletta.ttf",
    fontSize: 10,
    gridUnits: 100,
  },
  {
    id: "minecraftia",
    label: "Minecraftia",
    assetPath: "assets/fonts/minecraftia.ttf",
    fontSize: 8,
    gridUnits: 192,
  },
  {
    id: "pixel-operator-bold",
    label: "Pixel Operator",
    assetPath: "assets/fonts/PixelOperator-Bold.ttf",
    fontSize: 16,
    gridUnits: 100,
    bold: true,
  },
  {
    id: "pixel-operator",
    label: "Pixel Operator",
    assetPath: "assets/fonts/PixelOperator.ttf",
    fontSize: 16,
    gridUnits: 100,
  },
  {
    id: "pixel-operator-8-bold",
    label: "Pixel Operator 8",
    assetPath: "assets/fonts/PixelOperator8-Bold.ttf",
    fontSize: 8,
    gridUnits: 100,
    bold: true,
  },
  {
    id: "pixel-operator-8",
    label: "Pixel Operator 8",
    assetPath: "assets/fonts/PixelOperator8.ttf",
    fontSize: 8,
    gridUnits: 100,
  },
  {
    id: "pixel-operator-hb",
    label: "Pixel Operator HB",
    assetPath: "assets/fonts/PixelOperatorHB.ttf",
    fontSize: 16,
    gridUnits: 100,
  },
  {
    id: "pixel-operator-hb8",
    label: "Pixel Operator HB8",
    assetPath: "assets/fonts/PixelOperatorHB8.ttf",
    fontSize: 8,
    gridUnits: 100,
  },
  {
    id: "pixel-operator-hbsc",
    label: "Pixel Operator HBSC",
    assetPath: "assets/fonts/PixelOperatorHBSC.ttf",
    fontSize: 16,
    gridUnits: 100,
  },
  {
    id: "pixel-operator-mono-8-bold",
    label: "Pixel Operator Mono8",
    assetPath: "assets/fonts/PixelOperatorMono8-Bold.ttf",
    fontSize: 8,
    gridUnits: 100,
    fixedWidth: true,
    bold: true,
  },
  {
    id: "pixel-operator-mono-hb",
    label: "Pixel Operator Mono HB",
    assetPath: "assets/fonts/PixelOperatorMonoHB.ttf",
    fontSize: 16,
    gridUnits: 100,
    fixedWidth: true,
  },
  {
    id: "pixel-operator-mono-hb8",
    label: "Pixel Operator Mono HB8",
    assetPath: "assets/fonts/PixelOperatorMonoHB8.ttf",
    fontSize: 8,
    gridUnits: 100,
    fixedWidth: true,
  },
  {
    id: "pixel-operator-sc-bold",
    label: "Pixel Operator SC",
    assetPath: "assets/fonts/PixelOperatorSC-Bold.ttf",
    fontSize: 16,
    gridUnits: 100,
    bold: true,
  },
  {
    id: "pixel-operator-sc",
    label: "Pixel Operator SC",
    assetPath: "assets/fonts/PixelOperatorSC.ttf",
    fontSize: 16,
    gridUnits: 100,
  },
  {
    id: "pix32",
    label: "Pix32",
    assetPath: "assets/fonts/pix32.ttf",
    fontSize: 12,
    gridUnits: 100,
  },
  {
    id: "rainy-hearts",
    label: "Rainy Hearts",
    assetPath: "assets/fonts/rainy-hearts.ttf",
    fontSize: 16,
    gridUnits: 64,
  },
  { id: "emoji", label: "Emoji", assetPath: "assets/fonts/emoji.ttf", fontSize: 16, gridUnits: 64 },
  {
    id: "alagard",
    label: "Alagard",
    assetPath: "assets/fonts/alagard.ttf",
    fontSize: 16,
    gridUnits: 64,
  },
  {
    id: "grape-soda",
    label: "Grape Soda",
    assetPath: "assets/fonts/grape-soda.ttf",
    fontSize: 16,
    gridUnits: 64,
  },
  {
    id: "press-start-2p",
    label: "Press Start 2P",
    assetPath: "assets/fonts/press-start-2p.ttf",
    fontSize: 8,
    gridUnits: 64,
    fixedWidth: true,
  },
  {
    id: "minecraft",
    label: "Minecraft",
    gzip: minecraftGzip as unknown as string,
    retro: true,
  },
  {
    id: "kiwisoda",
    label: "KiwiSoda",
    gzip: kiwiSodaGzip as unknown as string,
    retro: true,
  },
  {
    id: "dogica-pixel",
    label: "Dogica Pixel",
    gzip: dogicaPixelGzip as unknown as string,
    retro: true,
  },
  {
    id: "macs-minecraft",
    label: "Mac's Minecraft",
    gzip: macsMinecraftGzip as unknown as string,
    retro: true,
  },
];
