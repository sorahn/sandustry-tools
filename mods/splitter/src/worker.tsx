"use strict";

const SPLITTER_ID = "sandustrySplitter";

type ExitSide = "left" | "right";
const nextSideByPosition = new Map<string, ExitSide>();
// Packed offsets are row * 4 + column, searched bottom-to-top and outward from
// the splitter so the left and right sides are mirror images.
const EXIT_SEARCH_OFFSETS: Record<ExitSide, readonly number[]> = {
  left: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  right: [12, 13, 14, 15, 8, 9, 10, 11, 4, 5, 6, 7, 0, 1, 2, 3],
};

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
    const preferred: ExitSide =
      preference === "right"
        ? "right"
        : preference === "left"
          ? "left"
          : (nextSideByPosition.get(key) ??
            (splitter.data?.nextSide === "right" ? "right" : "left"));
    const candidates: ExitSide[] = preferred === "left" ? ["left", "right"] : ["right", "left"];
    for (const side of candidates) {
      const baseX = splitter.x + (side === "left" ? -4 : 4);
      for (const packedOffset of EXIT_SEARCH_OFFSETS[side]) {
        const targetX = baseX + (packedOffset & 3);
        const targetY = splitter.y + (packedOffset >> 2);
        if (!workerApi.world.isCellEmpty(state, targetX, targetY)) continue;

        workerApi.elements.move(state, source.x, source.y, targetX, targetY);
        if (preference === "even") nextSideByPosition.set(key, side === "left" ? "right" : "left");
        control.cancel();
        return true;
      }
    }

    workerApi.elements.markMovementBlocked(state, movement.elementIndex);
    workerApi.world.reportActivityToChunk(state, source.x, source.y);
    control.cancel();
    return true;
  };
} catch (error) {
  console.error("[sorahn.sandustry-splitter] worker hook registration failed", error);
}
