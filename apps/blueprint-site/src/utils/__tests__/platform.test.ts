import { afterEach, describe, expect, test } from "bun:test";
import { isMacPlatform, primaryModifierKey } from "../platform";

const originalNavigator = (globalThis as typeof globalThis & { navigator?: unknown }).navigator;

afterEach(() => {
  if (originalNavigator === undefined) {
    delete (globalThis as { navigator?: unknown }).navigator;
  } else {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  }
});

describe("platform detection utility", () => {
  test("detects Mac via userAgentData.platform", () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { userAgentData: { platform: "macOS" } },
    });
    expect(isMacPlatform()).toBe(true);
    expect(primaryModifierKey()).toBe("Cmd");
  });

  test("detects Windows via userAgentData.platform", () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { userAgentData: { platform: "Windows" } },
    });
    expect(isMacPlatform()).toBe(false);
    expect(primaryModifierKey()).toBe("Ctrl");
  });

  test("detects Mac via navigator.platform fallback", () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { platform: "MacIntel", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    });
    expect(isMacPlatform()).toBe(true);
    expect(primaryModifierKey()).toBe("Cmd");
  });

  test("detects Linux via navigator.platform fallback", () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { platform: "Linux x86_64", userAgent: "Mozilla/5.0 (X11; Linux x86_64)" },
    });
    expect(isMacPlatform()).toBe(false);
    expect(primaryModifierKey()).toBe("Ctrl");
  });

  test("handles undefined navigator gracefully", () => {
    delete (globalThis as { navigator?: unknown }).navigator;
    expect(isMacPlatform()).toBe(false);
    expect(primaryModifierKey()).toBe("Ctrl");
  });
});
