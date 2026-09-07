import type { InputHTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import type { ControlSize } from "../types";

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  label?: ReactNode;
  size?: ControlSize;
};

export function Switch({ label, size = "default", className = "", ...props }: SwitchProps) {
  return (
    <label
      className={cx(
        "inline-flex cursor-pointer items-center gap-2 text-slate-300",
        size === "small" && "text-[11px]",
        size === "default" && "text-xs",
        size === "large" && "text-sm",
        className,
      )}
    >
      <input {...props} type="checkbox" className="peer sr-only" />
      <span
        aria-hidden="true"
        className={cx(
          "relative inline-flex shrink-0 items-center rounded-full bg-black ring-1 ring-inset ring-slate-700 transition-colors duration-200 peer-checked:bg-[#ffe700] peer-checked:ring-[#ffe700] peer-focus-visible:ring-2 peer-focus-visible:ring-[#ffe700]",
          size === "small" &&
            "h-4 w-7 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-slate-500 after:transition-all after:duration-200 peer-checked:after:translate-x-[12px] peer-checked:after:bg-black",
          size === "default" &&
            "h-[22px] w-10 after:absolute after:left-[3px] after:top-[3px] after:h-4 after:w-4 after:rounded-full after:bg-slate-500 after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-[18px] peer-checked:after:bg-black",
          size === "large" &&
            "h-7 w-12 after:absolute after:left-[3px] after:top-[3px] after:h-5.5 after:w-5.5 after:rounded-full after:bg-slate-500 after:shadow-sm after:transition-all after:duration-200 peer-checked:after:translate-x-[20px] peer-checked:after:bg-black",
        )}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
