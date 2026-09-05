import assert from "node:assert/strict";
import { test } from "node:test";
import { setupGame } from "../../../packages/sandustry-mod-template/modkit/test/setup-game.ts";

declare const sandkit: { api: Record<string, unknown> };

const game = await setupGame();

test("Labelmaker registers its item and grants it to the player", async () => {
  const state = await game.evaluate(() => {
    const api = sandkit.api as any;
    const definition = api.items.getDefinitionById("sorahnLabelmaker");
    const inventory = sandkit.engine.state.store.player.inventory ?? [];
    return {
      registered: Boolean(definition),
      hasAction: typeof definition?.handleAction === "function",
      inInventory: inventory.some((item: { id?: string }) => item.id === "sorahnLabelmaker"),
    };
  });

  assert.deepEqual(state, { registered: true, hasAction: true, inInventory: true });
});

test("Labelmaker creates a colored localized prefab cursor without render errors", async () => {
  await game.evaluate(() => {
    const errors: string[] = [];
    window.addEventListener("error", (event) => {
      const message = event.error?.message ?? event.message;
      if (message) errors.push(String(message));
    });
    (
      window as typeof window & { __labelmakerIntegrationErrors?: string[] }
    ).__labelmakerIntegrationErrors = errors;
  });

  await game.evaluate(() => {
    const definition = (sandkit.api as any).items.getDefinitionById("sorahnLabelmaker");
    if (typeof definition?.handleAction !== "function") {
      throw new Error("Labelmaker item action is unavailable");
    }
    definition.handleAction({ session: { action: { state: { 1: true } } } });
  });

  await game.waitFor(
    () => Boolean(document.querySelector("#sorahn-labelmaker-prompt-input")),
    (open) => open,
    { message: "Labelmaker prompt did not open" },
  );

  await game.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>("#sorahn-labelmaker-prompt-input");
    if (!input) throw new Error("Labelmaker prompt input was not found");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "A");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    const color = document.querySelector<HTMLInputElement>('input[type="color"]');
    if (!color) throw new Error("Labelmaker color input was not found");
    setter?.call(color, "#ff0000");
    color.dispatchEvent(new Event("input", { bubbles: true }));
    color.dispatchEvent(new Event("change", { bubbles: true }));

    const confirm = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent?.trim() === "Confirm",
    );
    if (!confirm) throw new Error("Labelmaker confirm button was not found");
    confirm.click();
  });

  await game.waitFor(
    () => (sandkit.engine.state.store.player.action as { id?: string | number } | null)?.id ?? null,
    (id) => String(id) === "7",
    { message: "Labelmaker did not activate the Copier cursor" },
  );

  const cursor = await game.evaluate(() => {
    const action = sandkit.engine.state.session.action as {
      customData?: {
        __labelmakerCursor?: boolean;
        selectedStructures?: Array<{
          type?: string | number;
          color?: string;
          data?: { __prefabulatorBlueprint?: { definition?: unknown } };
        }>;
      } | null;
    } | null;
    const selected = action?.customData?.selectedStructures ?? [];
    return {
      marker: action?.customData?.__labelmakerCursor ?? false,
      count: selected.length,
      colors: [...new Set(selected.map((structure) => structure.color))],
      types: [...new Set(selected.map((structure) => String(structure.type)))],
      definitions: selected.filter(
        (structure) => structure.data?.__prefabulatorBlueprint?.definition,
      ).length,
      errors: (window as typeof window & { __labelmakerIntegrationErrors?: string[] })
        .__labelmakerIntegrationErrors,
    };
  });

  assert.equal(cursor.marker, true);
  assert.ok(cursor.count > 0, "Labelmaker generated no prefab blocks");
  assert.deepEqual(cursor.colors, ["#ff0000"]);
  assert.ok(cursor.types.every((type) => type.startsWith("prefabTerrain_")));
  assert.equal(cursor.definitions, cursor.count);
  assert.deepEqual(cursor.errors, []);
});
