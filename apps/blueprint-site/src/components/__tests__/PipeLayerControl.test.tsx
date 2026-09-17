import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PipeLayerControl } from "../PipeLayerControl";

describe("PipeLayerControl", () => {
  test("renders an inactive pipe-layer toggle", () => {
    const html = renderToStaticMarkup(
      <PipeLayerControl active={false} onActiveChange={() => {}} />,
    );

    expect(html).toContain('aria-label="Show pipe layer"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("Pipes");
    expect(html).not.toContain("✓");
  });

  test("renders a clear active state", () => {
    const html = renderToStaticMarkup(<PipeLayerControl active={true} onActiveChange={() => {}} />);

    expect(html).toContain('aria-label="Hide pipe layer"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("border-yellow-400");
    expect(html).toContain("✓");
  });
});
