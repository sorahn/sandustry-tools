import { afterEach, describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PersistentCollapsible } from "../PersistentCollapsible";
import { writeStoredBoolean } from "../../utils/storage";

const originalWindow = (globalThis as typeof globalThis & { window?: unknown }).window;

function installStorage(values: Record<string, string> = {}) {
  const stored = new Map(Object.entries(values));
  const localStorage = {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage },
  });
  return stored;
}

describe("PersistentCollapsible", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  test("renders uncontrolled open by default and shows content", () => {
    const html = renderToStaticMarkup(
      <PersistentCollapsible title="Telemetry">
        <div>Content body</div>
      </PersistentCollapsible>,
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("Telemetry");
    expect(html).toContain("Content body");
  });

  test("respects defaultCollapsed and hides content", () => {
    const html = renderToStaticMarkup(
      <PersistentCollapsible title="Telemetry" defaultCollapsed>
        <div>Content body</div>
      </PersistentCollapsible>,
    );
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("Content body");
  });

  test("initializes from stored state when storageKey is provided", () => {
    installStorage();
    writeStoredBoolean("test.section.collapsed", false); // open = false
    const html = renderToStaticMarkup(
      <PersistentCollapsible
        title="Saved Section"
        storageKey="test.section.collapsed"
        defaultCollapsed={false}
      >
        <div>Should be hidden</div>
      </PersistentCollapsible>,
    );
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("Should be hidden");
  });
});
