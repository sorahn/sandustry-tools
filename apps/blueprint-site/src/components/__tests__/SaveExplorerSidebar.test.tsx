import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  decodeBrowserSave,
  extractSavedBlueprints,
  normalizeSaveDocument,
  toSaveExplorerClientDocument,
} from "@sandustry/save-core";
import { SaveExplorerSidebar } from "../SaveExplorerSidebar";

const fixture = (name: string) =>
  Bun.file(
    new URL(
      `../../../../../packages/sandustry-save-core/tests/visual/saves/${name}`,
      import.meta.url,
    ),
  );

function renderSidebar(document: ReturnType<typeof toSaveExplorerClientDocument>) {
  return renderToStaticMarkup(
    <SaveExplorerSidebar
      document={document}
      busy={false}
      message="Save decoded"
      layers={{
        terrain: true,
        settledElements: true,
        elements: true,
        particles: true,
        walls: true,
        structures: true,
        fog: true,
        authorization: false,
      }}
      customCursor={false}
      onLayerChange={() => {}}
      onCustomCursorChange={() => {}}
      onInspectBlueprint={() => {}}
      onCopyBlueprint={() => {}}
    />,
  );
}

test("shows an explicit empty blueprint state for the zero-blueprint save", async () => {
  const save = await decodeBrowserSave(await fixture("new-world.save").bytes());
  const document = normalizeSaveDocument(save);
  const extracted = extractSavedBlueprints(save.payload);
  const html = renderSidebar(toSaveExplorerClientDocument(document, extracted.summaries));

  expect(extracted.summaries).toEqual([]);
  expect(html).toContain("No valid saved blueprints were found.");
  expect(html).toContain("Blueprints");
});

test("shows inspect and copy actions for an extracted blueprint summary", async () => {
  const save = await decodeBrowserSave(await fixture("main-save.save").bytes());
  const document = normalizeSaveDocument(save);
  const extracted = extractSavedBlueprints(save.payload);
  const html = renderSidebar(toSaveExplorerClientDocument(document, extracted.summaries));

  expect(html).toContain("Sand Washer, Shaker, And Burner - Tileable");
  expect(html).toContain("Inspect");
  expect(html).toContain("Copy string");
});

test("renders world telemetry including level, playtime, and currencies", async () => {
  const save = await decodeBrowserSave(await fixture("main-save.save").bytes());
  const document = normalizeSaveDocument(save);
  const extracted = extractSavedBlueprints(save.payload);
  const html = renderSidebar(toSaveExplorerClientDocument(document, extracted.summaries));

  expect(html).toContain("Lv.7");
  expect(html).toContain("16h 53m");
  expect(html).toContain("19,858");
  expect(html).toMatch(/296\.0[kK]/); // productionPoints
  expect(html).toContain("102,370"); // gold / credits
  expect(html).toContain("1,177"); // fluxite
});
