import type { HTMLAttributes, PropsWithChildren } from "react";
import cx from "clsx";
import "../elements/badge";

export type { BadgeTone, BadgeShape } from "../elements/badge";
import type { BadgeTone, BadgeShape } from "../elements/badge";

export type BadgeProps = PropsWithChildren<HTMLAttributes<HTMLElement>> & {
  tone?: BadgeTone;
  shape?: BadgeShape;
};

export function Badge({
  tone = "default",
  shape = "cut",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <sandustry-badge
      {...props}
      tone={tone}
      shape={shape}
      class={cx(
        "inline-flex items-center border bg-[var(--sd-color-surface-muted,#070a0f)] px-2 py-0.5 text-xs",
        shape === "cut" ? "rounded-tr-lg rounded-bl-lg" : "rounded",
        {
          "border-[var(--sd-color-border,#334155)] text-[var(--sd-color-text,#ffffff)]":
            tone === "default",
          "border-[var(--sd-color-primary,#ffe700)]/50 bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.1))] text-[var(--sd-color-primary,#ffe700)]":
            tone === "accent",
          "border-[var(--sd-color-success,#34d399)]/50 text-[var(--sd-color-success,#34d399)]":
            tone === "success",
          "border-[var(--sd-color-warning,#ffa500)]/50 text-[var(--sd-color-warning,#ffa500)]":
            tone === "warning",
          "border-[var(--sd-color-danger,#ff3300)]/50 text-[var(--sd-color-danger,#ff3300)]":
            tone === "danger",
          "border-[var(--sd-color-info,#38bdf8)]/50 text-[var(--sd-color-info,#38bdf8)]":
            tone === "info",
          "border-[var(--sd-color-border-subtle,#1e293b)] bg-[var(--sd-color-surface-muted,#070a0f)] text-[var(--sd-color-text-subtle,#8295ab)]":
            tone === "neutral",
          "border-[var(--sd-badge-amber-border,rgba(146,64,14,0.4))] bg-[var(--sd-badge-amber-bg,rgba(69,26,3,0.6))] text-[var(--sd-badge-amber-text,#fcd34d)]":
            tone === "amber",
          "border-[var(--sd-badge-blue-border,rgba(30,58,138,0.4))] bg-[var(--sd-badge-blue-bg,rgba(23,37,84,0.6))] text-[var(--sd-badge-blue-text,#93c5fd)]":
            tone === "blue",
          "border-[var(--sd-badge-purple-border,rgba(88,28,135,0.4))] bg-[var(--sd-badge-purple-bg,rgba(59,7,100,0.6))] text-[var(--sd-badge-purple-text,#d8b4fe)]":
            tone === "purple",
        },
        className,
      )}
    >
      {children}
    </sandustry-badge>
  );
}
