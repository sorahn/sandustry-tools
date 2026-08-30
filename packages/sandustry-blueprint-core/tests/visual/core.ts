// Keep ordinary visual runs on the working tree, while allowing the pre-push
// hook to exercise the publishable package entrypoint after building dist.
const core =
  process.env.BLUEPRINT_CORE_TEST_DIST === "1"
    ? await import("@daryl.roberts/sandustry-blueprint-core")
    : await import("../../src/index");

export const {
  decodeBlueprint,
  encodeBlueprint,
  renderBlueprintToSvg,
  renderBlueprintStringToPng,
  UNKNOWN_STRUCTURE_FOOTPRINT,
} = core;
export type { Blueprint } from "../../src/index";
