import { describe, expect, test, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: "/", searchStr: "", search: {} }),
}));

import { BlueprintSubmissionPanel } from "../BlueprintSubmissionPanel";
import { BlueprintCodecPage } from "../../pages/Codec";
import { BlueprintMapViewportControls } from "../BlueprintMapViewportControls";
import { BlueprintMapStructure } from "../BlueprintMapStructure";
import { SaveExplorerMapPanel } from "../SaveExplorerMapPanel";

describe("Phase 7 Accessibility & Keyboard Ergonomics", () => {
  test("BlueprintSubmissionPanel binds accessible label, aria-label, and aria-describedby", () => {
    const html = renderToStaticMarkup(
      <BlueprintSubmissionPanel
        encoded="SAND:BP:v2:test"
        message="Valid blueprint"
        rememberHeader={null}
        onEncodedChange={() => {}}
        onClear={() => {}}
        onInspect={() => {}}
        summary={null}
        blueprint={null}
      />,
    );
    expect(html).toContain('id="blueprint-submission-input"');
    expect(html).toContain('aria-label="Blueprint string"');
    expect(html).toContain('aria-describedby="blueprint-submission-message"');
    expect(html).toContain('id="blueprint-submission-message"');
    expect(html).toContain('for="blueprint-submission-input"');
  });

  test("BlueprintCodecPage binds accessible labels and aria-describedby on inputs", () => {
    const html = renderToStaticMarkup(<BlueprintCodecPage />);
    expect(html).toContain('id="codec-blueprint-string"');
    expect(html).toContain('for="codec-blueprint-string"');
    expect(html).toContain('aria-describedby="codec-status-message"');
    expect(html).toContain('id="codec-normalized-json"');
    expect(html).toContain('for="codec-normalized-json"');
    expect(html).toContain('id="codec-status-message"');
  });

  test("BlueprintMapViewportControls provides accessible title tooltips and focus rings", () => {
    const html = renderToStaticMarkup(
      <BlueprintMapViewportControls
        zoom={1}
        minZoom={0.25}
        maxZoom={4}
        measuredFitZoom={1}
        fitMode={false}
        pan={{ x: 0, y: 0 }}
        onExport={() => {}}
        onZoomOut={() => {}}
        onFit={() => {}}
        onZoomIn={() => {}}
      />,
    );
    expect(html).toContain('title="Zoom out (-)"');
    expect(html).toContain('title="Zoom in (+)"');
    expect(html).toContain('title="Fit to viewport (0 or F)"');
    expect(html).toContain("focus-visible:ring-2");
  });

  test("BlueprintMapStructure supports roving tabIndex and aria-selected", () => {
    const baseItem = {
      structure: { type: "conveyorBelt", x: 2, y: 3 },
      index: 0,
    };
    const preparedBlueprint = {
      preparedStructures: [
        {
          index: 0,
          type: "conveyorBelt",
          footprint: { width: 4, height: 4 },
          topY: 3,
        },
      ],
    } as any;

    // When NOT selected: tabIndex is -1 and aria-selected is false
    const unselectedHtml = renderToStaticMarkup(
      <svg>
        <BlueprintMapStructure
          item={baseItem as any}
          preparedBlueprint={preparedBlueprint}
          minX={0}
          minY={0}
          padding={0}
          cell={4}
          suppressClickRef={{ current: false }}
          onSelect={() => {}}
          isSelected={false}
        />
      </svg>,
    );
    expect(unselectedHtml).toContain('tabindex="-1"');
    expect(unselectedHtml).toContain('aria-selected="false"');
    expect(unselectedHtml).toContain('role="button"');

    // When selected: tabIndex is 0 and aria-selected is true
    const selectedHtml = renderToStaticMarkup(
      <svg>
        <BlueprintMapStructure
          item={baseItem as any}
          preparedBlueprint={preparedBlueprint}
          minX={0}
          minY={0}
          padding={0}
          cell={4}
          suppressClickRef={{ current: false }}
          onSelect={() => {}}
          isSelected={true}
        />
      </svg>,
    );
    expect(selectedHtml).toContain('tabindex="0"');
    expect(selectedHtml).toContain('aria-selected="true"');
  });

  test("SaveExplorerMapPanel viewport exposes role=region, tabIndex=0, and zoom control tooltips", () => {
    const html = renderToStaticMarkup(
      <SaveExplorerMapPanel
        inputRef={{ current: null }}
        canvasRef={{ current: null }}
        mapFrameRef={{ current: null }}
        dragRef={{ current: null }}
        raster={{ width: 10, height: 10, pixels: new Uint8ClampedArray(400) }}
        inspection={null}
        hoverCell={null}
        hoverCellRef={{ current: null }}
        view={{ scale: 1, offsetX: 0, offsetY: 0 }}
        customCursor={false}
        dragging={false}
        busy={false}
        documentLoaded={true}
        message="Ready"
        onChooseFile={() => {}}
        onFile={() => {}}
        onViewChange={() => {}}
        onHover={() => {}}
        onClearHover={() => {}}
        onDraggingChange={() => {}}
        fitMap={() => {}}
        onInspect={() => {}}
      />,
    );
    expect(html).toContain('role="region"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Save minimap viewport"');
    expect(html).toContain('title="Zoom in (+)"');
    expect(html).toContain('title="Zoom out (-)"');
    expect(html).toContain('title="Fit to viewport (0 or F)"');
  });
});
