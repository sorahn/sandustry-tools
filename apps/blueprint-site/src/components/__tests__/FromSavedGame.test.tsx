import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { FromSavedGame } from "../../pages/Inspector";
import { formatSaveOptgroupLabel, getSaveTag } from "../../utils/save-db";
import { BLUEPRINT_VISUAL_FIXTURES } from "../../visual-fixtures/catalog";

test("renders Test Fixtures optgroup at top of FromSavedGame in DEV mode", () => {
  (import.meta.env as Record<string, unknown>).DEV = true;
  const html = renderToStaticMarkup(<FromSavedGame />);
  expect(html).toContain('label="Test Fixtures"');

  // Verify placeholder is first, then Test Fixtures is at the top
  const selectIndex = html.indexOf("<select");
  const placeholderIndex = html.indexOf("Choose a test fixture…", selectIndex);
  const testFixturesIndex = html.indexOf('label="Test Fixtures"', selectIndex);
  expect(selectIndex).toBeGreaterThanOrEqual(0);
  expect(placeholderIndex).toBeGreaterThan(selectIndex);
  expect(testFixturesIndex).toBeGreaterThan(placeholderIndex);

  // All 16 visual fixtures from core are present
  expect(BLUEPRINT_VISUAL_FIXTURES.length).toBe(16);
  for (const fixture of BLUEPRINT_VISUAL_FIXTURES) {
    expect(html).toContain(`value="fixture:${fixture.id}"`);
    expect(html).toContain(fixture.label);
  }
});

test("formats save optgroup labels as <World Name> [Save Name]", () => {
  expect(
    formatSaveOptgroupLabel({
      worldName: "Alpha Base",
      saveName: "Manual 1",
      fileName: "slot1.save",
    }),
  ).toBe("Alpha Base [Manual 1]");

  expect(
    formatSaveOptgroupLabel({
      worldName: "Beta World",
      fileName: "beta_autosave.save",
    }),
  ).toBe("Beta World [Autosave]");

  expect(
    formatSaveOptgroupLabel({
      fileName: "quicksave.save",
    }),
  ).toBe("quicksave.save [Quicksave]");
});

test("getSaveTag resolves tags accurately", () => {
  expect(getSaveTag("world.save", "autosave_1")).toBe("Autosave");
  expect(getSaveTag("world.save", "exit_save")).toBe("Exit save");
  expect(getSaveTag("world.save", "quicksave")).toBe("Quicksave");
  expect(getSaveTag("world_auto.save")).toBe("Autosave");
  expect(getSaveTag("world.save")).toBe("Save");
});
