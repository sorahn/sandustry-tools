import { decodeBlueprint } from "../utils/blueprint";
import type { BlueprintVisualFixture } from "./catalog";
import burnerbelt from "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/burnerbelt.txt?raw";
import fans from "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/fans.txt?raw";
import foundation from "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/foundation.txt?raw";
import kitchenSink from "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/kitchen-sink.txt?raw";
import launchers from "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/launchers.txt?raw";
import logic from "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/logic.txt?raw";
import prefab from "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/prefab.txt?raw";
import pyros from "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/pyros.txt?raw";
import smoke from "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/smoke.txt?raw";
import velocity from "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/velocity.txt?raw";
import z from "../../../../packages/sandustry-blueprint-core/tests/visual/blueprints/z.txt?raw";

const baselineSources = [
  ["burnerbelt", "Burner belts", burnerbelt],
  ["fans", "Fans", fans],
  ["foundation", "Foundation", foundation],
  ["kitchen-sink", "Kitchen sink", kitchenSink],
  ["launchers", "Launchers", launchers],
  ["logic", "Logic", logic],
  ["prefab", "Prefab", prefab],
  ["pyros", "Pyros", pyros],
  ["smoke", "Smoke", smoke],
  ["velocity", "Velocity", velocity],
  ["z", "Z ordering", z],
] as const;

export const CORE_VISUAL_BASELINES: BlueprintVisualFixture[] = baselineSources.map(
  ([id, label, source]) => ({
    id: `baseline-${id}`,
    label: `Baseline: ${label}`,
    blueprint: decodeBlueprint(source.trim()),
  }),
);
