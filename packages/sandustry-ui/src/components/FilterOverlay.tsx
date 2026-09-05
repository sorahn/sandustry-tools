import type { ButtonHTMLAttributes, ReactNode } from "react";
import cx from "clsx";

export type FilterOverlayDirection = "up" | "down" | "left" | "right";
export type FilterOverlayTone = "pass" | "block";

export type FilterOverlayItem = {
  label: ReactNode;
  swatchColor?: string;
};

export type FilterOverlayEndpoint = {
  items: FilterOverlayItem[];
  direction: FilterOverlayDirection;
  directionTone?: FilterOverlayTone;
};

export type FilterOverlayProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  from: FilterOverlayEndpoint;
  to: FilterOverlayEndpoint;
  status?: FilterOverlayTone;
};

const arrowPaths: Record<FilterOverlayDirection, string> = {
  up: "M10 16.25a.75.75 0 0 1-.75-.75V4.862L5.29 9.02a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04L10.75 4.862V15.5a.75.75 0 0 1-.75.75Z",
  down: "M10 3.75a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V4.5a.75.75 0 0 1 .75-.75Z",
  left: "M16.25 10a.75.75 0 0 1-.75.75H4.862l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L4.862 9.25H15.5a.75.75 0 0 1 .75.75Z",
  right:
    "M3.75 10a.75.75 0 0 1 .75-.75h10.638L10.98 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H4.5a.75.75 0 0 1-.75-.75Z",
};

function FilterOverlayArrow({
  direction,
  directionTone: tone = "pass",
}: Pick<FilterOverlayEndpoint, "direction" | "directionTone">) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cx("h-4 w-4 shrink-0", tone === "pass" ? "text-[#00ff47]" : "text-red-500")}
    >
      <path fillRule="evenodd" d={arrowPaths[direction]} clipRule="evenodd" />
    </svg>
  );
}

function FilterOverlayEndpointView({ items, direction, directionTone }: FilterOverlayEndpoint) {
  return (
    <span className="inline-flex items-center gap-[3px]">
      <span className="inline-flex items-center gap-[3px]">
        {items.map((item, index) => (
          <span key={index} className="inline-flex items-center gap-[3px]">
            {index > 0 ? <span>,</span> : null}
            {item.swatchColor ? (
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 border border-white/30"
                style={{ backgroundColor: item.swatchColor }}
              />
            ) : null}
            <span>{item.label}</span>
          </span>
        ))}
      </span>
      <FilterOverlayArrow direction={direction} directionTone={directionTone} />
    </span>
  );
}

export function FilterOverlay({
  from,
  to,
  status = "pass",
  className = "",
  ...props
}: FilterOverlayProps) {
  return (
    <button
      {...props}
      type="button"
      className={cx(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap border bg-black/[.85] px-[5px] py-0.5 text-[10px] text-white",
        status === "pass" ? "border-[#00ff47]" : "border-red-500",
        className,
      )}
    >
      <FilterOverlayEndpointView {...from} />
      <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-white/20" />
      <FilterOverlayEndpointView {...to} />
    </button>
  );
}
