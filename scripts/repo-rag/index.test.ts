import { test, expect } from "bun:test";

const config = await Bun.file(new URL("./corpus-config.json", import.meta.url)).json();

test("corpus manifest keeps Codex session data disabled", () => {
  expect(config.sessionData.enabled).toBe(false);
  expect(
    config.sources.find((source: { id: string }) => source.id === "official-sandkit-docs").enabled,
  ).toBe(true);
});

test("corpus manifest includes the Sandustry research sources", () => {
  const sourceIds = config.sources.map((source: { id: string }) => source.id);
  expect(sourceIds).toContain("sandkit-surface-map");
  expect(sourceIds).toContain("sandustry-api-reference-material");
  expect(sourceIds).toContain("project-docs");
  expect(config.globalExclude).toContain("**/node_modules/**");
  expect(config.globalExclude).toContain("**/*.save");
});
