import { useId } from "react";
import type { BlueprintType, RenderAsset } from "@daryl.roberts/sandustry-blueprint-core";
import type { CatalogRenderAsset } from "../utils/catalog";

export function shapeOutlinePath(
  shape: number[][],
  originX: number,
  originY: number,
  cellSize: number,
) {
  let path = "";
  const rows = shape.length;
  const cols = shape[0]?.length ?? 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((shape[r]?.[c] ?? 0) <= 0) continue;
      const x = originX + c * cellSize;
      const y = originY + r * cellSize;
      if (r === 0 || (shape[r - 1]?.[c] ?? 0) <= 0) {
        path += `M ${x} ${y} L ${x + cellSize} ${y} `;
      }
      if (r === rows - 1 || (shape[r + 1]?.[c] ?? 0) <= 0) {
        path += `M ${x} ${y + cellSize} L ${x + cellSize} ${y + cellSize} `;
      }
      if (c === 0 || (shape[r]?.[c - 1] ?? 0) <= 0) {
        path += `M ${x} ${y} L ${x} ${y + cellSize} `;
      }
      if (c === cols - 1 || (shape[r]?.[c + 1] ?? 0) <= 0) {
        path += `M ${x + cellSize} ${y} L ${x + cellSize} ${y + cellSize} `;
      }
    }
  }
  return path;
}

export type StructureThumbnailProps = {
  asset?: RenderAsset | CatalogRenderAsset;
  frameIndex?: number;
  rotation?: number;
  lightColor?: string | null;
  footprint: { width: number; height: number };
  name: string;
  structureType?: BlueprintType;
  customShape?: number[][];
  outlineShape?: number[][];
  className?: string;
};

export function StructureThumbnail({
  asset,
  frameIndex = 0,
  rotation = 0,
  lightColor,
  footprint,
  name,
  structureType,
  customShape,
  outlineShape,
  className = "",
}: StructureThumbnailProps) {
  const rawId = useId();
  const gridId = `thumb-grid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const containerClasses = `relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-700/80 shadow-md ${className}`;

  const renderGridBackground = (
    originX: number,
    originY: number,
    cellSize: number,
    blockSize: number,
  ) => (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 64 64">
      <defs>
        <pattern
          id={`${gridId}-cell`}
          x={originX}
          y={originY}
          width={cellSize}
          height={cellSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${cellSize} 0 L 0 0 0 ${cellSize} M ${cellSize} 0 L ${cellSize} ${cellSize} M 0 ${cellSize} L ${cellSize} ${cellSize}`}
            fill="none"
            stroke="#718096"
            strokeWidth="1"
          />
        </pattern>
        <pattern
          id={`${gridId}-block`}
          x={originX}
          y={originY}
          width={blockSize}
          height={blockSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${blockSize} 0 L 0 0 0 ${blockSize} M ${blockSize} 0 L ${blockSize} ${blockSize} M 0 ${blockSize} L ${blockSize} ${blockSize}`}
            fill="none"
            stroke="#17202c"
            strokeWidth="1.25"
          />
        </pattern>
      </defs>
      <rect width="64" height="64" fill="#33a8ff" />
      <g opacity="0.25">
        <rect width="64" height="64" fill={`url(#${gridId}-cell)`} />
        <rect width="64" height="64" fill={`url(#${gridId}-block)`} />
      </g>
    </svg>
  );

  const isCustomShape = Boolean(
    customShape && customShape.some((row) => row.some((val) => val > 0)),
  );

  if (isCustomShape && customShape) {
    const shapeRows = customShape.length;
    const shapeCols = customShape[0]?.length ?? 4;
    const cellSize = 8;
    const renderedWidth = shapeCols * cellSize;
    const renderedHeight = shapeRows * cellSize;
    const originX = Math.round((64 - renderedWidth) / 2);
    const originY = Math.round((64 - renderedHeight) / 2);
    const blockSize = 32;

    const outlinePath = shapeOutlinePath(customShape, originX, originY, cellSize);

    const transform = rotation ? `rotate(${rotation} 32 32)` : undefined;

    return (
      <div className={containerClasses} style={{ backgroundColor: "#33a8ff" }}>
        {renderGridBackground(originX, originY, cellSize, blockSize)}
        <svg
          className="relative z-10 shrink-0 overflow-hidden"
          viewBox="0 0 64 64"
          style={{ width: "64px", height: "64px", imageRendering: "pixelated" }}
          aria-label={name}
        >
          <defs>
            <mask
              id={`${gridId}-prefab-mask`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="64"
              height="64"
            >
              <rect width="64" height="64" fill="black" />
              {customShape.map((row, r) =>
                row.map((val, c) =>
                  val > 0 ? (
                    <rect
                      key={`mask-${r}-${c}`}
                      x={originX + c * cellSize}
                      y={originY + r * cellSize}
                      width={cellSize}
                      height={cellSize}
                      fill="white"
                    />
                  ) : null,
                ),
              )}
            </mask>
          </defs>
          <g transform={transform}>
            {customShape.map((row, r) =>
              row.map((val, c) =>
                val > 0 ? (
                  <rect
                    key={`bg-${r}-${c}`}
                    x={originX + c * cellSize}
                    y={originY + r * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill="#434c5e"
                  />
                ) : null,
              ),
            )}
            <image
              href={`${import.meta.env.BASE_URL}catalog/img__block.png`}
              x={originX}
              y={originY}
              width={renderedWidth}
              height={renderedHeight}
              preserveAspectRatio="none"
              mask={`url(#${gridId}-prefab-mask)`}
              style={{ imageRendering: "pixelated" }}
            />
            {outlinePath ? (
              <path
                d={outlinePath}
                stroke="#17202c"
                strokeWidth="2"
                strokeLinecap="square"
                strokeLinejoin="miter"
                fill="none"
              />
            ) : null}
          </g>
        </svg>
      </div>
    );
  }

  if (!asset?.path) {
    const renderedWidth = footprint.width * 8;
    const renderedHeight = footprint.height * 8;
    const originX = Math.round((64 - Math.min(renderedWidth, 48)) / 2);
    const originY = Math.round((64 - Math.min(renderedHeight, 48)) / 2);
    return (
      <div className={containerClasses} style={{ backgroundColor: "#33a8ff" }}>
        {renderGridBackground(originX, originY, 8, 32)}
        <span className="relative z-10 rounded bg-slate-950/60 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-100 shadow-sm">
          {footprint.width}×{footprint.height}
        </span>
      </div>
    );
  }

  // Kinetic Press (type 20) uses a massive 18x417 pressing tower in the world,
  // but the game's build menu clips it square to the 18x18 press head.
  const isKineticPress = structureType === 20 || (asset.sourceCrop?.height ?? 0) > 48;

  const sourceWidth = asset.sourceSize?.width ?? asset.frame?.width ?? 16;
  const sourceHeight = asset.sourceSize?.height ?? asset.frame?.height ?? 16;
  const frameWidth = isKineticPress
    ? 18
    : (asset.frame?.width ?? asset.renderSize?.width ?? sourceWidth);
  const frameHeight = isKineticPress
    ? 18
    : (asset.frame?.height ?? asset.renderSize?.height ?? sourceHeight);

  const cropX = isKineticPress ? 0 : (asset.sourceCrop?.x ?? 0);
  const cropY = isKineticPress ? 0 : (asset.sourceCrop?.y ?? 0);
  const cropWidth = isKineticPress ? 18 : (asset.sourceCrop?.width ?? frameWidth);
  const cropHeight = isKineticPress ? 18 : (asset.sourceCrop?.height ?? frameHeight);

  // Compute rotated bounding box so non-square sprites (e.g. 23x16 pyros, 18x26 launchers)
  // are not clipped when rotated by 90° or 270°.
  const normRot = ((rotation % 360) + 360) % 360;
  const isRightAngle = normRot === 90 || normRot === 270;
  const bboxWidth = isRightAngle
    ? cropHeight
    : normRot === 0 || normRot === 180
      ? cropWidth
      : Math.round(
          Math.abs(cropWidth * Math.cos((normRot * Math.PI) / 180)) +
            Math.abs(cropHeight * Math.sin((normRot * Math.PI) / 180)),
        );
  const bboxHeight = isRightAngle
    ? cropWidth
    : normRot === 0 || normRot === 180
      ? cropHeight
      : Math.round(
          Math.abs(cropWidth * Math.sin((normRot * Math.PI) / 180)) +
            Math.abs(cropHeight * Math.cos((normRot * Math.PI) / 180)),
        );

  const boxOffsetX = (bboxWidth - cropWidth) / 2;
  const boxOffsetY = (bboxHeight - cropHeight) / 2;

  const imageX = boxOffsetX - frameIndex * frameWidth - cropX;
  const imageY = boxOffsetY - cropY;

  const href = `${import.meta.env.BASE_URL}${asset.path}`;
  const cx = bboxWidth / 2;
  const cy = bboxHeight / 2;
  const transform = rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined;
  const maxDim = Math.max(bboxWidth, bboxHeight);
  const scale = maxDim <= 28 ? 2 : Math.min(56 / bboxWidth, 56 / bboxHeight);
  const renderedWidth = bboxWidth * scale;
  const renderedHeight = bboxHeight * scale;
  const fpPxWidth = (footprint?.width || 4) * 4;
  const fpPxHeight = (footprint?.height || 4) * 4;
  const originX = Math.round((64 - fpPxWidth * scale) / 2);
  const originY = Math.round((64 - fpPxHeight * scale) / 2);
  const cellSize = 4 * scale;
  const blockSize = cellSize * 4;

  return (
    <div className={containerClasses} style={{ backgroundColor: "#33a8ff" }}>
      {renderGridBackground(originX, originY, cellSize, blockSize)}
      <svg
        viewBox={`0 0 ${bboxWidth} ${bboxHeight}`}
        className="relative z-10 shrink-0 overflow-hidden"
        style={{
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          imageRendering: "pixelated",
        }}
        aria-label={name}
      >
        <image
          href={href}
          x={imageX}
          y={imageY}
          width={sourceWidth}
          height={sourceHeight}
          transform={transform}
          preserveAspectRatio="none"
          style={{ imageRendering: "pixelated" }}
        />
        {lightColor ? (
          <g transform={transform}>
            {[4, 7, 10].map((bar) => (
              <rect
                key={bar}
                x={boxOffsetX + cropWidth * (bar / 16)}
                y={boxOffsetY + cropHeight * 0.25}
                width={cropWidth * (2 / 16)}
                height={cropHeight * 0.5}
                fill={lightColor}
              />
            ))}
          </g>
        ) : null}
      </svg>
      {outlineShape ? (
        <svg
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
          viewBox="0 0 64 64"
          aria-hidden="true"
        >
          <path
            d={shapeOutlinePath(outlineShape, originX, originY, cellSize)}
            stroke="#17202c"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
            fill="none"
          />
        </svg>
      ) : null}
    </div>
  );
}
