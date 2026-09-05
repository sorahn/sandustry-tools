import {
  encodeBlueprint as encodeCanonicalBlueprint,
  type Blueprint,
} from "@daryl.roberts/sandustry-blueprint-core";
import type { SaveBlueprintRecord } from "@sandustry/save-core";

/** Convert a validated save record through the canonical blueprint encoder. */
export function encodeSavedBlueprint(
  record: SaveBlueprintRecord,
  format: "binary" | "text" = "binary",
) {
  const blueprint: Blueprint = {
    name: record.name,
    data: record.data,
    signalLinks: record.signalLinks,
  };
  return encodeCanonicalBlueprint(blueprint, format);
}
