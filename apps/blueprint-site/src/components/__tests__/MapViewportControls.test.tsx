import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MapViewportControls } from "../MapViewportControls";

describe("MapViewportControls", () => {
  test("renders standard controls, zoom percentage, and export button", () => {
    const html = renderToStaticMarkup(
      <MapViewportControls
        zoom={1.25}
        minZoom={0.25}
        maxZoom={4}
        onExport={() => {}}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onFit={() => {}}
      />,
    );

    expect(html).toContain("Export PNG");
    expect(html).toContain("125%");
    expect(html).toContain('title="Zoom out (-)"');
    expect(html).toContain('title="Zoom in (+)"');
    expect(html).toContain('title="Fit to viewport (0 or F)"');
  });

  test("renders extraActions and children slots", () => {
    const html = renderToStaticMarkup(
      <MapViewportControls
        zoom={1}
        extraActions={
          <button id="extra-btn" type="button">
            Extra
          </button>
        }
      >
        <span id="child-elem">Child Info</span>
      </MapViewportControls>,
    );

    expect(html).toContain('id="extra-btn"');
    expect(html).toContain("Extra");
    expect(html).toContain('id="child-elem"');
    expect(html).toContain("Child Info");
  });

  test("supports custom formatZoom function", () => {
    const html = renderToStaticMarkup(
      <MapViewportControls zoom={1.5} formatZoom={(z) => `Scale: ${z}x`} />,
    );

    expect(html).toContain("Scale: 1.5x");
  });

  test("disables Fit button when fitMode matches measuredFitZoom and pan is at origin", () => {
    const html = renderToStaticMarkup(
      <MapViewportControls
        zoom={0.8}
        measuredFitZoom={0.8}
        fitMode={true}
        pan={{ x: 0, y: 0 }}
        onFit={() => {}}
      />,
    );

    expect(html).toContain("disabled");
  });

  test("respects explicit fitDisabled prop", () => {
    const htmlDisabled = renderToStaticMarkup(
      <MapViewportControls zoom={1} fitDisabled={true} onFit={() => {}} />,
    );
    expect(htmlDisabled).toContain("disabled");

    const htmlEnabled = renderToStaticMarkup(
      <MapViewportControls zoom={1} fitDisabled={false} onFit={() => {}} />,
    );
    expect(htmlEnabled).not.toContain("disabled");
  });
});
