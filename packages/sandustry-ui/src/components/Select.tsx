import type { PropsWithChildren, SelectHTMLAttributes } from "react";
import cx from "clsx";
import type { ControlSize } from "../types";
import "../elements/select";

export type SelectProps = PropsWithChildren<
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
    size?: ControlSize;
    compact?: boolean;
  }
>;

export function Select({ size, compact = false, className = "", children, ...props }: SelectProps) {
  const effectiveSize: ControlSize = size ?? (compact ? "small" : "default");

  return (
    <sandustry-select scale={effectiveSize} class="sd-select-caret inline-block">
      <select
        className={cx(
          "appearance-none rounded-[var(--sd-radius)_0_var(--sd-radius)_0] border border-[var(--sd-color-border,#2a323d)] bg-[var(--sd-color-surface-elevated,#181c20)]/90 font-mono text-[var(--sd-color-text,#e8eef5)] focus:border-[var(--sd-color-primary,#ffe700)] focus:outline-2 focus:outline-[var(--sd-color-primary,#ffe700)] focus:outline-offset-2",
          effectiveSize === "small" &&
            "h-[var(--sd-form-control-small-height)] py-1 px-2 pr-5 text-xs",
          effectiveSize === "default" &&
            "h-[var(--sd-form-control-height)] px-2.5 py-1.5 pr-5 text-[11px] leading-normal",
          effectiveSize === "large" &&
            "h-[var(--sd-form-control-large-height)] px-3 py-2 pr-6 text-xs leading-normal",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </sandustry-select>
  );
}
