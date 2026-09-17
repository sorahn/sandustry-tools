import { encodeBlueprint, UNKNOWN_STRUCTURE_FOOTPRINT, type Blueprint } from "./core";
import { renderBlueprintStringToNodePng } from "@sandustry/blueprint-node";
import { blueprintCatalog } from "../../../../apps/blueprint-site/src/utils/catalog";
import { catalogVisualFixture } from "../../../../apps/blueprint-site/src/visual-fixtures/catalog";
export { renderVisualBlueprintSvg } from "./svg-renderer";

export function catalogVisualBlueprint() {
  return encodeBlueprint(catalogVisualFixture);
}

export function encodeVisualBlueprint(blueprint: Blueprint) {
  return encodeBlueprint(blueprint);
}

export function renderVisualBlueprint(
  input: string,
  assetRoot: string,
  options: {
    showFoundationOutlines?: boolean;
    showEdgeFade?: boolean;
    showPipeModeOverlay?: boolean;
  } = {},
) {
  return renderBlueprintStringToNodePng(input, {
    assetRoot,
    catalog: blueprintCatalog(),
    unknownFootprint: UNKNOWN_STRUCTURE_FOOTPRINT,
    assetBaseUrl: "",
    scale: 1,
    includeBackground: true,
    showGrid: true,
    showFoundationOutlines: options.showFoundationOutlines ?? true,
    showSignalLinks: true,
    showEdgeFade: options.showEdgeFade,
    showPipeModeOverlay: options.showPipeModeOverlay,
  });
}
