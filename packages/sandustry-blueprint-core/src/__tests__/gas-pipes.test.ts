import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "bun:test";
import {
  blueprintCatalog,
  decodeBlueprint,
  encodeBlueprint,
  prepareBlueprint,
  renderBlueprintToSvg,
  selectedPipeNetwork,
} from "../index";
import native from "../../tests/fixtures/native-0.6.json";

test("gas topology and frame selection agree with native 0.6 snapshots", () => {
  const blueprint = { name: "native gas", data: native.gas, signalLinks: null };
  const prepared = prepareBlueprint(blueprint, { catalog: blueprintCatalog() });
  for (const [index, record] of native.gas.entries()) {
    assert.equal(
      prepared.preparedStructures[index].pipeTopology?.connectionMask,
      record.data.pipeConnectionMask,
    );
    assert.equal(
      prepared.preparedStructures[index].sprite?.frameIndex,
      record.data.pipeSpriteIndex,
    );
  }
  const network = selectedPipeNetwork(prepared, 0);
  assert.equal(network?.structureIndices.length, 7);
  const bridge = selectedPipeNetwork(
    prepared,
    native.gas.findIndex((s) => s.data.pipeBridgeAxis),
  );
  assert.equal(bridge?.structureIndices.length, 3);
  const svg = renderBlueprintToSvg(blueprint, { catalog: blueprintCatalog() }).svg;
  assert.match(svg, /catalog\/mods__gas_pipes.png/);
  assert.match(svg, /catalog\/mods__gas_pipe_bridge.png/);
  assert.doesNotMatch(svg, /href="catalog\/pipe_bridge.png"/);
});

test("gas and liquid bridge frames follow the same native rule", () => {
  const gasBridge = native.gas.filter((record) => record.x >= 640);
  const frames = (data: typeof gasBridge | typeof native.liquidBridge) => {
    const prepared = prepareBlueprint({ name: "bridge parity", signalLinks: null, data });
    return prepared.preparedStructures.map((structure, index) => {
      assert.equal(structure.pipeTopology?.spriteIndex, data[index].data.pipeSpriteIndex);
      return structure.pipeTopology?.spriteIndex;
    });
  };
  assert.deepEqual(frames(gasBridge), frames(native.liquidBridge));
});

test("gas and liquid masks, networks and attachments remain separate at shared anchors", () => {
  const prepared = prepareBlueprint({
    name: "separate fluids",
    signalLinks: null,
    data: [
      { type: "gasPipe", x: 0, y: 0 },
      { type: "gasPipe", x: 4, y: 0 },
      { type: 23, x: 0, y: 0 },
      { type: 23, x: 0, y: 4 },
      { type: "gasPump", x: 0, y: 0 },
      { type: "gasVent", x: 4, y: 0 },
      { type: 24, x: 0, y: 0 },
      { type: 25, x: 0, y: 4 },
    ],
  });
  assert.equal(prepared.preparedStructures[0].pipeTopology?.connectionMask, 2);
  assert.equal(prepared.preparedStructures[2].pipeTopology?.connectionMask, 4);
  const gas = selectedPipeNetwork(prepared, 4);
  const liquid = selectedPipeNetwork(prepared, 6);
  assert.deepEqual(gas?.structureIndices.sort(), [0, 1]);
  assert.deepEqual(gas?.pumpIndices, [4]);
  assert.deepEqual(gas?.ventIndices, [5]);
  assert.deepEqual(liquid?.structureIndices.sort(), [2, 3]);
  assert.deepEqual(liquid?.pumpIndices, [6]);
  assert.deepEqual(liquid?.ventIndices, [7]);
});

test("native building records preserve their state through the codec and resolve sprite assets", () => {
  const blueprint = { name: "native new buildings", data: native.samples, signalLinks: null };
  assert.deepEqual(decodeBlueprint(encodeBlueprint(blueprint)).data, blueprint.data);
  const catalog = blueprintCatalog();
  for (const record of native.samples) {
    assert.ok(catalog.get(record.type)?.renderAsset?.path, `Unknown native ${record.type}`);
  }
});

test("SandustryVault Silicon Mixer v2 preserves portal links and chamber groups and renders all 153 structures", () => {
  // User-provided public example: https://sandustryvault.com/sandprints/251
  const blueprint = decodeBlueprint(
    readFileSync(new URL("../../tests/fixtures/vault-251.txt", import.meta.url), "utf8").trim(),
  );
  assert.equal(blueprint.data.length, 153);
  assert.deepEqual(decodeBlueprint(encodeBlueprint(blueprint)), blueprint);
  const catalog = blueprintCatalog();
  for (const record of blueprint.data) {
    assert.ok(
      catalog.get(record.type)?.renderAsset?.path,
      `Unknown mixer structure ${record.type}`,
    );
  }
  const svg = renderBlueprintToSvg(blueprint, { catalog }).svg;
  for (const file of [
    "balancer",
    "quantum_portal_mk2",
    "quantum_portal_mk2_exit",
    "reduction_chamber_wall",
  ]) {
    assert.ok(svg.includes(`mods__${file}.png`), `Missing mixer sprite ${file}`);
  }
});
