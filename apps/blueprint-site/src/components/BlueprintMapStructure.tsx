import { memo } from "react";
import { structureLabel, type BlueprintRenderModel } from "@daryl.roberts/sandustry-blueprint-core";

type BlueprintMapStructureProps = {
  item: BlueprintRenderModel["renderStructures"][number];
  preparedBlueprint: BlueprintRenderModel["preparedBlueprint"];
  minX: number;
  minY: number;
  padding: number;
  cell: number;
  suppressClickRef: { current: boolean };
  onSelect: (index: number) => void;
};

/**
 * The core renderer owns all visible structure markup. This component is only
 * the site's interactive hitbox layer, so selection does not require a second
 * sprite renderer to stay in sync with core.
 */
export const BlueprintMapStructure = memo(function BlueprintMapStructure({
  item,
  preparedBlueprint,
  minX,
  minY,
  padding,
  cell,
  suppressClickRef,
  onSelect,
}: BlueprintMapStructureProps) {
  const { structure, index } = item;
  const prepared = preparedBlueprint.preparedStructures[index];
  const left = (structure.x - minX + padding) * cell;
  const top = (prepared.topY - minY + padding) * cell;
  const width = prepared.footprint.width * cell;
  const height = prepared.footprint.height * cell;

  return (
    <g
      key={`${index}-${structure.x}-${structure.y}`}
      role="button"
      tabIndex={0}
      aria-label={`Select ${structureLabel(structure.type)} at ${structure.x}, ${structure.y}`}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        onSelect(index);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect(index);
      }}
      className="blueprint-map__structure cursor-pointer"
    >
      <rect x={left} y={top} width={width} height={height} fill="transparent" stroke="none" />
    </g>
  );
}, areBlueprintMapStructurePropsEqual);

function areBlueprintMapStructurePropsEqual(
  previous: BlueprintMapStructureProps,
  next: BlueprintMapStructureProps,
) {
  return (
    previous.item.index === next.item.index &&
    previous.preparedBlueprint === next.preparedBlueprint &&
    previous.minX === next.minX &&
    previous.minY === next.minY &&
    previous.padding === next.padding &&
    previous.cell === next.cell &&
    previous.suppressClickRef === next.suppressClickRef &&
    previous.onSelect === next.onSelect
  );
}
