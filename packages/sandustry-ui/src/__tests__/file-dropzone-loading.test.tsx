import { describe, expect, test, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FileDropZone,
  LoadingOverlay,
  Spinner,
  createDragDepthTracker,
  isFileAccepted,
} from "../index";

describe("FileDropZone & LoadingOverlay Interactive Vertical Slice", () => {
  describe("FileDropZone", () => {
    test("tracks nested drag depth without premature clear", () => {
      let state = false;
      const tracker = createDragDepthTracker((dragging) => {
        state = dragging;
      });

      const preventDefault = mock(() => {});

      // Enter dropzone
      tracker.enter({ preventDefault });
      expect(preventDefault).toHaveBeenCalled();
      expect(state).toBe(true);
      expect(tracker.depth).toBe(1);

      // Enter child element
      tracker.enter({ preventDefault });
      expect(state).toBe(true);
      expect(tracker.depth).toBe(2);

      // Leave child element
      tracker.leave({ preventDefault });
      expect(state).toBe(true);
      expect(tracker.depth).toBe(1);

      // Leave dropzone
      tracker.leave({ preventDefault });
      expect(state).toBe(false);
      expect(tracker.depth).toBe(0);
    });

    test("drop resets depth and resets state to false", () => {
      let state = false;
      const tracker = createDragDepthTracker((dragging) => {
        state = dragging;
      });

      tracker.enter();
      expect(state).toBe(true);
      tracker.drop();
      expect(state).toBe(false);
      expect(tracker.depth).toBe(0);
    });

    test("isFileAccepted correctly filters extensions and MIME types", () => {
      const saveFile = new File(["123"], "world.save", { type: "application/octet-stream" });
      const txtFile = new File(["hello"], "notes.txt", { type: "text/plain" });
      const pngFile = new File(["img"], "preview.png", { type: "image/png" });

      expect(isFileAccepted(saveFile, ".save")).toBe(true);
      expect(isFileAccepted(saveFile, ".save,.blueprint")).toBe(true);
      expect(isFileAccepted(txtFile, ".save")).toBe(false);

      expect(isFileAccepted(pngFile, "image/*")).toBe(true);
      expect(isFileAccepted(pngFile, "image/png")).toBe(true);
      expect(isFileAccepted(pngFile, "image/jpeg")).toBe(false);
    });

    test("renders accessible attributes and input props", () => {
      const html = renderToStaticMarkup(
        <FileDropZone
          accept=".save"
          clickable
          disabled
          aria-label="Upload save"
          className="custom-zone"
          activeClassName="dragging-zone"
          disabledClassName="disabled-zone"
        >
          <span>Drop area</span>
        </FileDropZone>,
      );

      expect(html).toContain('role="button"');
      expect(html).toContain('aria-disabled="true"');
      expect(html).toContain('aria-label="Upload save"');
      expect(html).toContain('accept=".save"');
      expect(html).toContain('disabled=""');
      expect(html).toContain("disabled-zone");
      expect(html).toContain("custom-zone");
    });
  });

  describe("Spinner & LoadingOverlay", () => {
    test("Spinner renders tokenized classes and respects reduced motion", () => {
      const html = renderToStaticMarkup(<Spinner size="small" tone="accent" />);
      expect(html).toContain("border-yellow-400");
      expect(html).toContain("motion-reduce:animate-none");
      expect(html).toContain("h-3.5 w-3.5");
      expect(html).toContain('role="status"');
    });

    test("LoadingOverlay renders backdrop, spinner, card, and message", () => {
      const html = renderToStaticMarkup(
        <LoadingOverlay
          busy={true}
          message="Parsing world save…"
          dataTestId="explorer-loading-overlay"
        />,
      );

      expect(html).toContain('data-testid="explorer-loading-overlay"');
      expect(html).toContain("Parsing world save…");
      expect(html).toContain("backdrop-blur-xs");
      expect(html).toContain("opacity-100");
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain('aria-live="polite"');
    });

    test("LoadingOverlay does not mount when busy is false", () => {
      const html = renderToStaticMarkup(<LoadingOverlay busy={false} message="Idle" />);
      expect(html).toBe("");
    });
  });
});
