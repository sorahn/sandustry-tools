import { describe, expect, test, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SaveExplorerMapPanel, createDragDepthTracker } from "../SaveExplorerMapPanel";

describe("SaveExplorerMapPanel", () => {
  const baseProps = {
    inputRef: { current: null },
    canvasRef: { current: null },
    mapFrameRef: { current: null },
    dragRef: { current: null },
    raster: null,
    inspection: null,
    hoverCell: null,
    hoverCellRef: { current: null },
    view: { scale: 1, offsetX: 0, offsetY: 0 },
    customCursor: false,
    dragging: false,
    busy: false,
    documentLoaded: false,
    message: "Drop a .save file here to begin.",
    onChooseFile: () => {},
    onFile: () => {},
    onViewChange: () => {},
    onHover: () => {},
    onClearHover: () => {},
    onDraggingChange: () => {},
    fitMap: () => {},
    onInspect: () => {},
  };

  test("renders dropzone in inactive state with normal pointer events on children", () => {
    const html = renderToStaticMarkup(<SaveExplorerMapPanel {...baseProps} dragging={false} />);
    expect(html).toContain("border-slate-800/90");
    expect(html).toContain("Choose save file");
    expect(html).not.toContain("pointer-events-none");
    expect(html).not.toContain("border-yellow-400/70");
  });

  test("renders dropzone in active state with highlight and pointer-events-none on child wrapper", () => {
    const html = renderToStaticMarkup(<SaveExplorerMapPanel {...baseProps} dragging={true} />);
    expect(html).toContain("border-yellow-400/70");
    expect(html).toContain("bg-amber-900/30");
    expect(html).toContain("pointer-events-none");
  });

  test("createDragDepthTracker tracks nested drag enters/leaves without prematurely clearing drag state", () => {
    const onDraggingChange = mock(() => {});
    const tracker = createDragDepthTracker(() => onDraggingChange);
    const preventDefault = mock(() => {});

    // 1. Initial drag enter into dropzone
    tracker.enter({ preventDefault });
    expect(preventDefault).toHaveBeenCalled();
    expect(tracker.depth).toBe(1);
    expect(onDraggingChange).toHaveBeenCalledWith(true);

    // 2. Drag moves over child element (button / text) triggering nested dragEnter
    tracker.enter({ preventDefault });
    expect(tracker.depth).toBe(2);
    expect(onDraggingChange).toHaveBeenCalledTimes(1); // Not called again

    // 3. Child element dragLeave fires as cursor transitions
    tracker.leave({ preventDefault });
    expect(tracker.depth).toBe(1);
    // Still inside dropzone, so onDraggingChange(false) must NOT have been called!
    expect(onDraggingChange).not.toHaveBeenCalledWith(false);

    // 4. Entering another child
    tracker.enter({ preventDefault });
    expect(tracker.depth).toBe(2);
    tracker.leave({ preventDefault });
    expect(tracker.depth).toBe(1);
    expect(onDraggingChange).not.toHaveBeenCalledWith(false);

    // 5. Exiting dropzone entirely
    tracker.leave({ preventDefault });
    expect(tracker.depth).toBe(0);
    expect(onDraggingChange).toHaveBeenCalledWith(false);

    // 6. Test drop resets depth and calls onDraggingChange(false)
    tracker.enter({ preventDefault });
    expect(tracker.depth).toBe(1);
    tracker.drop({ preventDefault });
    expect(tracker.depth).toBe(0);
    expect(onDraggingChange).toHaveBeenLastCalledWith(false);

    // 7. Test reset
    tracker.enter({ preventDefault });
    tracker.enter({ preventDefault });
    expect(tracker.depth).toBe(2);
    tracker.reset();
    expect(tracker.depth).toBe(0);
  });
});
