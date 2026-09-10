import type { ButtonHTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import type { ControlSize } from "../types";
import "../elements/icon-button";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: ControlSize;
  children: ReactNode;
};

export function IconButton({
  label,
  size = "default",
  className = "",
  children,
  ...props
}: IconButtonProps) {
  return (
    <sandustry-icon-button
      {...props}
      type="button"
      label={label}
      size={size}
      aria-label={label}
      title={props.title ?? label}
      class={cx(
        "inline-flex shrink-0 items-center justify-center rounded text-[var(--sd-color-text-muted,#94a3b8)] transition-colors hover:text-[var(--sd-color-text,#ffffff)] focus-visible:outline-2 focus-visible:outline-[var(--sd-color-primary,#ffe700)] focus-visible:outline-offset-2",
        size === "small" && "h-6 w-6 text-xs",
        size === "default" && "h-8 w-8 text-sm",
        size === "large" && "h-10 w-10 text-lg",
        props.disabled &&
          "cursor-not-allowed opacity-40 hover:text-[var(--sd-color-text-muted,#94a3b8)]",
        className,
      )}
    >
      {children}
    </sandustry-icon-button>
  );
}
