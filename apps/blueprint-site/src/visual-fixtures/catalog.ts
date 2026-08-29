import type { Blueprint } from "@sorahn/sandustry-blueprint-core";
import { CORE_VISUAL_BASELINES } from "./core-baselines";

// The catalog baseline is assembled from the captured native/mod catalog
// rather than stored as a standalone blueprint string.
export const catalogVisualFixture: Blueprint = {
  name: "catalog visual regression",
  signalLinks: null,
  data: [
    { type: 0, x: 0, y: 0 },
    { type: 1, x: 5, y: 0 },
    { type: 3, x: 10, y: 0 },
    { type: 4, x: 15, y: 0 },
    { type: 5, x: 20, y: 0 },
    { type: 6, x: 25, y: 0 },
    { type: 7, x: 30, y: 0 },
    { type: 17, x: 35, y: 0 },
    { type: 18, x: 40, y: 0 },
    { type: "burnerBeltLeft", x: 0, y: 6 },
    { type: "burnerBeltRight", x: 5, y: 6 },
    { type: "snowmaker", x: 10, y: 6 },
    { type: "thermofroster", x: 15, y: 6 },
    { type: "heatCannonRight", x: 20, y: 6 },
    { type: "heatCannonDown", x: 25, y: 6 },
    { type: "heatCannonLeft", x: 30, y: 6 },
    { type: "heatCannonUp", x: 35, y: 6 },
    { type: "kineticFieldEmitterDownRight", x: 40, y: 6 },
    { type: "kineticFieldEmitterDownLeft", x: 45, y: 6 },
    { type: "kineticFieldEmitterUpLeft", x: 50, y: 6 },
    { type: "kineticFieldEmitterUpRight", x: 55, y: 6 },
  ],
};

export type BlueprintVisualFixture = {
  id: string;
  label: string;
  blueprint: Blueprint;
};

export const BLUEPRINT_VISUAL_FIXTURES: BlueprintVisualFixture[] = [
  { id: "catalog", label: "Catalog visual regression", blueprint: catalogVisualFixture },
  ...CORE_VISUAL_BASELINES,
];
