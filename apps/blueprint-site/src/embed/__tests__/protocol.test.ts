import { describe, expect, test } from "bun:test";
import {
  BLUEPRINT_RENDERER_NAMESPACE,
  isAllowedParentOrigin,
  isRendererRequest,
  rendererPreviewErrorEvent,
  rendererPreviewReadyEvent,
  rendererReadyEvent,
} from "../protocol";

describe("blueprint renderer embed protocol", () => {
  test("accepts only well-formed renderer requests", () => {
    expect(
      isRendererRequest({
        namespace: BLUEPRINT_RENDERER_NAMESPACE,
        type: "set-blueprint",
        requestId: "paste-1",
        blueprint: "SAND:BP:v2:fixture",
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
  });

  test("matches exact configured origins", () => {
    expect(isAllowedParentOrigin("https://vault.example", ["https://vault.example"])).toBe(true);
    expect(isAllowedParentOrigin("https://evil.example", ["https://vault.example"])).toBe(false);
  });

  test("creates a versioned ready event", () => {
    expect(rendererReadyEvent(["thumbnail", "inspector"])).toEqual({
      namespace: BLUEPRINT_RENDERER_NAMESPACE,
      type: "ready",
      protocolVersion: 1,
      modes: ["thumbnail", "inspector"],
    });
  });

  test("creates request-correlated preview events", () => {
    expect(rendererPreviewReadyEvent("paste-1", "Factory", 320, 180)).toEqual({
      namespace: BLUEPRINT_RENDERER_NAMESPACE,
      type: "preview-ready",
      requestId: "paste-1",
      blueprintName: "Factory",
      width: 320,
      height: 180,
    });
    expect(rendererPreviewErrorEvent("paste-2", "invalid-blueprint", "Bad data")).toEqual({
      namespace: BLUEPRINT_RENDERER_NAMESPACE,
      type: "preview-error",
      requestId: "paste-2",
      code: "invalid-blueprint",
      message: "Bad data",
    });
  });
});
