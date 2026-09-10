import type { InputHTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import type { ControlSize } from "../types";
import "../elements/switch";

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  label?: ReactNode;
  size?: ControlSize;
};

export function Switch({ label, size = "default", className = "", ...props }: SwitchProps) {
  return (
    <sandustry-switch
      size={size}
      class={cx(
        "inline-flex cursor-pointer items-center gap-2 text-[var(--sd-color-text,#ffffff)]",
        size === "small" && "text-[11px]",
        size === "default" && "text-xs",
        size === "large" && "text-sm",
        className,
      )}
    >
      <label className="contents cursor-pointer">
        <input {...props} type="checkbox" className="peer sr-only" />
        <span
          aria-hidden="true"
          className={cx(
            "relative inline-flex shrink-0 items-center rounded-full bg-[var(--sd-color-surface-muted,#070a0f)] ring-1 ring-inset ring-[var(--sd-color-border,#334155)] transition-colors duration-200 peer-checked:bg-[var(--sd-color-primary,#ffe700)] peer-checked:ring-[var(--sd-color-primary,#ffe700)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--sd-color-primary,#ffe700)]",
            size === "small" &&
              "h-4 w-7 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-[var(--sd-color-text-subtle,#8295ab)] after:transition-all after:duration-200 peer-checked:after:translate-x-[12px] peer-checked:after:bg-[var(--sd-color-primary-foreground,#141414)]",
            size === "default" &&
              "h-[22px] w-10 after:absolute after:left-[3px] after:top-[3px] after:h-4 after:w-4 after:rounded-full after:bg-[var(--sd-color-text-subtle,#8295ab)] after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-[18px] peer-checked:after:bg-[var(--sd-color-primary-foreground,#141414)]",
            size === "large" &&
              "h-7 w-12 after:absolute after:left-[3px] after:top-[3px] after:h-5.5 after:w-5.5 after:rounded-full after:bg-[var(--sd-color-text-subtle,#8295ab)] after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-[20px] peer-checked:after:bg-[var(--sd-color-primary-foreground,#141414)]",
          )}
        />
        {label ? <span slot="label">{label}</span> : null}
      </label>
    </sandustry-switch>
  );
}
