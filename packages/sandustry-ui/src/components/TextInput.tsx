import type { InputHTMLAttributes } from "react";
import cx from "clsx";
import type { ControlSize } from "../types";

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  tone?: "default" | "accent";
  monospace?: boolean;
  size?: ControlSize;
};

export function TextInput({
  tone = "default",
  monospace = false,
  size = "default",
  className = "",
  ...props
}: TextInputProps) {
  return (
    <input
      {...props}
      type="text"
      className={cx(
        "min-w-0 flex-1 rounded-sm border border-slate-600 bg-black/60 tracking-wide text-white outline-none transition-colors focus:border-[#ffe700]",
        size === "small" && "h-[var(--sd-form-control-small-height)] px-2 text-xs",
        size === "default" && "h-[var(--sd-form-control-height)] px-3 text-sm",
        size === "large" && "h-[var(--sd-form-control-large-height)] px-4 text-base",
        tone === "accent" && "text-[#f5a623]",
        monospace && "font-mono",
        className,
      )}
    />
  );
}
