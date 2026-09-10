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
        "inline-flex items-center border bg-black px-2 py-0.5 text-xs",
        shape === "cut" ? "rounded-tr-lg rounded-bl-lg" : "rounded",
        {
          "border-slate-200/25 text-white": tone === "default",
          "border-[var(--sd-color-primary,#ffe700)]/50 bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.1))] text-[var(--sd-color-primary,#ffe700)]":
            tone === "accent",
          "border-emerald-400/50 text-emerald-400": tone === "success",
          "border-amber-300/50 text-amber-200": tone === "warning",
          "border-red-400/50 text-red-300": tone === "danger",
          "border-cyan-300/50 text-cyan-300": tone === "info",
          "border-slate-800 bg-slate-900 text-slate-400": tone === "neutral",
          "border-amber-800/40 bg-amber-950/60 text-amber-300": tone === "amber",
          "border-blue-800/40 bg-blue-950/60 text-blue-300": tone === "blue",
          "border-purple-800/40 bg-purple-950/60 text-purple-300": tone === "purple",
        },
        className,
      )}
    >
      {children}
    </sandustry-badge>
  );
}
