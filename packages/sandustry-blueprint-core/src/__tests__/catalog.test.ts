import { describe, expect, test } from "bun:test";
import { catalogRender, catalogRenderSize } from "../catalog";
import { blueprintCatalog, renderBlueprintToSvg } from "../index";

describe("catalog metadata helpers", () => {
  test("original and mk2 clearing frames align at the same native height", () => {
    const types = [
      "clearingFrameLeft",
      "clearingFrameRight",
      "clearingFrameLeftMk2",
      "clearingFrameRightMk2",
    ];
    const catalog = blueprintCatalog();
    const { svg } = renderBlueprintToSvg(
      {
        name: "clearing frame alignment",
        signalLinks: null,
        data: types.map((type, index) => ({ type, x: index * 8, y: 8 })),
      },
      { catalog, cell: 4, padding: 0 },
    );
    const images = [
      ...svg.matchAll(/<image href="[^"]*clearing_frame[^"]*" x="[^"]*" y="([^"]*)"/g),
    ];
    expect(images.map((match) => Number(match[1]))).toEqual([0, 0, 0, 0]);
  });

  test("new filters, portals and stratacore apply their one-pixel placement offsets once", () => {
    for (const type of [
      "advancedFilterLeftMk2",
      "advancedFilterRightMk2",
      "quantumPortalMk2",
      "quantumPortalMk2Exit",
      "calderaStratacore",
    ]) {
      const { svg } = renderBlueprintToSvg(
        {
          name: "native placement",
          signalLinks: null,
          data: [{ type, x: 8, y: 8 }],
        },
        { catalog: blueprintCatalog(), cell: 4, padding: 0 },
      );
      // The native -1 offset moves the render bounds with the sprite. With
      // no padding the top-left image position must therefore remain (0, 0).
      const image = svg.match(/<image href="[^"]*" x="([^"]*)" y="([^"]*)"/);
      expect(image?.slice(1)).toEqual(["0", "0"]);
    }
  });

  test("returns object render metadata and rejects non-object render values", () => {
    const render = { imageName: "machine", size: { width: 32, height: 24 } };
    expect(
      catalogRender({
        type: "machine",
        footprint: { width: 4, height: 4 },
        render,
        source: "test",
      }),
    ).toBe(render);
    expect(
      catalogRender({
        type: "machine",
        footprint: { width: 4, height: 4 },
        render: "legacy",
        source: "test",
      }),
    ).toBeUndefined();
    expect(
      catalogRender({ type: "machine", footprint: { width: 4, height: 4 }, source: "test" }),
    ).toBeUndefined();
  });

  test("extracts numeric render sizes only", () => {
    expect(catalogRenderSize({ size: { width: 32, height: 24 } })).toEqual({
      width: 32,
      height: 24,
    });
    expect(catalogRenderSize({ size: { width: 32, height: "24" } })).toBeUndefined();
    expect(catalogRenderSize({ size: "32x24" })).toBeUndefined();
    expect(catalogRenderSize(undefined)).toBeUndefined();
  });
});
