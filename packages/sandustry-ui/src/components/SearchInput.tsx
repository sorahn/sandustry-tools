import type { InputHTMLAttributes } from "react";
import cx from "clsx";
import type { ControlSize } from "../types";

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  size?: ControlSize;
};

export function SearchInput({ size = "default", className = "", ...props }: SearchInputProps) {
  return (
    <input
      {...props}
      type="search"
      className={cx(
        "w-full rounded border border-slate-700 bg-black/60 text-white placeholder:text-slate-600 transition-colors focus:border-slate-500 focus:outline-none",
        size === "small" && "h-[var(--sd-form-control-small-height)] px-2.5 text-[11px]",
        size === "default" && "h-[var(--sd-form-control-height)] px-3 text-xs",
        size === "large" && "h-[var(--sd-form-control-large-height)] px-3.5 text-sm",
        className,
      )}
    />
  );
}
