const GLOBAL_LAYER_OPTIONS = {
  pipes: { showPipeModeOverlay: true },
};

export function parseVisualFixtureFilename(filename) {
  const match = filename.match(/^(.+?)(?:\[([a-z][a-z0-9-]*(?:,[a-z][a-z0-9-]*)*)\])?\.txt$/);
  if (!match) throw new Error(`Invalid visual fixture filename: ${filename}`);

  const name = match[1];
  const layers = match[2]?.split(",") ?? [];
  const unknownLayers = layers.filter((layer) => !GLOBAL_LAYER_OPTIONS[layer]);
  if (unknownLayers.length) {
    throw new Error(
      `Unknown visual fixture layer${unknownLayers.length === 1 ? "" : "s"}: ${unknownLayers.join(", ")}`,
    );
  }

  return {
    filename,
    name,
    id: layers.length ? `${name}[${layers.join(",")}]` : name,
    outputName: layers.length ? `${name}-${layers.join("-")}` : name,
    layers,
    renderOptions: Object.assign({}, ...layers.map((layer) => GLOBAL_LAYER_OPTIONS[layer])),
  };
}
