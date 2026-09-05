import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, test } from "bun:test";
import {
  canonicalizeFilterConfig,
  canonicalizeFilterSignature,
  clusterFilterStructures,
  layoutFilterLabels,
  measureFilterChip,
  renderFilterOverlaySvg,
  renderBlueprintToSvg,
  resolveElement,
  prepareBlueprint,
  decodeBlueprint,
  type Blueprint,
  DEFAULT_ELEMENT_CATALOG,
  ELEMENT_ENTRIES,
} from "../index.js";

describe("filter-overlay", () => {
  describe("element resolution", () => {
    test("resolves known core and mod elements", () => {
      assert.ok(ELEMENT_ENTRIES.length > 50);
      assert.equal(DEFAULT_ELEMENT_CATALOG.get(1)?.name, "Sand");

      const sand = resolveElement(1);
      assert.equal(sand.name, "Sand");
      assert.equal(sand.color, "#f4a460");
      assert.equal(sand.matterType, 1);

      const water = resolveElement(3);
      assert.equal(water.name, "Water");
      assert.equal(water.color, "#1e90ff");

      const auraline = resolveElement(52);
      assert.equal(auraline.name, "Auraline");
      assert.equal(auraline.color, "#d8b4ff");

      const byId = resolveElement("auraline");
      assert.equal(byId.name, "Auraline");
      assert.equal(byId.color, "#d8b4ff");
    });

    test("resolves unknown element IDs with ID:<n> fallback and safe color", () => {
      const unknownNum = resolveElement(999);
      assert.equal(unknownNum.name, "ID:999");
      assert.equal(unknownNum.color, "#888888");

      const unknownStr = resolveElement("unknownModElement");
      assert.equal(unknownStr.name, "unknownModElement");
      assert.equal(unknownStr.color, "#888888");
    });
  });

  describe("signature canonicalization", () => {
    test("returns none_<type> for unconfigured structures", () => {
      assert.equal(canonicalizeFilterSignature({ type: 17, x: 0, y: 0 }), "none_17");
      assert.equal(
        canonicalizeFilterSignature({ type: "filterWall", x: 0, y: 0 }),
        "none_filterWall",
      );
    });

    test("normalizes, sorts, and deduplicates element types", () => {
      const sig1 = canonicalizeFilterSignature({
        type: 18,
        x: 0,
        y: 0,
        filter: { mode: "allow", elementType: [15, 7, 1] },
      });
      const sig2 = canonicalizeFilterSignature({
        type: 18,
        x: 0,
        y: 0,
        filter: { mode: "allow", elementType: [1, 7, 7, 15] },
      });
      assert.equal(sig1, sig2);
      assert.equal(sig1, "18_allow_1_1,7,15__0_0__0");
    });

    test("keeps left and right filter types distinct", () => {
      const leftSig = canonicalizeFilterSignature({
        type: 17,
        x: 0,
        y: 0,
        filter: { mode: "allow", elementType: 1 },
      });
      const rightSig = canonicalizeFilterSignature({
        type: 18,
        x: 0,
        y: 0,
        filter: { mode: "allow", elementType: 1 },
      });
      assert.notEqual(leftSig, rightSig);
    });

    test("includes density, speed exemptions, liquid/gas flags, and pass-through", () => {
      const sig = canonicalizeFilterSignature({
        type: "filterRightMk2",
        x: 0,
        y: 0,
        filter: {
          mode: "block",
          elementType: [3, 4],
          density: 5,
          affectsLiquid: true,
          affectsGas: true,
          speedExemptElementType: [11],
        },
        data: { filterPassThrough: true },
      });
      assert.equal(sig, "filterRightMk2_block_1_3,4_5_1_1_11_1");
    });
  });

  describe("config canonicalization", () => {
    test("matches identical configurations across different filter types and orientations", () => {
      const leftFilter = {
        type: 17, // filterLeft
        x: 0,
        y: 0,
        filter: { mode: "allow" as const, elementType: [1, 2] },
      };
      const rightFilter = {
        type: 18, // filterRight
        x: 10,
        y: 0,
        filter: { mode: "allow" as const, elementType: [2, 1] },
      };
      const wallFilter = {
        type: "filterWallMk2",
        x: 20,
        y: 20,
        filter: { mode: "allow" as const, elementType: [1, 2] },
      };

      const keyLeft = canonicalizeFilterConfig(leftFilter);
      const keyRight = canonicalizeFilterConfig(rightFilter);
      const keyWall = canonicalizeFilterConfig(wallFilter);

      assert.equal(keyLeft, keyRight);
      assert.equal(keyLeft, keyWall);
    });

    test("distinguishes different modes or element lists", () => {
      const allowConfig = canonicalizeFilterConfig({
        type: 17,
        x: 0,
        y: 0,
        filter: { mode: "allow", elementType: 1 },
      });
      const blockConfig = canonicalizeFilterConfig({
        type: 17,
        x: 0,
        y: 0,
        filter: { mode: "block", elementType: 1 },
      });
      assert.notEqual(allowConfig, blockConfig);
    });
  });

  describe("clustering", () => {
    test("joins directly adjacent horizontal filters on matching row", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [
          { type: 18, x: 0, y: 0, filter: { mode: "allow", elementType: 1 } },
          { type: 18, x: 4, y: 0, filter: { mode: "allow", elementType: 1 } },
          { type: 18, x: 8, y: 0, filter: { mode: "allow", elementType: 1 } },
        ],
      };
      const prepared = prepareBlueprint(blueprint);
      const clusters = clusterFilterStructures(prepared.preparedStructures);
      assert.equal(clusters.length, 1);
      assert.equal(clusters[0].members.length, 3);
      assert.equal(clusters[0].cellWidth, 12);
      assert.equal(clusters[0].cellHeight, 4);
      assert.equal(clusters[0].isVertical, false);
      assert.equal(clusters[0].hasFilter, true);
    });

    test("splits separated runs on same row", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [
          { type: 18, x: 0, y: 0, filter: { mode: "allow", elementType: 1 } },
          { type: 18, x: 4, y: 0, filter: { mode: "allow", elementType: 1 } },
          // Gap at x=8
          { type: 18, x: 12, y: 0, filter: { mode: "allow", elementType: 1 } },
        ],
      };
      const prepared = prepareBlueprint(blueprint);
      const clusters = clusterFilterStructures(prepared.preparedStructures);
      assert.equal(clusters.length, 2);
      assert.equal(clusters[0].members.length, 2);
      assert.equal(clusters[1].members.length, 1);
    });

    test("joins directly adjacent vertical filter walls on matching column", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [
          { type: "filterWall", x: 4, y: 0, filter: { mode: "allow", elementType: 3 } },
          { type: "filterWall", x: 4, y: 4, filter: { mode: "allow", elementType: 3 } },
        ],
      };
      const prepared = prepareBlueprint(blueprint);
      const clusters = clusterFilterStructures(prepared.preparedStructures);
      assert.equal(clusters.length, 1);
      assert.equal(clusters[0].members.length, 2);
      assert.equal(clusters[0].cellWidth, 4);
      assert.equal(clusters[0].cellHeight, 8);
      assert.equal(clusters[0].isVertical, true);
    });

    test("preserves unconfigured None state", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [{ type: 18, x: 0, y: 0 }],
      };
      const prepared = prepareBlueprint(blueprint);
      const clusters = clusterFilterStructures(prepared.preparedStructures);
      assert.equal(clusters.length, 1);
      assert.equal(clusters[0].hasFilter, false);
      assert.equal(clusters[0].elements.length, 0);
    });

    test("detects gas-only Mk2 pass-through icon rule", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [
          // Steam (type 10, Gas=4) on filterRightMk2
          { type: "filterRightMk2", x: 0, y: 0, filter: { mode: "allow", elementType: 10 } },
          // Sand (type 1, Solid=1) on filterRightMk2
          { type: "filterRightMk2", x: 0, y: 8, filter: { mode: "allow", elementType: 1 } },
        ],
      };
      const prepared = prepareBlueprint(blueprint);
      const clusters = clusterFilterStructures(prepared.preparedStructures);
      assert.equal(clusters.length, 2);
      const steamCluster = clusters.find((c) => c.minCellY === 0)!;
      const sandCluster = clusters.find((c) => c.minCellY === 8)!;
      assert.equal(steamCluster.shouldUseAllowIconForPassThrough, true);
      assert.equal(sandCluster.shouldUseAllowIconForPassThrough, false);
    });
  });

  describe("label measurement and collision avoidance", () => {
    test("measures chip width deterministically", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [{ type: 18, x: 0, y: 0, filter: { mode: "allow", elementType: 1 } }],
      };
      const prepared = prepareBlueprint(blueprint);
      const [cluster] = clusterFilterStructures(prepared.preparedStructures);
      const metrics = measureFilterChip(cluster);
      assert.ok(metrics.width > 50);
      assert.equal(metrics.height, 22);
    });

    test("stacks colliding labels upward and computes stems", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [
          // Two clusters with overlapping label positions on same or near X/Y
          { type: 18, x: 0, y: 0, filter: { mode: "allow", elementType: 1 } },
          { type: 18, x: 4, y: 0, filter: { mode: "block", elementType: 7 } },
        ],
      };
      const prepared = prepareBlueprint(blueprint);
      const clusters = clusterFilterStructures(prepared.preparedStructures);
      assert.equal(clusters.length, 2);

      const labels = layoutFilterLabels(clusters, {
        minX: 0,
        minY: 0,
        padding: 4,
        paddingX: 4,
        cell: 8,
        labelScale: 1.0,
      });
      assert.equal(labels.length, 2);
      // Because both labels are ~100px wide and only 32px apart horizontally (4 cells * 8px),
      // one must be shifted upward to avoid collision.
      const shifted = labels.find((l) => l.stemLength > 0);
      assert.ok(shifted, "Expected at least one label to have a stemLength > 0 due to collision");
    });
  });

  describe("SVG rendering", () => {
    test("omits filter overlay by default", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [{ type: 18, x: 0, y: 0, filter: { mode: "allow", elementType: 1 } }],
      };
      const res = renderBlueprintToSvg(blueprint);
      assert.ok(!res.svg.includes("blueprint-filter-overlay"));
    });

    test("renders filter overlay when showFilterOverlay is true", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [{ type: 18, x: 0, y: 0, filter: { mode: "allow", elementType: 1 } }],
      };
      const res = renderBlueprintToSvg(blueprint, { showFilterOverlay: true });
      assert.ok(res.svg.includes("blueprint-filter-overlay"));
      assert.ok(res.svg.includes("blueprint-filter-boundaries"));
      assert.ok(res.svg.includes("blueprint-filter-labels"));
      assert.ok(res.svg.includes("Sand"));
      assert.ok(res.svg.includes("#f4a460"));
      assert.ok(res.svg.includes("Others"));
    });

    test("renders None for unconfigured filters", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [{ type: 18, x: 0, y: 0 }],
      };
      const res = renderBlueprintToSvg(blueprint, { showFilterOverlay: true });
      assert.ok(res.svg.includes("blueprint-filter-overlay"));
      assert.ok(res.svg.includes("None"));
      assert.ok(res.svg.includes("#888888"));
    });

    test("renderFilterOverlaySvg renders boundaries and labels directly", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [{ type: 18, x: 0, y: 0, filter: { mode: "allow", elementType: 1 } }],
      };
      const prepared = prepareBlueprint(blueprint);
      const svg = renderFilterOverlaySvg(prepared, {
        minX: 0,
        minY: 0,
        padding: 4,
        paddingX: 4,
        cell: 8,
      });
      assert.ok(svg.includes("blueprint-filter-overlay"));
      assert.ok(svg.includes("Sand"));
    });

    test("granularly culls offscreen boundaries, stems, and chips based on viewport", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [
          // Filter 1 at 0, 0
          { type: 18, x: 0, y: 0, filter: { mode: "allow", elementType: 1 } },
          // Filter 2 far away at 100, 100
          { type: 18, x: 100, y: 100, filter: { mode: "block", elementType: 7 } },
        ],
      };
      const prepared = prepareBlueprint(blueprint);

      // 1. Viewport covering only the first filter
      const onlyFirst = renderFilterOverlaySvg(prepared, {
        minX: 0,
        minY: 0,
        padding: 4,
        paddingX: 4,
        cell: 8,
        viewport: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      });
      assert.ok(onlyFirst.includes("Sand"), "First filter chip should be visible");
      assert.ok(!onlyFirst.includes("Coal"), "Second filter chip should be culled");

      // 2. Viewport covering only the second filter
      const onlySecond = renderFilterOverlaySvg(prepared, {
        minX: 0,
        minY: 0,
        padding: 4,
        paddingX: 4,
        cell: 8,
        viewport: { minX: 700, minY: 700, maxX: 1000, maxY: 1000 },
      });
      assert.ok(!onlySecond.includes("Sand"), "First filter chip should be culled");
      assert.ok(onlySecond.includes("Gold"), "Second filter chip should be visible");

      // 3. Overscan brings near-edge elements into view
      const withOverscan = renderFilterOverlaySvg(prepared, {
        minX: 0,
        minY: 0,
        padding: 4,
        paddingX: 4,
        cell: 8,
        viewport: { minX: 200, minY: 200, maxX: 300, maxY: 300, overscan: 250 },
      });
      assert.ok(withOverscan.includes("Sand"), "Overscan should include first filter");
    });

    test("supports pre-computed clusters and highlights activeClusterKey", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [
          { type: 18, x: 0, y: 0, filter: { mode: "allow", elementType: 1 } },
          { type: 18, x: 100, y: 100, filter: { mode: "block", elementType: 7 } },
        ],
      };
      const prepared = prepareBlueprint(blueprint);
      const clusters = clusterFilterStructures(prepared.preparedStructures);
      assert.equal(clusters.length, 2);

      // 1. Pass only 1 pre-computed cluster
      const singleClusterSvg = renderFilterOverlaySvg(prepared, {
        minX: 0,
        minY: 0,
        padding: 4,
        paddingX: 4,
        cell: 8,
        clusters: [clusters[0]],
      });
      assert.ok(singleClusterSvg.includes("Sand"));
      assert.ok(!singleClusterSvg.includes("Coal"));
      assert.ok(!singleClusterSvg.includes("is-active"));

      // 2. Active cluster highlight
      const activeSvg = renderFilterOverlaySvg(prepared, {
        minX: 0,
        minY: 0,
        padding: 4,
        paddingX: 4,
        cell: 8,
        clusters,
        activeClusterKey: clusters[0].key,
      });
      assert.ok(activeSvg.includes("blueprint-filter-boundary is-active"));
      assert.ok(activeSvg.includes("blueprint-filter-chip is-active"));
      // Only the active cluster has is-active (1 for boundary, 1 for chip)
      assert.equal(activeSvg.split("is-active").length - 1, 2);
    });

    test("selectively renders labels only for clusters in labelClusterKeys while drawing all boundaries", () => {
      const blueprint: Blueprint = {
        name: "test",
        signalLinks: null,
        data: [
          { type: 18, x: 0, y: 0, filter: { mode: "allow", elementType: 1 } },
          { type: 18, x: 100, y: 100, filter: { mode: "allow", elementType: 1 } },
        ],
      };
      const prepared = prepareBlueprint(blueprint);
      const clusters = clusterFilterStructures(prepared.preparedStructures);
      assert.equal(clusters.length, 2);

      const selectiveSvg = renderFilterOverlaySvg(prepared, {
        minX: 0,
        minY: 0,
        padding: 4,
        paddingX: 4,
        cell: 8,
        clusters,
        labelClusterKeys: new Set([clusters[0].key]),
        activeClusterKey: clusters[0].key,
      });

      // Both clusters have boundary rectangles
      assert.equal((selectiveSvg.match(/stroke-dasharray="4 3"/g) || []).length, 2);
      // Both clusters have the translucent fill tint
      assert.ok(selectiveSvg.includes('fill="rgba(0, 255, 71, 0.18)"'));
      // Only 1 label chip is rendered
      assert.equal((selectiveSvg.match(/blueprint-filter-chip/g) || []).length, 1);
      // Active cluster highlight is present
      assert.ok(selectiveSvg.includes("blueprint-filter-boundary is-active"));
    });
  });

  describe("dense fixture (filter-hell)", () => {
    test("processes filter-hell fixture with correct counts and fast performance", async () => {
      const fixturePath = path.resolve(
        import.meta.dir,
        "../../tests/visual/blueprints/filter-hell.txt",
      );
      const content = (await readFile(fixturePath, "utf8")).trim();
      const blueprint = decodeBlueprint(content);
      assert.equal(blueprint.data.length, 2933);

      const filterStructures = blueprint.data.filter((s) => s.filter !== undefined);
      assert.equal(filterStructures.length, 532);

      const allSignatures = new Set(filterStructures.map((s) => canonicalizeFilterSignature(s)));
      assert.equal(allSignatures.size, 23);

      const t0 = performance.now();
      const prepared = prepareBlueprint(blueprint);
      const clusters = clusterFilterStructures(prepared.preparedStructures);
      assert.equal(clusters.length, 239);

      const labels = layoutFilterLabels(clusters, {
        minX: 0,
        minY: 0,
        padding: 4,
        paddingX: 4,
        cell: 8,
      });
      assert.equal(labels.length, 239);

      const svg = renderFilterOverlaySvg(prepared, {
        minX: 0,
        minY: 0,
        padding: 4,
        paddingX: 4,
        cell: 8,
      });
      const elapsed = performance.now() - t0;
      assert.ok(svg.length > 0);
      assert.ok(elapsed < 200, `Overlay processing took too long: ${elapsed.toFixed(1)}ms`);
    });
  });
});
