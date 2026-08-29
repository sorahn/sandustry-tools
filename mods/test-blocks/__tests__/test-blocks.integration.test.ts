import assert from "node:assert/strict";
import test from "node:test";
import { setupGame } from "../../../resources/SandustryModTemplate/modkit/test/setup-game.ts";

declare const sandkit: { api: Record<string, unknown> };

const game = await setupGame();

test("extracted game boots with Sandkit available", async () => {
  const hasApi = await game.evaluate(() => Boolean(sandkit?.api));
  assert.equal(hasApi, true);
});

test("Test Blocks is loaded as an external mod", async () => {
  const modIds = await game.orderedModIds();
  assert.ok(modIds.includes("sorahn.sandustry-test-blocks"));
});
