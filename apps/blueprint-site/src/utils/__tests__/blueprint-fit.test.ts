import { describe, expect, test } from "bun:test";
import {
  solveInitialFit,
  DEFAULT_FIT_POLICY,
  FIT_POLICY_PRESETS,
  type FitPolicy,
} from "../blueprint-fit";

describe("blueprint initial-fit policies", () => {
  test("preserves the standard width-first fallback for large blueprints", () => {
    const result = solveInitialFit(
      {
        contentWidth: 1200,
        contentHeight: 1200,
        viewportWidth: 800,
        viewportHeight: 502,
        marginPx: 96,
      },
      DEFAULT_FIT_POLICY,
    );

    expect(result.zoom).toBe(0.5);
    expect(result.viewportHeight).toBeGreaterThan(502);
    expect(result.pan).toEqual({ x: 0, y: 0 });
  });

  test("allows a policy to choose a different initial zoom strategy", () => {
    const widthFirstPolicy: FitPolicy = {
      ...DEFAULT_FIT_POLICY,
      zoom: {
        ...DEFAULT_FIT_POLICY.zoom,
        max: 1,
        fallbackMax: 1,
      },
      fit: { width: "required", height: "preferred" },
    };
    const result = solveInitialFit(
      {
        contentWidth: 400,
        contentHeight: 1200,
        viewportWidth: 800,
        viewportHeight: 502,
        marginPx: 96,
      },
      widthFirstPolicy,
    );

    expect(result.zoom).toBe(1);
    expect(result.viewportHeight).toBeGreaterThan(502);
  });

  test("exposes the legacy-equivalent policy as the default preset", () => {
    expect(FIT_POLICY_PRESETS.default).toBe(DEFAULT_FIT_POLICY);
  });
});
