import {
  foundationOutlinePath,
  NATIVE_PIXELS_PER_CELL,
  renderPixelScale,
  underlyingCellCoordinates,
} from "@sorahn/sandustry-blueprint-core";
import { memo } from "react";
import { type BlueprintMapModel, mapLayerStyle } from "../utils/blueprint-map";

type PreparedBlueprint = BlueprintMapModel["preparedBlueprint"];

export const BlueprintMapRawStructuresLayer = memo(function BlueprintMapRawStructuresLayer({
  preparedBlueprint,
  visible,
  minX,
  minY,
  padding,
  cell,
}: {
  preparedBlueprint: PreparedBlueprint;
  visible: boolean;
  minX: number;
  minY: number;
  padding: number;
  cell: number;
}) {
  if (!visible) return null;
  return (
    <g opacity="0.9" pointerEvents="none" style={mapLayerStyle("debugCells")}>
      {underlyingCellCoordinates(preparedBlueprint.preparedStructures).map(({ x, y }, index) => (
        <rect
          key={`raw-structure-${x}-${y}-${index}`}
          x={(x - minX + padding) * cell}
          y={(y - minY + padding) * cell}
          width={cell}
          height={cell}
          fill="#ff0000"
          stroke="#000000"
          strokeWidth="1"
        />
      ))}
    </g>
  );
});

export const BlueprintMapGridLayer = memo(function BlueprintMapGridLayer({
  width,
  height,
  gridOriginX,
  gridOriginY,
  cell,
  showGrid,
}: {
  width: number;
  height: number;
  gridOriginX: number;
  gridOriginY: number;
  cell: number;
  showGrid: boolean;
}) {
  return (
    <>
      <defs>
        <pattern
          id="blueprint-block-grid"
          x={gridOriginX}
          y={gridOriginY}
          width={cell}
          height={cell}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${cell} 0 L 0 0 0 ${cell} M ${cell} 0 L ${cell} ${cell} M 0 ${cell} L ${cell} ${cell}`}
            fill="none"
            stroke="#718096"
            strokeWidth="1"
          />
        </pattern>
        <pattern
          id="blueprint-cell-grid"
          x={gridOriginX}
          y={gridOriginY}
          width={cell * NATIVE_PIXELS_PER_CELL}
          height={cell * NATIVE_PIXELS_PER_CELL}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${cell * NATIVE_PIXELS_PER_CELL} 0 L 0 0 0 ${cell * NATIVE_PIXELS_PER_CELL} M ${cell * NATIVE_PIXELS_PER_CELL} 0 L ${cell * NATIVE_PIXELS_PER_CELL} ${cell * NATIVE_PIXELS_PER_CELL} M 0 ${cell * NATIVE_PIXELS_PER_CELL} L ${cell * NATIVE_PIXELS_PER_CELL} ${cell * NATIVE_PIXELS_PER_CELL}`}
            fill="none"
            stroke="#17202c"
            strokeWidth="1.25"
          />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="#33a8ff" style={mapLayerStyle("background")} />
      {showGrid ? (
        <g opacity="0.25" style={mapLayerStyle("grid")}>
          <rect width={width} height={height} fill="url(#blueprint-block-grid)" />
          <rect width={width} height={height} fill="url(#blueprint-cell-grid)" />
        </g>
      ) : null}
    </>
  );
});

export const BlueprintMapEdgeFadeLayer = memo(function BlueprintMapEdgeFadeLayer({
  width,
  height,
  cell,
}: {
  width: number;
  height: number;
  cell: number;
}) {
  const fadeSize = cell * 6;
  const fadeBleed = 1;
  const gradients = [
    {
      id: "blueprint-map-opacity-left",
      x1: 0,
      x2: fadeSize,
      y1: 0,
      y2: 0,
      rect: { x: -fadeBleed, y: 0, width: fadeSize + fadeBleed, height },
    },
    {
      id: "blueprint-map-opacity-right",
      x1: width,
      x2: width - fadeSize,
      y1: 0,
      y2: 0,
      rect: { x: width - fadeSize, y: 0, width: fadeSize + fadeBleed, height },
    },
    {
      id: "blueprint-map-opacity-top",
      x1: 0,
      x2: 0,
      y1: 0,
      y2: fadeSize,
      rect: { x: 0, y: -fadeBleed, width, height: fadeSize + fadeBleed },
    },
    {
      id: "blueprint-map-opacity-bottom",
      x1: 0,
      x2: 0,
      y1: height,
      y2: height - fadeSize,
      rect: { x: 0, y: height - fadeSize, width, height: fadeSize + fadeBleed },
    },
  ];
  return (
    <g pointerEvents="none" style={mapLayerStyle("background")}>
      <defs>
        {gradients.map((gradient) => (
          <linearGradient
            key={gradient.id}
            id={gradient.id}
            gradientUnits="userSpaceOnUse"
            x1={gradient.x1}
            x2={gradient.x2}
            y1={gradient.y1}
            y2={gradient.y2}
          >
            <stop offset="0%" stopColor="#33a8ff" />
            <stop offset="16.6667%" stopColor="#33a8ff" />
            <stop offset="83.3333%" stopColor="#33a8ff" stopOpacity="0" />
            <stop offset="100%" stopColor="#33a8ff" stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {gradients.map((gradient) => (
        <rect key={gradient.id} {...gradient.rect} fill={`url(#${gradient.id})`} />
      ))}
    </g>
  );
});

export const BlueprintMapSignalLinksLayer = memo(function BlueprintMapSignalLinksLayer({
  preparedBlueprint,
  visible,
  point,
}: {
  preparedBlueprint: PreparedBlueprint;
  visible: boolean;
  point: (x: number, y: number) => { x: number; y: number };
}) {
  if (!visible) return null;
  return preparedBlueprint.preparedSignalLinks.map((link, index) => {
    const wire = link.path;
    const from = point(wire.from.x, wire.from.y);
    const to = point(wire.to.x, wire.to.y);
    const d =
      wire.kind === "line"
        ? `M ${from.x} ${from.y} L ${to.x} ${to.y}`
        : (() => {
            const control1 = point(wire.control1.x, wire.control1.y);
            const control2 = point(wire.control2.x, wire.control2.y);
            return `M ${from.x} ${from.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${to.x} ${to.y}`;
          })();
    return (
      <path
        key={`link-${index}`}
        d={d}
        stroke={link.on ? "#00ff99" : "#ff3333"}
        fill="none"
        strokeLinecap="round"
        strokeWidth="3"
        opacity=".7"
        style={mapLayerStyle("signalLinks")}
      />
    );
  });
});

export const BlueprintMapFoundationOutlineLayer = memo(function BlueprintMapFoundationOutlineLayer({
  preparedBlueprint,
  visible,
  minX,
  minY,
  padding,
  cell,
}: {
  preparedBlueprint: PreparedBlueprint;
  visible: boolean;
  minX: number;
  minY: number;
  padding: number;
  cell: number;
}) {
  if (!visible) return null;
  const path = foundationOutlinePath(
    preparedBlueprint.preparedStructures,
    minX,
    minY,
    padding,
    cell,
  );
  return path ? (
    <path
      d={path}
      fill="none"
      stroke="#000000"
      strokeWidth={renderPixelScale(cell)}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      pointerEvents="none"
      style={mapLayerStyle("foundationShapes")}
    />
  ) : null;
});
