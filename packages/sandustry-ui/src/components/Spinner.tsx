import type { HTMLAttributes } from "react";
import cx from "clsx";
import type { ControlSize } from "../types";
import "../elements/spinner";

export type { SpinnerTone } from "../elements/spinner";
import type { SpinnerTone } from "../elements/spinner";

export type SpinnerProps = HTMLAttributes<HTMLElement> & {
  size?: ControlSize;
  tone?: SpinnerTone;
  label?: string;
};

const sizeClasses: Record<ControlSize, string> = {
  small: "h-3.5 w-3.5 border-2",
  default: "h-5 w-5 border-2",
  large: "h-8 w-8 border-[3px]",
};

const toneClasses: Record<SpinnerTone, string> = {
  accent: "border-yellow-400 border-t-transparent",
  yellow: "border-yellow-400 border-t-transparent",
  neutral: "border-slate-400 border-t-transparent",
  white: "border-white border-t-transparent",
};

export function Spinner({
  size = "default",
  tone = "accent",
  label = "Loading…",
  className = "",
  ...props
}: SpinnerProps) {
  return (
    <sandustry-spinner
      role="status"
      aria-label={label}
      size={size}
      tone={tone}
      label={label}
      {...props}
      class={cx(
        "inline-block shrink-0 animate-spin rounded-full motion-reduce:animate-none",
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
    />
  );
}
