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
        size === "small" && "py-1 px-2.5 text-[11px]",
        size === "default" && "px-3 py-1.5 text-xs",
        size === "large" && "px-3.5 py-2 text-sm",
        className,
      )}
    />
  );
}
