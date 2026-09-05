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
});
