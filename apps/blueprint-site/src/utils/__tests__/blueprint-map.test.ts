import { afterEach, describe, expect, test } from "bun:test";
import type { Blueprint } from "../blueprint";
import {
  MAP_LAYER_ORDER,
  createBlueprintMapModel,
  mapLayerStyle,
  readStoredMapView,
  snapMapZoom,
  structureFootprint,
  structureShape,
  structureTopY,
  viewportHeightForWidth,
  calculateMaxPan,
  MAP_MIN_VISIBLE_PX,
} from "../blueprint-map";
import {
  clusterFilterStructures,
  type FilterOverlayCluster,
} from "@daryl.roberts/sandustry-blueprint-core";

const originalWindow = (globalThis as typeof globalThis & { window?: unknown }).window;

function installStorage(value: string | null) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: { getItem: () => value } },
  });
}

afterEach(() => {
  if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window;
  else Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
});

describe("blueprint map utilities", () => {
  test("assigns stable layer z-indices and viewport dimensions", () => {
    expect(MAP_LAYER_ORDER).toEqual([
      "background",
      "grid",
      "debugCells",
      "foundationShapes",
      "sprites",
      "signalLinks",
      "selectedHighlight",
      "hoverHighlight",
    ]);
    expect(mapLayerStyle("background")).toEqual({ zIndex: 0 });
    expect(mapLayerStyle("hoverHighlight")).toEqual({ zIndex: 7 });
    expect(viewportHeightForWidth(1600)).toBe(1002);
  });

  test("snaps zoom to the nearest supported level", () => {
    expect(snapMapZoom(0.1)).toBe(0.25);
    expect(snapMapZoom(1.18)).toBe(1);
    expect(snapMapZoom(3.7)).toBe(4);
  });

  test("derives structure footprints and top edges", () => {
    const conveyor = { type: 2, x: 2, y: 3 } as Blueprint["data"][number];
    const kineticPress = { type: 20, x: 2, y: 10 } as Blueprint["data"][number];
    const custom = {
      type: "unknown",
      x: 0,
      y: 0,
      data: {
        __prefabulatorBlueprint: {
          definition: {
            shape: [
              [1, 0],
              [1, 1],
            ],
          },
        },
      },
    } as Blueprint["data"][number];

    expect(structureFootprint(conveyor)).toEqual({ width: 4, height: 4 });
    expect(structureFootprint(custom)).toEqual({ width: 2, height: 2 });
    expect(structureTopY(conveyor)).toBe(3);
    expect(structureTopY(kineticPress)).toBe(7);
    expect(structureShape(conveyor)).toHaveLength(4);
    expect(structureShape(custom)).toEqual([
      [1, 0],
      [1, 1],
    ]);
  });

  test("builds a render model with padded cell dimensions", () => {
    const blueprint: Blueprint = {
      name: "Map fixture",
      data: [{ type: 2, x: 3, y: 4 }],
      signalLinks: [],
    };
    const model = createBlueprintMapModel(blueprint, 1, 8);

    expect(model).toMatchObject({
      minX: 3,
      maxX: 6,
      minY: 4,
      maxY: 7,
      width: 48,
      height: 48,
      blueprintWidth: 32,
      blueprintHeight: 32,
    });
    expect(model.renderStructures).toHaveLength(1);
  });

  test("reads and validates the saved map view", () => {
    installStorage(
      JSON.stringify({
        blueprint: "fixture",
        zoom: 9,
        pan: { x: 12, y: -4 },
        viewportWidth: 1200,
        fit: true,
      }),
    );
    expect(readStoredMapView("fixture")).toEqual({
      zoom: 4,
      pan: { x: 12, y: -4 },
      viewportWidth: 1200,
      fit: true,
    });
    expect(readStoredMapView("other")).toBeNull();
  });

  test("rejects missing, malformed, or non-finite saved views", () => {
    delete (globalThis as { window?: unknown }).window;
    expect(readStoredMapView("fixture")).toBeNull();

    installStorage("not json");
    expect(readStoredMapView("fixture")).toBeNull();

    installStorage(JSON.stringify({ blueprint: "fixture", zoom: 1, pan: { x: Infinity, y: 0 } }));
    expect(readStoredMapView("fixture")).toBeNull();
  });

  test("maps filter structure indices to clusters for interactive selection", () => {
    const blueprint: Blueprint = {
      name: "Filter fixture",
      data: [
        { type: 2, x: 0, y: 0 },
        { type: 18, x: 10, y: 0, filter: { mode: "allow", elementType: 1 } },
        { type: 18, x: 14, y: 0, filter: { mode: "allow", elementType: 1 } },
        { type: "filterWall", x: 30, y: 0, filter: { mode: "block", elementType: 7 } },
      ],
      signalLinks: [],
    };
    const model = createBlueprintMapModel(blueprint, 1, 8);
    const clusters = clusterFilterStructures(model.preparedBlueprint.preparedStructures);
    const byIndex = new Map<number, FilterOverlayCluster>();
    for (const cluster of clusters) {
      for (const member of cluster.members) {
        byIndex.set(member.index, cluster);
      }
    }

    expect(byIndex.get(0)).toBeUndefined();
    const cluster1 = byIndex.get(1);
    const cluster2 = byIndex.get(2);
    expect(cluster1).toBeDefined();
    expect(cluster1).toBe(cluster2);
    expect(cluster1?.members).toHaveLength(2);

    const wallCluster = byIndex.get(3);
    expect(wallCluster).toBeDefined();
    expect(wallCluster).not.toBe(cluster1);
  });

  describe("calculateMaxPan", () => {
    test("allows scrolling blueprint almost out of view when blueprint fits within viewport", () => {
      // Content 800 unzoomed, viewport 1200, zoom 0.5 -> rendered size 400px (fits easily in 1200px viewport)
      const content = 800;
      const viewport = 1200;
      const zoom = 0.5;
      const maxPan = calculateMaxPan(content, viewport, zoom);

      // maxPan = (1200 + 400 - 2 * 48) / (2 * 0.5) = 1504 / 1 = 1504
      expect(maxPan).toBe(1504);

      // Shift in screen pixels at maxPan:
      const maxShiftPx = maxPan * zoom; // 752px
      // When centered in viewport, center was at 600px.
      // Left edge was at 600 - 200 = 400px. Right edge was at 600 + 200 = 800px.
      // When panned to maxPan, right edge is at: 800 - 752 = 48px!
      // Exactly MAP_MIN_VISIBLE_PX (48px) remains in view at the viewport edge.
      const initialRightEdge = viewport / 2 + (content * zoom) / 2;
      const pannedRightEdge = initialRightEdge - maxShiftPx;
      expect(pannedRightEdge).toBe(MAP_MIN_VISIBLE_PX);
    });

    test("allows scrolling blueprint almost out of view when zoomed in", () => {
      // Content 1600, viewport 1000, zoom 2 -> rendered size 3200px
      const content = 1600;
      const viewport = 1000;
      const zoom = 2;
      const maxPan = calculateMaxPan(content, viewport, zoom);

      // maxPan = (1000 + 3200 - 96) / 4 = 4104 / 4 = 1026
      expect(maxPan).toBe(1026);

      const maxShiftPx = maxPan * zoom; // 2052px
      const initialRightEdge = viewport / 2 + (content * zoom) / 2; // 500 + 1600 = 2100px
      const pannedRightEdge = initialRightEdge - maxShiftPx; // 2100 - 2052 = 48px
      expect(pannedRightEdge).toBe(MAP_MIN_VISIBLE_PX);
    });

    test("scales minVisible for tiny content so a fraction remains visible", () => {
      // Content 40px at 1x zoom in 500px viewport. 25% of 40 = 10px (< 48px).
      const maxPan = calculateMaxPan(40, 500, 1);
      // minVisible = 10px. maxPan = (500 + 40 - 20) / 2 = 260
      expect(maxPan).toBe(260);

      const initialRight = 250 + 20; // 270
      const pannedRight = initialRight - maxPan * 1; // 270 - 260 = 10px
      expect(pannedRight).toBe(10);
    });

    test("returns 0 for non-positive zoom", () => {
      expect(calculateMaxPan(100, 500, 0)).toBe(0);
      expect(calculateMaxPan(100, 500, -1)).toBe(0);
    });
  });
});
