import { describe, expect, test } from "bun:test";
import { prepareSvgForPng, renderSvgToPng } from "../png";
import { renderBlueprintToSvg } from "../svg-renderer";
import { createBlueprintRenderModel } from "../render-model";

describe("SVG and PNG adapters", () => {
  test("renders unknown structures as labeled sprite-free placeholders", () => {
    const result = renderBlueprintToSvg(
      {
        name: "Unknown fixture",
        data: [{ type: "example.third-party:machine", x: 4, y: 8, data: { mode: "fast" } }],
        signalLinks: [],
      },
      {
        padding: 1,
        cell: 8,
        showNames: true,
        unknownFootprint: { width: 4, height: 4 },
        catalog: { get: () => undefined },
      },
    ).svg;

    expect(result).toContain('data-structure-index="0"');
    expect(result).toContain('x="9" y="9" width="30" height="30"');
    expect(result).toContain('x="8" y="8" width="32" height="32" fill="#172033"');
    expect(result).toContain('height="30" rx="0"');
    expect(result).toContain("M 16 16 L 32 32 M 32 16 L 16 32");
    expect(result).toContain('stroke-width="1" stroke-dasharray="4 3"');
    expect(result).toContain("#f0b429");
    expect(result).toContain(">exampl</text>");
    expect(result).toContain(">e.thir</text>");
    expect(result).not.toContain("<image");
  });

  test("prepares SVG roots, metadata, styles, backgrounds, and image URLs", async () => {
    const prepared = await prepareSvgForPng(
      `<svg class='map' style='color:red'><rect fill='#33a8ff'/><image xlink:href='machine.png'/></svg>`,
      {
        width: 20,
        height: 10,
        scale: 1.5,
        title: "A & B",
        description: "A < B",
        includeBackground: false,
        resolveImage: async (source) => `data:image/png;base64,${source.length}`,
      },
    );
    expect(prepared).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(prepared).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    expect(prepared).toContain('viewBox="0 0 20 10"');
    expect(prepared).toContain('width="30"');
    expect(prepared).toContain('height="15"');
    expect(prepared).toContain("<title>A &amp; B</title>");
    expect(prepared).toContain("<desc>A &lt; B</desc>");
    expect(prepared).not.toContain("class=");
    expect(prepared).not.toContain("style=");
    expect(prepared).not.toContain("#33a8ff");
    expect(prepared).toContain('href="data:image/png;base64,11"');
  });

  test("rejects empty SVG and preserves unresolved or data image URLs", async () => {
    await expect(prepareSvgForPng("  ", { width: 1, height: 1, scale: 1 })).rejects.toThrow(
      "empty SVG",
    );
    const prepared = await prepareSvgForPng(
      `<svg><image href='data:image/png;base64,abc'/><image href='missing.png'/></svg>`,
      { width: 1, height: 1, scale: 1, resolveImage: async () => undefined },
    );
    expect(prepared).toContain("data:image/png;base64,abc");
    expect(prepared).toContain("href='missing.png'");
  });

  test("renders custom shapes, clipped sprites, rotations, lights, names, and signal links", () => {
    const result = renderBlueprintToSvg(
      {
        name: `Shape <test>`,
        data: [
          {
            type: "custom",
            x: 0,
            y: 0,
            data: {
              __prefabulatorBlueprint: {
                definition: {
                  shape: [
                    [1, 0],
                    [0, 1],
                  ],
                },
              },
            },
          },
          { type: "machine", x: 4, y: 0, data: { state: { lightColor: "#fff" } } },
          { type: "signalBuffer", x: 8, y: 0 },
          { type: "signalToggle", x: 12, y: 0 },
        ],
        signalLinks: [{ from: { x: 8, y: 0 }, to: { x: 12, y: 0 }, on: true }],
      },
      {
        padding: 1,
        cell: 8,
        showCustomShapes: true,
        showNames: true,
        showSignalLinks: true,
        catalog: {
          get: (type) =>
            type === 11
              ? { renderAsset: { path: "foundation.png", sourceSize: { width: 16, height: 16 } } }
              : type === "machine"
                ? {
                    name: "Machine",
                    renderAsset: {
                      path: "machine.png",
                      sourceSize: { width: 32, height: 16 },
                      frame: { width: 16, height: 16 },
                      clip: true,
                      rotation: 90,
                      lightColor: "#00ff00",
                    },
                  }
                : type === "custom"
                  ? {
                      name: "Custom",
                      shape: [
                        [1, 1],
                        [1, 1],
                      ],
                    }
                  : { name: "Signal", footprint: { width: 4, height: 4 } },
        },
        assetUrl: (path) => `/assets/${path}?v=1&x=<&`,
      },
    ).svg;
    expect(result).toContain("Shape &lt;test&gt;");
    expect(result).toContain("custom-shape-mask-0");
    expect(result).toContain("asset-clip-1");
    expect(result).toContain("rotate(90");
    expect(result).toContain('fill="#fff"');
    expect(result).toContain("#00ff99");
    expect(result).toContain('dominant-baseline="middle"');
    expect(result).toContain(">Mac</text>");
  });

  test("renders outlines below foundations and belts, then structures and signals", () => {
    const result = renderBlueprintToSvg(
      {
        name: "SVG fixture",
        data: [
          { type: 11, x: 0, y: 0 },
          { type: "conveyorLeftMk2", x: 4, y: 0 },
          { type: "machine", x: 8, y: 0 },
          { type: "signalBuffer", x: 12, y: 0 },
        ],
        signalLinks: [{ from: { x: 12, y: 0 }, to: { x: 8, y: 0 }, on: true }],
      },
      { showGrid: false, showSignalLinks: true },
    ).svg;
    const foundation = result.indexOf('data-structure-index="0"');
    const belt = result.indexOf('data-structure-index="1"');
    const outline = result.indexOf('stroke="#000000"');
    const machine = result.indexOf('data-structure-index="2"');
    const signal = result.indexOf('stroke="#00ff99"');
    expect(foundation).toBeGreaterThanOrEqual(0);
    expect(belt).toBeGreaterThan(foundation);
    expect(outline).toBeGreaterThanOrEqual(0);
    expect(outline).toBeLessThan(foundation);
    expect(outline).toBeLessThan(belt);
    expect(machine).toBeGreaterThan(outline);
    expect(signal).toBeGreaterThan(machine);
  });

  test("renders the opt-in six-cell edge fade only with a visible background", () => {
    const blueprint = {
      name: "Edge fade",
      data: [{ type: "machine", x: 0, y: 0 }],
      signalLinks: null,
    };
    const faded = renderBlueprintToSvg(blueprint, {
      padding: 1,
      cell: 8,
      showGrid: false,
      showEdgeFade: true,
    }).svg;

    expect(faded.match(/blueprint-map-opacity-/g)).toHaveLength(8);
    expect(faded.match(/<rect[^>]+fill="url\(#blueprint-map-opacity-/g)).toHaveLength(4);
    expect(faded).toContain('x2="48"');
    expect(faded).toContain('y2="48"');
    expect(faded).toContain('offset="16.6667%"');
    expect(faded).toContain('offset="83.3333%"');
    expect(
      renderBlueprintToSvg(blueprint, {
        padding: 1,
        cell: 8,
        showGrid: false,
        includeBackground: false,
        showEdgeFade: true,
      }).svg,
    ).not.toContain("blueprint-map-opacity-");
  });

  test("renders glass foundation and prefab terrain with the shared black boundary", () => {
    const result = renderBlueprintToSvg(
      {
        name: "Solid boundary fixtures",
        data: [
          { type: "glassFoundation", x: 0, y: 0 },
          {
            type: "prefabTerrain",
            x: 8,
            y: 0,
            data: {
              __prefabulatorBlueprint: {
                definition: {
                  shape: [
                    [1, 1, 0],
                    [1, 0, 0],
                  ],
                },
              },
            },
          },
        ],
        signalLinks: null,
      },
      {
        showGrid: false,
        catalog: {
          get: (type) =>
            type === "glassFoundation"
              ? {
                  footprint: { width: 4, height: 4 },
                  shape: Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 1)),
                  rawShape: true,
                }
              : undefined,
        },
      },
    ).svg;
    expect(result.match(/stroke="#000000"/g)).toHaveLength(1);
  });

  test("keeps the one-Pixel outline outside both sides of a foundation hole", () => {
    const result = renderBlueprintToSvg(
      {
        name: "Inset outline fixture",
        data: [
          {
            type: "ringFoundation",
            x: 0,
            y: 0,
            data: {
              __prefabulatorBlueprint: {
                definition: {
                  shape: [
                    [1, 1, 1],
                    [1, 0, 1],
                    [1, 1, 1],
                  ],
                },
              },
            },
          },
        ],
        signalLinks: null,
      },
      { padding: 1, cell: 8, showGrid: false, showNames: false },
    ).svg;

    expect(result).toContain('stroke-width="2"');
    expect(result).toContain('stroke-linecap="butt"');
    expect(result).toContain('stroke-linejoin="miter"');
    // The inner contour is offset into the one-cell hole. With one-cell
    // padding and an 8-unit Cell, its centerline is at 17/23 rather than the
    // occupied boundary at 16/24; the 2-unit stroke then ends at 16/24.
    expect(result).toContain("M 17 17 L 23 17 L 23 23 L 17 23 Z");
  });

  test("runs the SVG-to-PNG platform pipeline with rounded dimensions", async () => {
    const calls: string[] = [];
    const result = await renderSvgToPng("<svg />", {
      width: 2,
      height: 3,
      scale: 1.6,
      platform: {
        loadSvg: async (svg) => {
          calls.push(svg);
          return { kind: "image" };
        },
        createCanvas: (width, height) => ({ width, height }),
        drawImage: (canvas, image, width, height) =>
          calls.push(`${image.kind}:${canvas.width}x${canvas.height}:${width}x${height}`),
        encodePng: async (canvas) => new Uint8Array([canvas.width, canvas.height]),
      },
    });
    expect([...result]).toEqual([3, 5]);
    expect(calls[0]).toContain('viewBox="0 0 2 3"');
    expect(calls[1]).toBe("image:3x5:3x5");
  });

  test("reuses pre-computed render model when provided", () => {
    const blueprint = {
      name: "Reuse fixture",
      data: [{ type: "machine", x: 0, y: 0 }],
      signalLinks: null,
    };
    const model = createBlueprintRenderModel(blueprint);
    const result = renderBlueprintToSvg(blueprint, { model });
    expect(result.model).toBe(model);
  });
});
