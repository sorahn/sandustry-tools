import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import "../elements/status-indicator";

export type StatusIndicatorTone = "neutral" | "online" | "warning" | "danger";

export type StatusIndicatorProps = PropsWithChildren<HTMLAttributes<HTMLElement>> & {
  label?: ReactNode;
  value?: ReactNode;
  tone?: StatusIndicatorTone;
};

export function StatusIndicator({
  label,
  value,
  tone = "neutral",
  className = "",
  children,
  ...props
}: StatusIndicatorProps) {
  return (
    <sandustry-status-indicator
      {...props}
      tone={tone}
      class={cx(
        "inline-flex items-center gap-1.5 text-xs text-[var(--sd-color-text-muted,#94a3b8)]",
        className,
      )}
    >
      <span
        slot="indicator"
        aria-hidden="true"
        className={cx("h-1.5 w-1.5 rounded-full border", {
          "border-[var(--sd-color-border-strong,#475569)] bg-[var(--sd-color-text-subtle,#8295ab)]":
            tone === "neutral",
          "border-green-600 bg-green-500": tone === "online",
          "border-amber-500 bg-amber-400": tone === "warning",
          "border-red-600 bg-red-500": tone === "danger",
        })}
      />
      {label}
      {value !== undefined ? <span className="tabular-nums">{value}</span> : null}
      {children}
    </sandustry-status-indicator>
  );
}
