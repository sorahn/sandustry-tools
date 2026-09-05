import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BlueprintMapSidebar } from "../BlueprintMapSidebar";
import type { Blueprint } from "../../utils/blueprint";

describe("BlueprintMapSidebar", () => {
  test("renders prompt when no structure is selected", () => {
    const html = renderToStaticMarkup(<BlueprintMapSidebar selected={null} debugOptions={null} />);
    expect(html).toContain(
      "Choose a tile to inspect its structure details and filter configuration",
    );
  });

  test("renders rich filter details with element names, swatches, and matter phases", () => {
    const blueprint: Blueprint = {
      name: "Test blueprint",
      data: [
        {
          type: "filterWall",
          x: 10,
          y: 20,
          filter: {
            mode: "allow",
            elementType: [1, 3], // Sand (Solid), Water (Liquid)
            density: 2.5,
            affectsLiquid: true,
          },
          data: {
            filterPassThrough: true,
          },
        },
      ],
      signalLinks: [],
    };

    const selected = blueprint.data[0];
    const html = renderToStaticMarkup(
      <BlueprintMapSidebar
        selected={selected}
        selectedIndex={0}
        totalStructures={1}
        blueprint={blueprint}
        debugOptions={null}
      />,
    );

    // Title & Index
    expect(html).toContain("Filter Wall");
    expect(html).toContain("#1 / 1");

    // Filter configuration
    expect(html).toContain("Filter Configuration");
    expect(html).toContain("Allow Only");
    expect(html).toContain("Pass-Through");

    // Resolved Elements
    expect(html).toContain("Sand");
    expect(html).toContain("#f4a460");
    expect(html).toContain("Solid");

    expect(html).toContain("Water");
    expect(html).toContain("#1e90ff");
    expect(html).toContain("Liquid");

    // Advanced parameters
    expect(html).toContain("≥ 2.5");
    expect(html).toContain("Filtered");

    // Placement & Geometry
    expect(html).toContain("10, 20");
    expect(html).toContain("4×4 cells");

    // Collapsible raw record
    expect(html).toContain("Raw Record (JSON)");
  });

  test("renders Infinite Source output element from data", () => {
    const blueprint: Blueprint = {
      name: "Source blueprint",
      data: [
        {
          type: "sandustryTestBlocksSource",
          x: 0,
          y: 0,
          data: {
            elementId: 1, // Sand
          },
        },
      ],
      signalLinks: [],
    };

    const html = renderToStaticMarkup(
      <BlueprintMapSidebar
        selected={blueprint.data[0]}
        selectedIndex={0}
        blueprint={blueprint}
        debugOptions={null}
      />,
    );

    expect(html).toContain("Infinite Source Output");
    expect(html).toContain("Sand");
    expect(html).toContain("Solid");
  });

  test("renders connected signal links", () => {
    const blueprint: Blueprint = {
      name: "Signal blueprint",
      data: [
        {
          type: 2,
          x: 10,
          y: 10,
        },
      ],
      signalLinks: [
        {
          from: { x: 10, y: 10 },
          to: { x: 20, y: 20 },
          on: true,
        },
      ],
    };

    const html = renderToStaticMarkup(
      <BlueprintMapSidebar
        selected={blueprint.data[0]}
        selectedIndex={0}
        blueprint={blueprint}
        debugOptions={null}
      />,
    );

    expect(html).toContain("Signal Connections");
    expect(html).toContain("(10, 10) → (20, 20)");
    expect(html).toContain("ON");
  });

  test("clips sprite sheet frames and crops correctly in the thumbnail SVG", () => {
    const blueprint: Blueprint = {
      name: "Conveyor blueprint",
      data: [{ type: 2, x: 0, y: 0 }],
      signalLinks: [],
    };

    const preparedStructure = {
      structure: blueprint.data[0],
      index: 0,
      sprite: {
        asset: {
          path: "assets/catalog/conveyor.png",
          sourceSize: { width: 128, height: 16 },
          frame: { width: 16, height: 16 },
        },
        frameIndex: 3,
        rotation: 90,
      },
      lightColor: "#00ff00",
      footprint: { width: 4, height: 4 },
      topY: 0,
      visualTopY: 0,
      z: 0.5,
      bounds: { minX: 0, minY: 0, maxX: 3, maxY: 3 },
    };

    const html = renderToStaticMarkup(
      <BlueprintMapSidebar
        selected={blueprint.data[0]}
        selectedIndex={0}
        preparedStructure={preparedStructure as any}
        blueprint={blueprint}
        debugOptions={null}
      />,
    );

    // ViewBox is exactly one frame: 16x16
    expect(html).toContain('viewBox="0 0 16 16"');
    // Full sprite sheet width is 128
    expect(html).toContain('width="128"');
    // Offset for frameIndex 3 is -3 * 16 = -48
    expect(html).toContain('x="-48"');
    // Rotation transform applied
    expect(html).toContain("rotate(90 8 8)");
    // Light bar rendered
    expect(html).toContain('fill="#00ff00"');
  });

  test("renders thumbnail with baby blue background and cell grid filling the window with centered sprite", () => {
    const blueprint: Blueprint = {
      name: "Conveyor blueprint",
      data: [{ type: 2, x: 0, y: 0 }],
      signalLinks: [],
    };

    const html = renderToStaticMarkup(
      <BlueprintMapSidebar
        selected={blueprint.data[0]}
        selectedIndex={0}
        blueprint={blueprint}
        debugOptions={null}
      />,
    );

    // Baby blue background fills the 64x64 window
    expect(html).toContain("background-color:#33a8ff");
    expect(html).toContain('fill="#33a8ff"');
    // Faint cell grid pattern strokes
    expect(html).toContain('stroke="#718096"');
    expect(html).toContain('stroke="#17202c"');
    expect(html).toContain('opacity="0.25"');
    // 4x4 thick lines and cell grid match the placed asset origin (x=16, y=16)
    expect(html).toContain('x="16" y="16"');
    // No thick border around the sprite
    expect(html).not.toContain("outline:2px solid black");
  });

  test("renders rotated non-square sprite (heatCannonDown) with swapped portrait bounding box so nozzle is not cut off", () => {
    const blueprint: Blueprint = {
      name: "Pyro blueprint",
      data: [{ type: "heatCannonDown", x: 0, y: 0 }],
      signalLinks: [],
    };

    const preparedStructure = {
      structure: blueprint.data[0],
      index: 0,
      sprite: {
        asset: {
          path: "assets/catalog/heat_cannon.png",
          sourceSize: { width: 23, height: 16 },
          frame: { width: 23, height: 16 },
        },
        frameIndex: 0,
        rotation: 90,
      },
      footprint: { width: 4, height: 4 },
      topY: 0,
      visualTopY: 0,
      z: 0.5,
      bounds: { minX: 0, minY: 0, maxX: 3, maxY: 3 },
    };

    const html = renderToStaticMarkup(
      <BlueprintMapSidebar
        selected={blueprint.data[0]}
        selectedIndex={0}
        preparedStructure={preparedStructure as any}
        blueprint={blueprint}
        debugOptions={null}
      />,
    );

    // ViewBox is swapped to 16x23 (portrait) instead of being clipped in 23x16
    expect(html).toContain('viewBox="0 0 16 23"');
    // Rotated 90 around the center of the swapped bounding box (8, 11.5)
    expect(html).toContain("rotate(90 8 11.5)");
    // Offset centers the 23x16 unrotated crop window inside the 16x23 box
    expect(html).toContain('x="-3.5"');
    expect(html).toContain('y="3.5"');
  });

  test("clips Kinetic Press thumbnail to 18x18 square head matching the game build menu tile", () => {
    const blueprint: Blueprint = {
      name: "Kinetic Press blueprint",
      data: [{ type: 20, x: 0, y: 0 }],
      signalLinks: [],
    };

    const preparedStructure = {
      structure: blueprint.data[0],
      index: 0,
      sprite: {
        asset: {
          path: "assets/catalog/velocity.png",
          sourceSize: { width: 18, height: 417 },
          sourceCrop: { x: 0, y: 0, width: 18, height: 417 },
        },
        frameIndex: 0,
        rotation: 0,
      },
      footprint: { width: 4, height: 4 },
      topY: 0,
      visualTopY: 0,
      z: 0.5,
      bounds: { minX: 0, minY: 0, maxX: 3, maxY: 3 },
    };

    const html = renderToStaticMarkup(
      <BlueprintMapSidebar
        selected={blueprint.data[0]}
        selectedIndex={0}
        preparedStructure={preparedStructure as any}
        blueprint={blueprint}
        debugOptions={null}
      />,
    );

    // ViewBox is clipped square to the 18x18 press head
    expect(html).toContain('viewBox="0 0 18 18"');
    // Scaled 2x to 36x36px and centered at (14, 14)
    expect(html).toContain("width:36px");
    expect(html).toContain("height:36px");
    expect(html).toContain('x="14" y="14"');
  });
});
