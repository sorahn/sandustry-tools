import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  decodeBlueprint,
  renderBlueprintToSvg,
} from "../packages/sandustry-blueprint-core/src/index.ts";
import { renderBlueprintStringToNodePng } from "../packages/sandustry-blueprint-node/src/index.ts";
import { blueprintCatalog } from "../apps/blueprint-site/src/utils/catalog.ts";

const root = path.resolve(import.meta.dirname, "..");
const blueprintRoot = path.join(root, "packages/sandustry-blueprint-core/tests/visual/blueprints");
const outputRoot = path.join(root, "artifacts/visual/blueprint-thumbnails");
const assetRoot = path.join(root, "apps/blueprint-site/public");
const maxWidth = 640;
const maxHeight = 360;

await mkdir(outputRoot, { recursive: true });
const files = (await import("node:fs/promises")).readdir(blueprintRoot);
for (const file of (await files).filter((name) => name.endsWith(".txt")).sort()) {
  const input = (await readFile(path.join(blueprintRoot, file), "utf8")).trim();
  const blueprint = decodeBlueprint(input);
  const rendered = renderBlueprintToSvg(blueprint, {
    catalog: blueprintCatalog(),
    padding: 6,
    cell: 8,
    assetBaseUrl: "",
    includeBackground: true,
    showGrid: false,
    showFoundationOutlines: false,
    showSignalLinks: false,
  });
  const scale = Math.min(1, maxWidth / rendered.model.width, maxHeight / rendered.model.height);
  const png = await renderBlueprintStringToNodePng(input, {
    assetRoot,
    catalog: blueprintCatalog(),
    assetBaseUrl: "",
    scale,
    includeBackground: true,
    showGrid: false,
    showFoundationOutlines: false,
    showSignalLinks: false,
  });
  await writeFile(path.join(outputRoot, file.replace(/\.txt$/, ".png")), png);
}

console.log(`wrote thumbnails to ${outputRoot}`);
