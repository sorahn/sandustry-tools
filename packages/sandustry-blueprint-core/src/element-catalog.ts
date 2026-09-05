export type ElementCatalogEntry = {
  type: number;
  id?: string;
  name: string;
  color: string;
  matterType?: number;
};

export type ElementCatalog = {
  get: (type: number | string) => ElementCatalogEntry | undefined;
};

export const MATTER_TYPE = {
  SOLID: 1,
  LIQUID: 2,
  PARTICLE: 3,
  GAS: 4,
  STATIC: 5,
  SLUSHY: 6,
  WISP: 7,
  POWDER: 8,
} as const;

export const ELEMENT_ENTRIES: ElementCatalogEntry[] = [
  { type: 1, name: "Sand", color: "#f4a460", matterType: 1 },
  { type: 2, name: "[NO KEY]", color: "#aaaaaa", matterType: 3 },
  { type: 3, name: "Water", color: "#1e90ff", matterType: 2 },
  { type: 4, name: "Wet Sand", color: "#cd853f", matterType: 6 },
  { type: 5, name: "Redsand", color: "#a04040", matterType: 1 },
  { type: 6, name: "Residue", color: "#cccccc", matterType: 6 },
  { type: 7, name: "Gold", color: "#ffd700", matterType: 1 },
  { type: 8, name: "Voidbloom", color: "#7a00a8", matterType: 6 },
  { type: 10, name: "Steam", color: "#f7f7f7", matterType: 4 },
  { type: 11, name: "Fire", color: "#ff4500", matterType: 4 },
  { type: 12, name: "Snow", color: "#e0ffff", matterType: 8 },
  { type: 13, name: "Flame", color: "#ffa500", matterType: 1 },
  { type: 14, name: "Burnt Residue", color: "#808080", matterType: 1 },
  { type: 15, name: "Seed", color: "#7fff00", matterType: 1 },
  { type: 16, name: "Wet Seed", color: "#66cc66", matterType: 6 },
  { type: 17, name: "Seedling", color: "#1b5e20", matterType: 5 },
  { type: 18, name: "Amethelis", color: "#cc5cdb", matterType: 7 },
  { type: 19, name: "Lava", color: "#ff3300", matterType: 2 },
  { type: 20, name: "Cinder", color: "#8b0000", matterType: 1 },
  { type: 21, id: "caulk", name: "Caulk", color: "#ff8c00", matterType: 1 },
  { type: 22, id: "florin", name: "Florin", color: "#c9a0ff", matterType: 4 },
  { type: 23, id: "florinol", name: "Florinol", color: "#9b4fe0", matterType: 2 },
  { type: 24, id: "dryPetalium", name: "Dry Amethelis", color: "#ffb3d9", matterType: 7 },
  { type: 25, id: "liquidGold", name: "Liquid Gold", color: "#ffd700", matterType: 2 },
  { type: 26, id: "aurixite", name: "Aurixite", color: "#8b82e0", matterType: 9 },
  { type: 27, id: "pyronol", name: "Pyronol", color: "#3050c8", matterType: 2 },
  { type: 28, id: "voidSeeds", name: "Void Seed", color: "#9932cc", matterType: 6 },
  { type: 29, id: "growingVoidSeed", name: "Growing Void Seed", color: "#5b2c8c", matterType: 5 },
  { type: 30, id: "voidPetal", name: "Void Petal", color: "#00ced1", matterType: 7 },
  { type: 31, id: "moonhop", name: "Moonhop", color: "#e0b8e8", matterType: 1 },
  { type: 32, id: "voidjuice", name: "Voidjuice", color: "#9b5fcf", matterType: 2 },
  { type: 33, id: "sunsand", name: "Sunsand", color: "#f4a460", matterType: 1 },
  { type: 34, id: "waterPressure", name: "Water Pressure", color: "#1e90ff", matterType: 2 },
  { type: 35, id: "slowFlow", name: "Slow Flow", color: "#1e90ff", matterType: 2 },
  { type: 36, id: "copper", name: "Copper", color: "#b87333", matterType: 1 },
  { type: 37, id: "liquidCopper", name: "Liquid Copper", color: "#b87333", matterType: 2 },
  { type: 38, id: "retroConsoleCasing", name: "Console Casing", color: "#555555", matterType: 5 },
  {
    type: 39,
    id: "retroConsolePixelOn",
    name: "Console Pixel (On)",
    color: "#00ff00",
    matterType: 5,
  },
  {
    type: 40,
    id: "retroConsolePixelOff",
    name: "Console Pixel (Off)",
    color: "#113311",
    matterType: 5,
  },
  { type: 41, id: "pressurizedWater", name: "Pressurized Water", color: "#1e90ff", matterType: 2 },
  { type: 42, id: "hyperpressure", name: "Hyperpressure", color: "#1e90ff", matterType: 2 },
  { type: 43, id: "reactorCore", name: "Reactor Core", color: "#1e90ff", matterType: 2 },
  {
    type: 44,
    id: "irradiatedCrystal",
    name: "Irradiated Crystal",
    color: "#ff69b4",
    matterType: 1,
  },
  { type: 45, id: "coolant", name: "Coolant", color: "#0033aa", matterType: 2 },
  { type: 46, id: "auralite", name: "Auralite", color: "#ff66b3", matterType: 8 },
  { type: 47, id: "cloud", name: "Cloud", color: "#e8eef5", matterType: 8 },
  { type: 48, id: "prismite", name: "Prismite", color: "#ff66cc", matterType: 6 },
  { type: 49, id: "prismaline", name: "Prismaline", color: "#ff99cc", matterType: 4 },
  { type: 50, id: "voidhusk", name: "Voidhusk", color: "#b14be5", matterType: 6 },
  { type: 51, id: "oil", name: "Oil", color: "#1a1410", matterType: 2 },
  { type: 52, id: "auraline", name: "Auraline", color: "#d8b4ff", matterType: 1 },
  { type: 53, id: "solidite", name: "Solidite", color: "#de9d10", matterType: 1 },
];

const elementsByType = new Map<number, ElementCatalogEntry>();
const elementsById = new Map<string, ElementCatalogEntry>();

for (const entry of ELEMENT_ENTRIES) {
  elementsByType.set(entry.type, entry);
  if (entry.id) elementsById.set(entry.id, entry);
}

export const DEFAULT_ELEMENT_CATALOG: ElementCatalog = {
  get(key: number | string) {
    if (typeof key === "number") return elementsByType.get(key);
    const parsed = Number(key);
    if (!Number.isNaN(parsed) && elementsByType.has(parsed)) {
      return elementsByType.get(parsed);
    }
    return elementsById.get(key);
  },
};

export const DEFAULT_FALLBACK_ELEMENT_COLOR = "#888888";

export function resolveElement(
  key: number | string,
  catalog: ElementCatalog = DEFAULT_ELEMENT_CATALOG,
): { name: string; color: string; matterType?: number } {
  const match = catalog.get(key);
  if (match) {
    return {
      name: match.name,
      color: match.color,
      matterType: match.matterType,
    };
  }
  return {
    name: typeof key === "number" ? `ID:${key}` : String(key),
    color: DEFAULT_FALLBACK_ELEMENT_COLOR,
    matterType: undefined,
  };
}
