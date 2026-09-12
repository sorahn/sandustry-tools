import { describe, expect, test } from "bun:test";
import {
  solveInitialFit,
  DEFAULT_FIT_POLICY,
  FIT_POLICY_PRESETS,
  type FitPolicy,
} from "../blueprint-fit";

describe("blueprint initial-fit policies", () => {
  test("fits large blueprints continuously within the fixed viewport", () => {
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

    expect(result.zoom).toBeCloseTo(0.3606321839);
    expect(result.viewportHeight).toBe(502);
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
    expect(result.viewportHeight).toBe(502);
  });

  test("fits small blueprints to the fixed viewport", () => {
    const result = solveInitialFit(
      {
        contentWidth: 400,
        contentHeight: 400,
        viewportWidth: 800,
        viewportHeight: 502,
        marginPx: 48,
      },
      DEFAULT_FIT_POLICY,
    );

    expect(result.zoom).toBeCloseTo(1.0120967742);
    expect(result.viewportHeight).toBe(502);
  });

  test("exposes the current policy as the default preset", () => {
    expect(FIT_POLICY_PRESETS.default).toBe(DEFAULT_FIT_POLICY);
    expect(DEFAULT_FIT_POLICY.initialZoom).toBe("continuous");
    expect(DEFAULT_FIT_POLICY.geometry.padding).toBe(4);
    expect(DEFAULT_FIT_POLICY.grid?.extendToViewport).toBe(true);
  });

  test("preserves level-based Vault fitting", () => {
    expect(FIT_POLICY_PRESETS.vault.initialZoom).toBe("levels");
    expect(FIT_POLICY_PRESETS.vault.geometry.padding).toBe(6);
    expect(FIT_POLICY_PRESETS.vault.grid?.extendToViewport).toBe(true);
    expect(FIT_POLICY_PRESETS.vault.zoom.levels[0]).toBe(0.25);
    expect(FIT_POLICY_PRESETS.vault.viewport.allowHeightGrowth).toBe(true);
  });

  test("keeps the test policy aligned with the default policy", () => {
    expect(FIT_POLICY_PRESETS.test).not.toBe(DEFAULT_FIT_POLICY);
    expect(FIT_POLICY_PRESETS.test).toEqual(DEFAULT_FIT_POLICY);
  });

  test("fits the Vault policy using its configured levels", () => {
    const result = solveInitialFit(
      {
        contentWidth: 1200,
        contentHeight: 1200,
        viewportWidth: 800,
        viewportHeight: 502,
        marginPx: 48,
      },
      FIT_POLICY_PRESETS.vault,
    );

    expect(result.zoom).toBe(0.5);
    expect(result.viewportHeight).toBe(650);
  });

  test("uses the aspect viewport height when calculating zoom in Vault policy", () => {
    // With 1200 content height and margin 48, fitHeight = 1296.
    // In a tall 1000px viewport, 1000 / 1296 = 0.771 -> fits at zoom 0.75 if width allows.
    // With 1800 viewportWidth, 1800 / 1296 = 1.38 -> width is not the constraint.
    const result = solveInitialFit(
      {
        contentWidth: 1200,
        contentHeight: 1200,
        viewportWidth: 1800,
        viewportHeight: 1000,
        marginPx: 48,
      },
      FIT_POLICY_PRESETS.vault,
    );

    expect(result.zoom).toBe(1);
    expect(result.viewportHeight).toBe(1298);
  });
});
