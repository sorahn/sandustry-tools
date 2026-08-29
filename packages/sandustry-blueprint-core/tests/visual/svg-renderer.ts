import {
  decodeBlueprint,
  encodeBlueprint,
  renderBlueprintToSvg,
} from "@sorahn/sandustry-blueprint-core";
import { blueprintCatalog } from "../../../../apps/blueprint-site/src/utils/catalog";
import { catalogVisualFixture } from "../../../../apps/blueprint-site/src/visual-fixtures/catalog";

export function catalogVisualBlueprint() {
  return encodeBlueprint(catalogVisualFixture);
}

export function renderVisualBlueprintSvg(input: string, showEdgeFade = false) {
  return renderBlueprintToSvg(decodeBlueprint(input), {
    catalog: blueprintCatalog(),
    assetBaseUrl: "",
    includeBackground: true,
    showGrid: true,
    showFoundationOutlines: true,
    showSignalLinks: true,
    showEdgeFade,
  }).svg;
}
