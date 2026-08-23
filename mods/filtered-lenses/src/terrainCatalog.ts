import type { TerrainEntry } from "./ui/picker/pickerTypes";

export const NO_FILTER_ID = "no-filter";
export const EARTH_FILTER_ID = "filter:earth";
export const EARTH_FILTER_TERRAIN_IDS = ["dirt", "grass", "moss", "vine", "earth"];

export const TERRAIN_IDS = [
  "auraliteCrystal",
  "bedrock",
  "blackrock",
  "caldera",
  "copper",
  "crackstone",
  "crystal",
  "dirt",
  "dissolvingTerrain",
  "dune",
  "earth",
  "florinolSoil",
  "fluxite",
  "frostbed",
  "gameOfLifeRandom",
  "gameOfLifeStrict",
  "glassTerrain",
  "golGrow",
  "grass",
  "ice",
  "limestone",
  "moss",
  "puffMushroom",
  "redsoil",
  "sand2",
  "sandstone",
  "scoria",
  "shatterstone",
  "solidite",
  "sporemound",
  "spreadingTerrain",
  "stone",
  "vine",
  "voidFlowerSoil",
];

// Keep this list shared by the picker, persistence validation, and excavation.
export const BLACKLISTED_TERRAIN_IDS = new Set([
  "bedrock",
  "blackrock",
  "caldera",
  "dissolvingTerrain",
  "dune",
  "gameOfLifeRandom",
  "gameOfLifeStrict",
  "glassTerrain",
  "golGrow",
  "limestone",
  "puffMushroom",
  "sand2",
  "sandstone",
  "solidite",
  "spreadingTerrain",
]);

// Picker swatches only; terrain rendering may use patterns, lighting, or shaders.
export const TERRAIN_COLORS: Record<string, string> = {
  auraliteCrystal: "#4a40b0",
  bedrock: "#222222",
  blackrock: "#141414",
  copper: "#ffa500",
  crackstone: "#fffab3",
  dirt: "#926426",
  dune: "#eed975",
  earth: "#59452e",
  florinolSoil: "#339999",
  fluxite: "#8a2be2",
  frostbed: "#add8e6",
  grass: "#228b22",
  ice: "#afeeee",
  moss: "#1dae1d",
  redsoil: "#8b0000",
  scoria: "#2b2b2b",
  shatterstone: "#b6bcc1",
  sporemound: "#556b2f",
  stone: "#808080",
  vine: "#1dae1d",
  voidFlowerSoil: "#46304d",
};

export const NO_FILTER_ENTRY: TerrainEntry = {
  id: NO_FILTER_ID,
  type: -1,
  name: "[No filter]",
  color: "#9aa7b5",
};

export const EARTH_FILTER_ENTRY: TerrainEntry = {
  id: EARTH_FILTER_ID,
  type: -2,
  name: "Earth",
  color: "#6b8e23",
};
