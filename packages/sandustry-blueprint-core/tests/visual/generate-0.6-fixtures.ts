import { readFileSync, writeFileSync } from "node:fs";
import {
  CATALOG,
  decodeBlueprint,
  encodeBlueprint,
  type Blueprint,
  type BlueprintType,
} from "../../src/index";
import native from "../fixtures/native-0.6.json";
import landingPad from "../fixtures/native-0.6-landing-pad.json";
import additions from "../../../../scripts/catalog/sandustry-0.6.json";

const root = new URL("./blueprints/", import.meta.url);
const gasTypes = new Map<BlueprintType, BlueprintType>([
  [23, "gasPipe"],
  [24, "gasPump"],
  [25, "gasVent"],
]);

function read(name: string): Blueprint {
  return decodeBlueprint(readFileSync(new URL(`${name}.txt`, root), "utf8").trim());
}

function write(name: string, blueprint: Blueprint) {
  writeFileSync(new URL(`${name}.txt`, root), `${encodeBlueprint(blueprint)}\n`);
}

export function gasVariant(blueprint: Blueprint): Blueprint {
  return {
    ...blueprint,
    name: `Gas variant: ${blueprint.name}`,
    data: blueprint.data.map((structure) => ({
      ...structure,
      type: gasTypes.get(structure.type) ?? structure.type,
    })),
  };
}

export function kitchenSink06(part: 1 | 2): Blueprint {
  // Every catalog ID includes the distinct directional variants. Angles that
  // resolve to the same ID do not persist as separate blueprint rotations.
  // A six-tile pitch also leaves room for the largest sprite (the void rift).
  const columns = 12;
  const pitch = 24;
  const newTypes = new Set<BlueprintType>(
    additions.entries.flatMap((entry) => [
      entry.type,
      ...(entry.variants ?? []).map((variant) => variant.id),
    ]),
  );
  const ordered = [
    ...CATALOG.filter((entry) => newTypes.has(entry.type)),
    ...CATALOG.filter((entry) => !newTypes.has(entry.type)),
  ];
  // Leave room in part one for the pad and network types not in its samples.
  const entries = part === 1 ? ordered.slice(0, 57) : ordered.slice(57);
  const data: Blueprint["data"] = entries.map((entry, index) => {
    const sample = native.samples.find((record) => record.type === entry.type);
    return {
      ...(sample ?? {}),
      type: entry.type,
      x: (index % columns) * pitch + 8,
      y: Math.floor(index / columns) * pitch + 8,
    };
  });
  const assemblyY = Math.ceil(entries.length / columns) * pitch + 8;
  if (part === 1) {
    data.push(...landingPad.data.map((part) => ({ ...part, y: part.y + assemblyY })));
    // Keep the pad and pipe network intact, with four tiles between assemblies.
    data.push(
      ...gasVariant(read("pipeworks")).data.map((part) => ({
        ...part,
        x: part.x + landingPad.widthCells + 16,
        y: part.y + assemblyY,
      })),
    );
  }
  return { name: `Sandustry 0.6 kitchen sink ${part}`, data, signalLinks: null };
}

if (import.meta.main) {
  write("gas-pipeworks", gasVariant(read("pipeworks")));
  write("gas-pipe-layer[pipes]", gasVariant(read("pipe-layer[pipes]")));
  write("kitchen-sink-0.6", kitchenSink06(1));
  write("kitchen-sink-0.6-part-2", kitchenSink06(2));
}
