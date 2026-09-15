import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "bun:test";
import { blueprintCatalog, decodeBlueprint, renderBlueprintToSvg, type Blueprint } from "..";
import {
  PIPE_STRUCTURE_TYPE,
  connectedPipeStructureIndices,
  pipeSpriteIndexFor,
  pipeNetworkDirections,
  prepareBlueprint,
  preparePipeTopology,
} from "../prepare";

describe("pipe topology preparation", () => {
  test("classifies masks and preserves the fixed native grid anchor", () => {
    const blueprint: Blueprint = {
      name: "masks",
      signalLinks: null,
      data: [
        { type: PIPE_STRUCTURE_TYPE, x: 0, y: 0, data: { pipeConnectionMask: 0 } },
        { type: PIPE_STRUCTURE_TYPE, x: 4, y: 0, data: { pipeConnectionMask: 1 } },
        { type: PIPE_STRUCTURE_TYPE, x: 8, y: 0, data: { pipeConnectionMask: 5 } },
        { type: PIPE_STRUCTURE_TYPE, x: 12, y: 0, data: { pipeConnectionMask: 3 } },
        {
          type: PIPE_STRUCTURE_TYPE,
          x: 16,
          y: 0,
          data: {
            pipeConnectionMask: 5,
            pipeBridgeConnectionMask: 8,
            pipeBridgeAxis: "horizontal",
          },
        },
      ],
    };
    const prepared = prepareBlueprint(blueprint);
    assert.deepEqual(
      prepared.preparedStructures.map((structure) => structure.pipeTopology?.kind),
      ["isolated", "endpoint", "straight", "corner", "bridge"],
    );
    assert.deepEqual(prepared.preparedStructures[4].pipeTopology, {
      kind: "bridge",
      connectionMask: 5,
      spriteIndex: 17,
      bridgeConnectionMask: 8,
      bridgeAxis: "horizontal",
      connectedDirections: ["north", "south"],
      bridgeDirections: ["west"],
      source: "serialized",
      gridAnchor: { x: 16, y: 0 },
      gridBulb: "suppressed",
    });
  });

  test("infers a missing mask from neighboring pipe anchors", () => {
    const blueprint: Blueprint = {
      name: "inferred",
      signalLinks: null,
      data: [
        { type: PIPE_STRUCTURE_TYPE, x: 0, y: 0 },
        { type: PIPE_STRUCTURE_TYPE, x: 4, y: 0, data: { pipeConnectionMask: 10 } },
      ],
    };
    const topology = prepareBlueprint(blueprint).preparedStructures[0].pipeTopology;
    assert.equal(topology?.source, "inferred");
    assert.equal(topology?.connectionMask, 2);
    assert.deepEqual(topology?.connectedDirections, ["east"]);
  });

  test("audits the updated pipeworks visual fixture", () => {
    const encoded = readFileSync(
      new URL("../../tests/visual/blueprints/pipeworks.txt", import.meta.url),
      "utf8",
    ).trim();
    const prepared = prepareBlueprint(decodeBlueprint(encoded));
    const pipes = prepared.preparedStructures.filter((structure) => structure.pipeTopology);
    const masks = new Set(pipes.map((structure) => structure.pipeTopology!.connectionMask));
    assert.equal(pipes.length, 172);
    assert.deepEqual(
      [...masks].sort((a, b) => a - b),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15],
    );
    assert.deepEqual(
      [
        ...new Set(pipes.map((structure) => structure.pipeTopology!.bridgeAxis).filter(Boolean)),
      ].sort(),
      ["horizontal", "vertical"],
    );
    assert.equal(prepared.pipeDiagnostics.length, 0);
  });

  test("reports malformed serialized pipe fields without throwing", () => {
    const diagnostics: Parameters<typeof preparePipeTopology>[3] = [];
    const topology = preparePipeTopology(
      {
        type: PIPE_STRUCTURE_TYPE,
        x: 0,
        y: 0,
        data: {
          pipeConnectionMask: 99,
          pipeBridgeConnectionMask: "bad",
          pipeBridgeAxis: "diagonal",
        },
      },
      7,
      new Set(),
      diagnostics,
    );
    assert.equal(topology?.connectionMask, 0);
    assert.equal(topology?.bridgeConnectionMask, 0);
    assert.equal(diagnostics.length, 3);
    assert.deepEqual(
      diagnostics.map((diagnostic) => diagnostic.field),
      ["pipeConnectionMask", "pipeBridgeConnectionMask", "pipeBridgeAxis"],
    );
  });

  test("uses the native mask order and fixed-grid alternate frames", () => {
    assert.equal(pipeSpriteIndexFor(0, 0, 0), 0);
    assert.equal(pipeSpriteIndexFor(10, 0, 0), 3);
    assert.equal(pipeSpriteIndexFor(5, 0, 0), 17);
    assert.equal(pipeSpriteIndexFor(5, 0, 4), 12);
    assert.equal(pipeSpriteIndexFor(10, 4, 0), 16);
    assert.equal(pipeSpriteIndexFor(3, 0, 0), 9);
  });

  test("connects normal pipe routes without joining bridge overpasses", () => {
    const prepared = prepareBlueprint({
      name: "network",
      signalLinks: null,
      data: [
        { type: PIPE_STRUCTURE_TYPE, x: 0, y: 0, data: { pipeConnectionMask: 2 } },
        { type: PIPE_STRUCTURE_TYPE, x: 4, y: 0, data: { pipeConnectionMask: 8 } },
        {
          type: PIPE_STRUCTURE_TYPE,
          x: 4,
          y: 4,
          data: {
            pipeConnectionMask: 2,
            pipeBridgeConnectionMask: 1,
            pipeBridgeAxis: "horizontal",
          },
        },
        { type: PIPE_STRUCTURE_TYPE, x: 8, y: 4, data: { pipeConnectionMask: 8 } },
      ],
    });
    assert.deepEqual(connectedPipeStructureIndices(prepared, 0), [0, 1]);
    assert.deepEqual(connectedPipeStructureIndices(prepared, 2), [2, 3]);
  });

  test("uses an axis-only bridge's axis for network membership", () => {
    const encoded = readFileSync(
      new URL("../../tests/visual/blueprints/pipeworks.txt", import.meta.url),
      "utf8",
    ).trim();
    const prepared = prepareBlueprint(decodeBlueprint(encoded));
    const bridge = prepared.preparedStructures[110].pipeTopology!;
    assert.deepEqual(pipeNetworkDirections(bridge), ["east", "west"]);
    const network = connectedPipeStructureIndices(prepared, 110);
    assert.ok(network.includes(114));
    assert.ok(network.includes(118));
    assert.ok(!network.includes(109));
    assert.ok(!network.includes(112));
  });

  test("renders the native pipe sheet and bridge asset", () => {
    const encoded = readFileSync(
      new URL("../../tests/visual/blueprints/pipeworks.txt", import.meta.url),
      "utf8",
    ).trim();
    const svg = renderBlueprintToSvg(decodeBlueprint(encoded), {
      catalog: blueprintCatalog(),
      assetBaseUrl: "",
      showGrid: false,
    }).svg;
    assert.match(svg, /href="catalog\/pipes\.png"/);
    assert.match(svg, /href="catalog\/pipe_bridge\.png"/);
    assert.ok(svg.indexOf('data-layer="pipes"') < svg.indexOf('data-layer="pipe-bridges"'));
    assert.ok(
      svg.indexOf('data-layer="pipe-bridges"') < svg.indexOf('data-layer="foundation-outline"'),
    );
    assert.ok(
      svg.indexOf('data-layer="foundation-outline"') <
        svg.indexOf('data-layer="foundation-structures"'),
    );
    assert.ok(
      svg.indexOf('data-layer="foundation-structures"') < svg.indexOf('data-layer="structures"'),
    );
  });

  test("renders one alpha-derived outline layer for a selected pipe network", () => {
    const svg = renderBlueprintToSvg(
      {
        name: "highlight",
        signalLinks: null,
        data: [
          { type: PIPE_STRUCTURE_TYPE, x: 0, y: 0, data: { pipeConnectionMask: 2 } },
          { type: PIPE_STRUCTURE_TYPE, x: 4, y: 0, data: { pipeConnectionMask: 8 } },
        ],
      },
      { catalog: blueprintCatalog(), pipeNetworkHighlightIndices: [0, 1], showGrid: false },
    ).svg;
    assert.match(svg, /data-layer="pipe-network-highlight"/);
    assert.match(svg, /feMorphology/);
    assert.match(svg, /flood-color="#facc15"/);
    const highlight = svg.slice(svg.indexOf('data-layer="pipe-network-highlight"'));
    assert.match(highlight, /data-pipe-highlight-frame=/);
    assert.doesNotMatch(highlight, /pipe-highlight-clip|catalog\/pipes\.png/);
  });

  test("highlights a bridge without outlining its underlying pipe sprite", () => {
    const svg = renderBlueprintToSvg(
      {
        name: "bridge highlight",
        signalLinks: null,
        data: [
          {
            type: PIPE_STRUCTURE_TYPE,
            x: 0,
            y: 0,
            data: { pipeConnectionMask: 5, pipeBridgeAxis: "horizontal" },
          },
        ],
      },
      { catalog: blueprintCatalog(), pipeNetworkHighlightIndices: [0], showGrid: false },
    ).svg;
    const highlight = svg.slice(svg.indexOf('data-layer="pipe-network-highlight"'));
    assert.doesNotMatch(highlight, /catalog\/pipes\.png/);
    assert.match(highlight, /catalog\/pipe_bridge\.png/);
  });

  test("keeps masked pipe segments that are not rendered as overpasses", () => {
    const svg = renderBlueprintToSvg(
      {
        name: "masked pipe segment",
        signalLinks: null,
        data: [
          {
            type: PIPE_STRUCTURE_TYPE,
            x: 0,
            y: 0,
            data: { pipeConnectionMask: 8, pipeBridgeConnectionMask: 2 },
          },
        ],
      },
      { catalog: blueprintCatalog(), pipeNetworkHighlightIndices: [0], showGrid: false },
    ).svg;
    const highlight = svg.slice(svg.indexOf('data-layer="pipe-network-highlight"'));
    assert.match(highlight, /data-pipe-highlight-frame=/);
    assert.doesNotMatch(highlight, /pipe-highlight-clip|catalog\/pipes\.png/);
    assert.doesNotMatch(highlight, /catalog\/pipe_bridge\.png/);
  });

  test("renders cell outlines for attached non-pipe structures", () => {
    const svg = renderBlueprintToSvg(
      {
        name: "attached endpoint",
        signalLinks: null,
        data: [
          { type: PIPE_STRUCTURE_TYPE, x: 0, y: 0, data: { pipeConnectionMask: 0 } },
          { type: 24, x: 0, y: 0 },
        ],
      },
      {
        catalog: blueprintCatalog(),
        pipeNetworkHighlightIndices: [0],
        pipeNetworkHighlightCellIndices: [1],
        showGrid: false,
      },
    ).svg;
    assert.match(svg, /data-layer="pipe-network-highlight"/);
    assert.match(svg, /data-structure-index="1"[^>]*fill="#ffffff"/);
  });

  test("renders a pipe-specific fallback for malformed topology", () => {
    const svg = renderBlueprintToSvg(
      {
        name: "malformed pipe",
        signalLinks: null,
        data: [
          {
            type: PIPE_STRUCTURE_TYPE,
            x: 0,
            y: 0,
            data: { pipeConnectionMask: 99 },
          },
        ],
      },
      { catalog: blueprintCatalog(), showGrid: false },
    ).svg;
    assert.match(svg, /data-pipe-fallback="segment"/);
    assert.doesNotMatch(svg, /data-pipe-fallback="bridge"/);
  });

  test("renders a pipe-specific fallback when the pipe asset is missing", () => {
    const baseCatalog = blueprintCatalog();
    const catalog = {
      get(type: Parameters<typeof baseCatalog.get>[0]) {
        const entry = baseCatalog.get(type);
        return type === PIPE_STRUCTURE_TYPE && entry ? { ...entry, renderAsset: undefined } : entry;
      },
    };
    const svg = renderBlueprintToSvg(
      {
        name: "missing pipe asset",
        signalLinks: null,
        data: [{ type: PIPE_STRUCTURE_TYPE, x: 0, y: 0, data: { pipeConnectionMask: 0 } }],
      },
      { catalog, showGrid: false },
    ).svg;
    assert.match(svg, /data-pipe-fallback="segment"/);
  });
});
