import type { SaveExplorerCellKind } from "./model";

const TERRAIN_NAMES: Readonly<Record<number, string>> = {
  2: "Dirt",
  3: "Sporemound",
  4: "Fog",
  5: "Jetpack Fog",
  6: "Water (Fog)",
  7: "Frostbed",
  8: "Divider",
  9: "Grass",
  10: "Moss",
  11: "Gold Soil",
  12: "Petal",
  13: "Lava (Fog)",
  14: "Fluxite",
  15: "Block",
  16: "Sliding Block",
  17: "Sliding Block Left",
  18: "Sliding Block Right",
  19: "Conveyor Left",
  20: "Conveyor Right",
  21: "Shaker Left",
  22: "Shaker Right",
  23: "Stone",
  24: "Kinetic Press",
  25: "Ice",
  26: "Grower",
  27: "Nascent Water",
  28: "Redsoil",
  29: "Scoria",
  30: "Crackstone",
  31: "Solidite",
  32: "Void Flower Soil",
  33: "Spreading Terrain",
  34: "Sand2",
  35: "Earth Strataform",
  36: "Game of Life (R)",
  37: "GoL (R)(H)",
  38: "Mooncrystal",
  39: "Sandstone",
  40: "Dune",
  41: "Limestone",
  42: "Bedrock",
  43: "Game of Life (S)",
  44: "Copper Ore",
  45: "Glass",
  46: "Brittle Clay",
  47: "Puff",
  48: "Snow (Fog)",
  49: "Blackrock",
  50: "Florinol Soil",
  51: "Auralite Crystal",
  52: "Vine",
  53: "Caldera",
  54: "Shatterstone",
  55: "Deepstone",
};

const ELEMENT_NAMES: Readonly<Record<number, string>> = {
  1: "Sand",
  2: "Particle",
  3: "Water",
  4: "Wet Sand",
  5: "Redsand",
  6: "Residue",
  7: "Gold",
  8: "Voidbloom",
  9: "Shake",
  10: "Steam",
  11: "Fire",
  12: "Snow",
  13: "Flame",
  14: "Burnt Residue",
  15: "Seed",
  16: "Wet Seed",
  17: "Seedling",
  18: "Amethelis",
  19: "Lava",
  20: "Cinder",
};

const STRUCTURE_NAMES: Readonly<Record<string, string>> = {
  "1": "Conveyor Left",
  "2": "Conveyor Right",
  "3": "Shaker Left",
  "4": "Shaker Right",
  "5": "Launcher Up",
  "6": "Launcher Left",
  "7": "Launcher Right",
  "8": "Splitter Left",
  "9": "Splitter Right",
  "10": "Dropper",
  "11": "Foundation",
  "12": "Angled Foundation Left",
  "13": "Triangle Foundation Left",
  "14": "Angled Foundation Right",
  "15": "Triangle Foundation Right",
  "16": "Collector",
  "17": "Filter Left",
  "18": "Filter Right",
  "19": "Sliding Foundation",
  "20": "Kinetic Press",
  "21": "Planter Box",
  "22": "Sound Box",
  "23": "Pipe",
  "24": "Pump",
  "25": "Liquid Vent",
  "26": "Wall Light",
  "27": "Flux Emanator",
  aurixiteCrystallizer: "Synthesizer",
  clearingFrameLeft: "Clearing Frame Left",
  clearingFrameRight: "Clearing Frame Right",
  coalGenerator: "Coal Generator",
  conveyorLeftMk2: "Conveyor Left Mk.2",
  conveyorRightMk2: "Conveyor Right Mk.2",
  copperMold: "Copper Mold",
  critterFence: "Critter Fence",
  earthStratacore: "Earth Stratacore",
  electricityConnector: "Energy Connector",
  fiftyFifty: "Harmonizer",
  filterLeftMk2: "Advanced Filter Left",
  filterRightMk2: "Advanced Filter Right",
  goldBattery: "Florinol Battery",
  heatCannonDown: "Pyro Dispenser Down",
  heatCannonLeft: "Pyro Dispenser Left",
  heatCannonRight: "Pyro Dispenser Right",
  kineticFieldEmitter: "Aerokinetic Fan",
  kineticFieldEmitterDownRight: "Aerokinetic Fan Down Right",
  kineticFieldEmitterUp: "Aerokinetic Fan Up",
  kineticFieldEmitterUpRight: "Aerokinetic Fan Up Right",
  launcherLeftMk2: "Launcher Left Mk.2",
  launcherRightMk2: "Launcher Right Mk.2",
  launcherUpMk2: "Launcher Up Mk.2",
  powerBrick: "Power Brick",
  quantumPortal: "Conveyor Portal",
  quantumPortalExit: "Conveyor Portal Exit",
  signalAnd: "AND Gate",
  signalBuffer: "Buffer",
  signalButton: "Signal Button",
  signalGate: "Door",
  signalLamp: "Signal Lamp",
  signalNand: "NAND Gate",
  signalNor: "NOR Gate",
  signalNot: "NOT Gate",
  signalOr: "OR Gate",
  signalPresenceSensor: "Presence Sensor",
  signalPulseSensor: "Pulse Sensor",
  signalRepeater: "Repeater",
  signalSensor: "Signal Sensor",
  signalSwitch: "Signal Switch",
  signalToggle: "Toggle (T-FlipFlop)",
  signalXnor: "XNOR Gate",
  signalXor: "XOR Gate",
  smelter: "Smelter",
  snowmaker: "Snowmaker",
  steamTurbine: "Steam Turbine",
  swarmConsole: "Aura Extractor",
  thermalRelay: "Thermal Buffer",
  thermodryer: "Steam Dryer",
  thermofroster: "Condenser",
  voidRift: "Void Rift",
};

export function saveExplorerTerrainName(type: number): string | undefined {
  return TERRAIN_NAMES[type];
}

export function saveExplorerElementName(type: number): string | undefined {
  return ELEMENT_NAMES[type];
}

export function saveExplorerStructureName(type: string | number): string | undefined {
  return STRUCTURE_NAMES[String(type)];
}

export function saveExplorerCellName(
  kind: SaveExplorerCellKind | undefined,
  type: number | undefined,
): string | undefined {
  if (type === undefined) return undefined;
  if (kind === "terrain") return saveExplorerTerrainName(type);
  if (kind === "settled-element" || kind === "moving-element" || kind === "moving-particle")
    return saveExplorerElementName(type);
  return undefined;
}

/**
 * Terrain IDs that have excavation requirement "indestructible" (cannot be dug or destroyed).
 * 39: Sandstone
 * 41: Limestone
 * 42: Bedrock
 * 49: Blackrock
 * 55: Deepstone
 */
export const INDESTRUCTIBLE_TERRAIN_IDS: ReadonlySet<number> = new Set([39, 41, 42, 49, 55]);

/** Returns true if the terrain type is indestructible. */
export function isIndestructibleTerrain(type: number): boolean {
  return INDESTRUCTIBLE_TERRAIN_IDS.has(type);
}

/**
 * Returns true if a raw matrix cell value can be penetrated (i.e. is not indestructible terrain).
 * Empty air (0), elements (liquids/powders >= 101 or objects), and destructible terrains are passable.
 */
export function isPassableMatrixValue(value: unknown): boolean {
  if (typeof value === "number") {
    if (value < 0) {
      const type = Math.floor(-value / 10000);
      return !INDESTRUCTIBLE_TERRAIN_IDS.has(type);
    }
    if (value >= 101) return true; // settled elements
    return !INDESTRUCTIBLE_TERRAIN_IDS.has(value);
  }
  // null/undefined/0/objects (particles or moving elements) are passable
  return true;
}
