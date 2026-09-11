import { describe, expect, test } from "bun:test";
import { stepZoomIn, stepZoomOut, wheelZoom, roundZoom, isAt100 } from "../zoom";

describe("zoom utility", () => {
  describe("isAt100", () => {
    test("detects exact and near 100% values", () => {
      expect(isAt100(1)).toBe(true);
      expect(isAt100(1.0005)).toBe(true);
      expect(isAt100(0.9995)).toBe(true);
      expect(isAt100(0.99)).toBe(false);
      expect(isAt100(1.01)).toBe(false);
    });
  });

  describe("roundZoom", () => {
    test("rounds floating point inaccuracies to 4 decimals", () => {
      expect(roundZoom(1.00001)).toBe(1);
      expect(roundZoom(0.9125000000000001)).toBe(0.9125);
    });
  });

  describe("stepZoomIn", () => {
    test("lands on 100% when zooming in from an arbitrary fractional scale below 100%", () => {
      // From arbitrary fit scale 37.4%
      let z = 0.374;
      z = stepZoomIn(z); // 0.4675
      expect(z).toBe(0.4675);
      z = stepZoomIn(z); // 0.5844
      expect(z).toBe(0.5844);
      z = stepZoomIn(z); // 0.7305
      expect(z).toBe(0.7305);
      z = stepZoomIn(z); // 0.9131
      expect(z).toBe(0.9131);
      z = stepZoomIn(z); // would be 1.1414 -> lands exactly on 1.0!
      expect(z).toBe(1);

      // Next step from 1.0 steps off cleanly
      z = stepZoomIn(z);
      expect(z).toBe(1.25);
    });

    test("lands on 100% from 0.8", () => {
      const z = stepZoomIn(0.8);
      expect(z).toBe(1);
    });

    test("lands on 100% when close to 1.0 (e.g. 0.95)", () => {
      const z = stepZoomIn(0.95);
      expect(z).toBe(1);
    });

    test("steps in above 100% correctly", () => {
      expect(stepZoomIn(1.25)).toBe(1.5625);
      expect(stepZoomIn(7)).toBe(8); // clamps to max
    });
  });

  describe("stepZoomOut", () => {
    test("lands on 100% when zooming out from an arbitrary fractional scale above 100%", () => {
      // From arbitrary scale 183.2%
      let z = 1.832;
      z = stepZoomOut(z); // 1.4656
      expect(z).toBe(1.4656);
      z = stepZoomOut(z); // 1.1725
      expect(z).toBe(1.1725);
      z = stepZoomOut(z); // would be 0.938 -> lands exactly on 1.0!
      expect(z).toBe(1);

      // Next step from 1.0 steps off cleanly
      z = stepZoomOut(z);
      expect(z).toBe(0.8);
    });

    test("lands on 100% from 1.25", () => {
      const z = stepZoomOut(1.25);
      expect(z).toBe(1);
    });

    test("lands on 100% when close to 1.0 (e.g. 1.05)", () => {
      const z = stepZoomOut(1.05);
      expect(z).toBe(1);
    });

    test("steps out below 100% correctly", () => {
      expect(stepZoomOut(0.8)).toBe(0.64);
      expect(stepZoomOut(0.13, { min: 0.125 })).toBe(0.125); // clamps to min
    });
  });

  describe("wheelZoom", () => {
    test("lands on 100% when wheel zooming in past 100%", () => {
      // From 0.92
      let z = wheelZoom(0.92, -100);
      expect(z).toBe(1); // Caught at 1.0 detent

      // Next tick from 1.0 steps off cleanly
      z = wheelZoom(z, -100);
      expect(z).toBe(1.15);
    });

    test("lands on 100% when wheel zooming out past 100%", () => {
      // From 1.12
      let z = wheelZoom(1.12, 100);
      expect(z).toBe(1); // Caught at 1.0 detent

      // Next tick from 1.0 steps off cleanly
      z = wheelZoom(z, 100);
      expect(z).toBe(0.87);
    });

    test("respects min and max bounds during wheel zoom", () => {
      expect(wheelZoom(7.5, -100, { max: 8 })).toBe(8);
      expect(wheelZoom(0.13, 100, { min: 0.125 })).toBe(0.125);
    });
  });
});
