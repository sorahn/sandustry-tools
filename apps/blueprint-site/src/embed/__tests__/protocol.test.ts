import { describe, expect, test } from "bun:test";
import {
  BLUEPRINT_RENDERER_NAMESPACE,
  isAllowedParentOrigin,
  isRendererInspectorOptionsRequest,
  isRendererRequest,
  rendererPreviewErrorEvent,
  rendererResizeEvent,
  rendererReadyEvent,
} from "../protocol";
import { FIT_POLICY_PRESETS } from "../../utils/blueprint-fit";

describe("blueprint renderer embed protocol", () => {
  test("accepts only well-formed renderer requests", () => {
    expect(
      isRendererRequest({
        namespace: BLUEPRINT_RENDERER_NAMESPACE,
        type: "set-blueprint",
        requestId: "paste-1",
        blueprint: "SAND:BP:v2:fixture",
        fitPolicy: { preset: "default" },
      }),
    ).toBe(true);
    expect(
      isRendererRequest({
        namespace: BLUEPRINT_RENDERER_NAMESPACE,
        type: "set-blueprint",
        requestId: "bad request",
        blueprint: "SAND:BP:v2:fixture",
      }),
    ).toBe(false);
    expect(isRendererRequest(null)).toBe(false);
    expect(FIT_POLICY_PRESETS.default).toBeDefined();
    expect(
      isRendererRequest({
        namespace: BLUEPRINT_RENDERER_NAMESPACE,
        type: "set-blueprint",
        requestId: "paste-1",
        blueprint: "SAND:BP:v2:fixture",
        fitPolicy: { zoom: { levels: [] } },
      }),
    ).toBe(false);
  });

  test("matches exact configured origins", () => {
    expect(isAllowedParentOrigin("https://vault.example", ["https://vault.example"])).toBe(true);
    expect(isAllowedParentOrigin("https://evil.example", ["https://vault.example"])).toBe(false);
  });

  test("accepts inspector display option requests", () => {
    expect(
      isRendererInspectorOptionsRequest({
        namespace: BLUEPRINT_RENDERER_NAMESPACE,
        type: "set-inspector-options",
        showGrid: false,
        showPngBackground: true,
        showSidebar: false,
      }),
    ).toBe(true);
    expect(
      isRendererInspectorOptionsRequest({
        namespace: BLUEPRINT_RENDERER_NAMESPACE,
        type: "set-inspector-options",
        showGrid: "false",
      }),
    ).toBe(false);
  });

  test("creates a versioned ready event", () => {
    expect(rendererReadyEvent()).toEqual({
      namespace: BLUEPRINT_RENDERER_NAMESPACE,
      type: "ready",
      protocolVersion: 1,
    });
  });

  test("creates request-correlated preview errors", () => {
    expect(rendererPreviewErrorEvent("paste-2", "invalid-blueprint", "Bad data")).toEqual({
      namespace: BLUEPRINT_RENDERER_NAMESPACE,
      type: "preview-error",
      requestId: "paste-2",
      code: "invalid-blueprint",
      message: "Bad data",
    });
  });

  test("creates resize events", () => {
    expect(rendererResizeEvent(640, 480)).toEqual({
      namespace: BLUEPRINT_RENDERER_NAMESPACE,
      type: "resize",
      width: 640,
      height: 480,
    });
  });
});
