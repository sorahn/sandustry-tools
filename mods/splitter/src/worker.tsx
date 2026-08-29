"use strict";

const SPLITTER_ID = "sandustrySplitter";

type Side = "left" | "right";
const nextSideByPosition = new Map<string, Side>();

try {
  const runtimeGlobal = globalThis as any;
  runtimeGlobal.__sandustrySplitterElementMove = (
    state: any,
    movement: any,
    control: { cancel: () => void },
  ): boolean => {
    const workerApi = state.sandkit.getApi();
    const destination = movement?.destination;
    const source = movement?.source;
    if (!destination || !source) return false;
    if (!workerApi.structures.isTypeAt(state, destination.x, destination.y, SPLITTER_ID))
      return false;

    const splitter = workerApi.structures.getAtCell(state, destination.x, destination.y);
    if (!splitter) return true;

    const key = `${splitter.x},${splitter.y}`;
    const preference = splitter.data?.preference ?? "even";
    const preferred: Side =
      preference === "right"
        ? "right"
        : preference === "left"
          ? "left"
          : (nextSideByPosition.get(key) ??
            (splitter.data?.nextSide === "right" ? "right" : "left"));
    const candidates: Side[] = preferred === "left" ? ["left", "right"] : ["right", "left"];

    for (const side of candidates) {
      const localX = destination.x - splitter.x;
      const localY = destination.y - splitter.y;
      const targetX = splitter.x + (side === "left" ? -4 : 4) + localX;
      const targetY = splitter.y + localY;
      if (!workerApi.world.isCellEmpty(state, targetX, targetY)) continue;

      workerApi.elements.move(state, source.x, source.y, targetX, targetY);
      if (preference === "even") nextSideByPosition.set(key, side === "left" ? "right" : "left");
      control.cancel();
      return true;
    }

    workerApi.elements.markMovementBlocked(state, movement.elementIndex);
    workerApi.world.reportActivityToChunk(state, source.x, source.y);
    control.cancel();
    return true;
  };
} catch (error) {
  console.error("[sorahn.sandustry-splitter] worker hook registration failed", error);
}
