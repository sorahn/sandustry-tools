import type { HTMLAttributes, SVGProps } from "react";
import cx from "clsx";
import "../elements/tier-pips";

export function EnergyRequirementIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="#ffd700"
      stroke="black"
      strokeWidth="1.5"
      paintOrder="stroke"
      aria-label="Requires Energy"
      role="img"
      className={cx("w-[18px] h-[18px] sd-drop-shadow pointer-events-none select-none", className)}
      {...props}
    >
      <title>Requires Energy</title>
      <path
        fillRule="evenodd"
        d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export type TierPipsProps = HTMLAttributes<HTMLDivElement> & {
  current: number;
  max?: number;
};

export function TierPips({ current, max = 5, className = "", ...props }: TierPipsProps) {
  const clampedCurrent = Math.max(0, Math.min(current, max));
  const pips = Array.from({ length: max }, (_, i) => i < clampedCurrent);

  return (
    <sandustry-tier-pips
      role="progressbar"
      aria-valuenow={clampedCurrent}
      aria-valuemin={0}
      aria-valuemax={max}
      current={current}
      max={max}
      class={cx(
        "flex items-center bg-black/75 px-1.5 py-0.5 rounded-full border border-slate-800 relative overflow-hidden",
        className,
      )}
      {...props}
    >
      {pips.map((active, idx) => (
        <span
          key={idx}
          className={cx(
            "w-1.5 h-1.5 rounded-full mx-[1px] transition-colors",
            active ? "bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)]" : "bg-gray-700",
          )}
        />
      ))}
    </sandustry-tier-pips>
  );
}
