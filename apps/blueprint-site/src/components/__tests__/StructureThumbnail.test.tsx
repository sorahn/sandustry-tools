import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { StructureThumbnail, shapeOutlinePath } from "../StructureThumbnail";

describe("StructureThumbnail", () => {
  test("renders baby-blue grid background and aligns viewBox for simple sprite", () => {
    const html = renderToStaticMarkup(
      <StructureThumbnail
        name="Belt"
        footprint={{ width: 4, height: 4 }}
        asset={{
          path: "assets/catalog/belt.png",
          sourceSize: { width: 16, height: 16 },
          frame: { width: 16, height: 16 },
        }}
      />,
    );

    // Baby-blue background and grid defs
    expect(html).toContain("background-color:#33a8ff");
    expect(html).toContain('fill="#33a8ff"');
    expect(html).toContain('viewBox="0 0 16 16"');
    expect(html).toContain('stroke="#718096"');
    expect(html).toContain('stroke="#17202c"');
  });

  test("calculates rotational portrait bounding box for non-square sprites", () => {
    const html = renderToStaticMarkup(
      <StructureThumbnail
        name="Heat Cannon"
        footprint={{ width: 4, height: 4 }}
        rotation={90}
        asset={{
          path: "assets/catalog/heat_cannon.png",
          sourceSize: { width: 23, height: 16 },
          frame: { width: 23, height: 16 },
        }}
      />,
    );

    // Swapped portrait viewBox
    expect(html).toContain('viewBox="0 0 16 23"');
    expect(html).toContain("rotate(90 8 11.5)");
    expect(html).toContain('x="-3.5"');
    expect(html).toContain('y="3.5"');
  });

  test("renders custom shape outline and mask for prefab terrain", () => {
    const customShape = [
      [1, 1],
      [1, 0],
    ];
    const html = renderToStaticMarkup(
      <StructureThumbnail
        name="Prefab Terrain"
        footprint={{ width: 2, height: 2 }}
        customShape={customShape}
      />,
    );

    expect(html).toContain("prefab-mask");
    expect(html).toContain('stroke="#17202c"');
    expect(html).toContain('stroke-width="2"');
    expect(html).toContain("img__block.png");
  });

  test("shapeOutlinePath correctly outlines cell clusters", () => {
    const shape = [
      [1, 1],
      [1, 1],
    ];
    const path = shapeOutlinePath(shape, 0, 0, 8);
    expect(path).toContain("M 0 0");
    expect(path).toContain("L 16 0");
  });
});
