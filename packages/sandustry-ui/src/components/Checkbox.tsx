import type { InputHTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import type { ControlSize } from "../types";
import "../elements/checkbox";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> & {
  boxed?: boolean;
  label?: ReactNode;
  size?: ControlSize;
};

export function Checkbox({
  boxed = false,
  className = "",
  label,
  size = "default",
  ...props
}: CheckboxProps) {
  return (
    <sandustry-checkbox
      boxed={boxed ? "" : undefined}
      size={size}
      class={cx(
        "inline-flex cursor-pointer items-center gap-1.5 font-mono text-[var(--sd-color-text,#ffffff)]",
        size === "small" && "min-h-6 gap-1 text-[10px]",
        size === "default" && "text-[11px]",
        size === "large" && "min-h-8 gap-2 text-xs",
        boxed &&
          "gap-2.5 rounded-[var(--sd-radius)_0_var(--sd-radius)_0] border border-[var(--sd-color-border,#334155)] bg-[var(--sd-color-surface-muted,#070a0f)] px-2.5 py-1",
        className,
      )}
    >
      <label className="contents cursor-pointer">
        {label ? <span slot="label">{label}</span> : null}
        <input
          {...props}
          type="checkbox"
          className={cx(
            "cursor-pointer accent-[var(--sd-color-primary,#ffe700)]",
            size === "small" && "h-3 w-3",
            size === "default" && "h-3.5 w-3.5",
            size === "large" && "h-4 w-4",
          )}
        />
      </label>
    </sandustry-checkbox>
  );
}
