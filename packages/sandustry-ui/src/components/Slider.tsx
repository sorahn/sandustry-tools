import type { InputHTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import styles from "../styles/slider.module.css";

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  label?: ReactNode;
  showValue?: boolean;
  valueFormat?: (value: number) => ReactNode;
};

export function Slider({
  label,
  showValue = false,
  valueFormat,
  className = "",
  value,
  min = 0,
  max = 100,
  ...props
}: SliderProps) {
  const numericValue = typeof value === "number" ? value : Number(value ?? min);
  const formattedValue = valueFormat ? valueFormat(numericValue) : `${numericValue}`;

  return (
    <div className={cx("flex w-full flex-col gap-1.5", className)}>
      {label || showValue ? (
        <div className="flex items-center justify-between text-xs text-slate-300">
          {label ? <span>{label}</span> : <span />}
          {showValue ? (
            <span className="font-mono text-[11px] tabular-nums text-slate-400">
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
        className={cx(styles.slider)}
        {...props}
      />
    </div>
  );
}
