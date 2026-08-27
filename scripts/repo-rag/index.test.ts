import { test, expect } from "bun:test";
import { parseExternalHtml } from "./external";

const config = await Bun.file(new URL("./corpus-config.json", import.meta.url)).json();

test("corpus manifest keeps Codex session data disabled", () => {
  expect(config.sessionData.enabled).toBe(false);
  expect(
    config.sources.find((source: { id: string }) => source.id === "official-sandkit-docs").enabled,
  ).toBe(true);
});

test("official HTML extraction keeps anchors, signatures, and examples", () => {
  const chunks = parseExternalHtml(
    '<h2 id="api-heading">API</h2><details><summary>api.world</summary><div class="api-signature"><code>getCell(x, y)</code></div><pre><code>api.world.getCell(1, 2);</code></pre></details>',
    "https://sandustry.com/sandkit.html",
  );
  expect(chunks.map((chunk) => chunk.type)).toEqual([
    "documentation-section",
    "api-signature",
    "code-example",
  ]);
  expect(chunks[1].anchor).toBe("api-heading");
  expect(chunks[2].content).toContain("api.world.getCell(1, 2);");
  expect(chunks[2].content).toContain("https://sandustry.com/sandkit.html#api-heading");
});

test("corpus manifest includes the Sandustry research sources", () => {
  const sourceIds = config.sources.map((source: { id: string }) => source.id);
  expect(sourceIds).toContain("sandkit-surface-map");
  expect(sourceIds).toContain("sandustry-api-reference-material");
  expect(sourceIds).toContain("local-sandustry-types");
  expect(sourceIds).toContain("project-docs");
  expect(config.globalExclude).toContain("**/node_modules/**");
  expect(config.globalExclude).toContain("**/*.save");
});
