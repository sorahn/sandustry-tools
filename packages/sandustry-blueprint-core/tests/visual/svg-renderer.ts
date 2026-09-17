import { decodeBlueprint, encodeBlueprint, renderBlueprintToSvg } from "./core";
import { blueprintCatalog } from "../../../../apps/blueprint-site/src/utils/catalog";
import { catalogVisualFixture } from "../../../../apps/blueprint-site/src/visual-fixtures/catalog";

export function catalogVisualBlueprint() {
  return encodeBlueprint(catalogVisualFixture);
}

export function renderVisualBlueprintSvg(
  input: string,
  options: {
    showFoundationOutlines?: boolean;
    showEdgeFade?: boolean;
    showPipeModeOverlay?: boolean;
  } = {},
) {
  return renderBlueprintToSvg(decodeBlueprint(input), {
    catalog: blueprintCatalog(),
    assetBaseUrl: "",
    includeBackground: true,
    showGrid: true,
    showFoundationOutlines: options.showFoundationOutlines ?? true,
    showSignalLinks: true,
    showEdgeFade: options.showEdgeFade,
    showPipeModeOverlay: options.showPipeModeOverlay,
  }).svg;
}
