import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "bun:test";
import { blueprintCatalog, catalogEntry } from "../catalog-data";
import { prepareBlueprint } from "../prepare";
import { renderBlueprintToSvg } from "../index";

const types = [
  "electrolyzer",
  "grinder",
  "electromagnet",
  "hologramProjector",
  "nickelMold",
  "powerCell",
  "fuelCell",
  "goldWell",
  "balancer",
  "advancedFilterLeftMk2",
  "advancedFilterRightMk2",
  "clearingFrameLeftMk2",
  "clearingFrameRightMk2",
  "quantumPortalMk2",
  "quantumPortalMk2Exit",
  "thermalTeleporter",
  "thermalTeleporterExit",
  "gasPipe",
  "gasPump",
  "gasVent",
  "reductionChamber",
  "reductionChamberWall",
  "cargoIntake",
  "calderaStratacore",
  "wedge",
  "wedge90",
  "wedge180",
  "wedge270",
];

test("all captured 0.6 IDs have names and identical browser and package sprite assets", () => {
  for (const type of types) {
    const entry = catalogEntry(type);
    assert.ok(entry?.name, `missing name for ${type}`);
    assert.deepEqual(entry.footprint, { width: 4, height: 4 });
    assert.ok(entry.renderAsset?.path, `missing sprite for ${type}`);
    const relative = entry.renderAsset.path;
    assert.deepEqual(
      readFileSync(new URL(`../../assets/${relative}`, import.meta.url)),
      readFileSync(new URL(`../../../../apps/blueprint-site/public/${relative}`, import.meta.url)),
      `sprite differs between browser and package for ${type}`,
    );
  }
});

test("new sprites retain native frames, overhangs and rotated wedge masks", () => {
  const prepared = prepareBlueprint(
    {
      name: "native sprite metadata",
      signalLinks: null,
      data: ["clearingFrameRightMk2", "advancedFilterLeftMk2", "grinder", "wedge90"].map(
        (type, index) => ({ type, x: index * 8, y: 0 }),
      ),
    },
    { catalog: blueprintCatalog() },
  );
  const [clearing, filter, grinder, wedge] = prepared.preparedStructures;
  assert.deepEqual(clearing.sprite?.asset.frame, { width: 16, height: 20 });
  assert.deepEqual(clearing.sprite?.asset.offset, { x: 0, y: -4 });
  assert.deepEqual(filter.sprite?.asset.frame, { width: 18, height: 18 });
  assert.deepEqual(filter.sprite?.asset.offset, { x: -1, y: -1 });
  assert.deepEqual(grinder.sprite?.asset.frame, { width: 16, height: 16 });
  assert.equal(wedge.sprite?.rotation, 90);
  assert.equal(wedge.shape?.[3]?.[3], 15);
  assert.equal(wedge.shape?.[0]?.[3], 0);
});

test("0.6 structures render through real sprite paths rather than unknown-content fallbacks", () => {
  const rendered = renderBlueprintToSvg(
    {
      name: "0.6 sprite coverage",
      signalLinks: null,
      data: types.map((type, index) => ({ type, x: index * 6, y: 0 })),
    },
    { catalog: blueprintCatalog(), assetBaseUrl: "" },
  );
  for (const type of types) {
    assert.ok(
      rendered.svg.includes(catalogEntry(type)!.renderAsset!.path),
      `missing rendered ${type}`,
    );
  }
});
