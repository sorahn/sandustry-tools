import type { HTMLAttributes } from "react";
import cx from "clsx";
import type { ProgressBarTone } from "../elements/progress-bar";
import "../elements/progress-bar";
export type { ProgressBarTone };

export type ProgressBarProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  value: number;
  max?: number;
  tone?: ProgressBarTone;
  label?: string;
};

export function ProgressBar({
  value,
  max = 100,
  tone = "accent",
  label,
  className = "",
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <sandustry-progress-bar
      {...props}
      value={value}
      max={max}
      tone={tone}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      class={cx("relative block h-2 overflow-hidden rounded-full bg-gray-800", className)}
    >
      <div
        className={cx(
          "h-full rounded-full transition-all duration-300",
          tone === "accent" && "bg-[var(--sd-color-primary,#ffe700)]",
          tone === "success" && "bg-emerald-400",
          tone === "info" && "bg-cyan-300",
          tone === "warning" && "bg-amber-300",
          tone === "danger" && "bg-red-400",
        )}
        style={{ width: `${percentage}%` }}
      />
    </sandustry-progress-bar>
  );
}
