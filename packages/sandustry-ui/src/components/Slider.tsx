import type { InputHTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import type { ControlSize } from "../types";
import "../elements/slider";

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  label?: ReactNode;
  showValue?: boolean;
  valueFormat?: (value: number) => ReactNode;
  size?: ControlSize;
};

export function Slider({
  label,
  showValue = false,
  valueFormat,
  size = "default",
  className = "",
  value,
  min = 0,
  max = 100,
  ...props
}: SliderProps) {
  const numericValue = typeof value === "number" ? value : Number(value ?? min);
  const formattedValue = valueFormat ? valueFormat(numericValue) : `${numericValue}`;

  return (
    <sandustry-slider
      size={size}
      showValue={showValue}
      class={cx(
        "flex w-full flex-col",
        size === "small" && "gap-1",
        size === "default" && "gap-1.5",
        size === "large" && "gap-2",
        className,
      )}
    >
      {label || showValue ? (
        <div
          slot="header"
          className={cx(
            "flex items-center justify-between text-[var(--sd-color-text,#ffffff)]",
            size === "small" && "text-[11px]",
            size === "default" && "text-xs",
            size === "large" && "text-sm",
          )}
        >
          {label ? <span>{label}</span> : <span />}
          {showValue ? (
            <span
              className={cx(
                "font-mono tabular-nums text-[var(--sd-color-text-muted,#94a3b8)]",
                size === "small" && "text-[10px]",
                size === "default" && "text-[11px]",
                size === "large" && "text-xs",
              )}
            >
              {formattedValue}
            </span>
          ) : null}
        </div>
      ) : null}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        data-size={size}
        className="sd-slider"
        {...props}
      />
    </sandustry-slider>
  );
}
