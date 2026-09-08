import type { ComponentPropsWithoutRef, ElementType, PropsWithChildren } from "react";
import cx from "clsx";
import type { ControlSize } from "../types";

export const buttonStyles = {
  button:
    "sd-btn-effects relative left-0 inline-flex min-h-9 items-center justify-center overflow-hidden rounded-[0_var(--sd-button-radius)_0_var(--sd-button-radius)] border px-3.5 py-2 text-xs font-medium transition-[border-color,left] duration-1000 ease-in-out",
  effects: "sd-btn-effects",
  default: "border-slate-200 bg-black text-white",
  accent: "border-yellow-300/50 bg-yellow-300/10 text-yellow-300",
  solid:
    "border-[#ffe700] bg-[#ffe700] text-black font-bold hover:bg-[#eed500] hover:border-[#eed500] hover:text-black focus-visible:bg-[#eed500] focus-visible:border-[#eed500] focus-visible:text-black hover:first-letter:text-black focus-visible:first-letter:text-black before:hidden",
  quiet:
    "border-transparent bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white hover:border-transparent focus-visible:bg-slate-800/50 focus-visible:text-white focus-visible:border-transparent hover:first-letter:text-white focus-visible:first-letter:text-white before:hidden",
  danger: "border-red-400 bg-black text-white",
  compact: "h-[var(--sd-form-control-small-height)] px-2 py-0.5 text-[10px] leading-tight",
  small: "h-[var(--sd-form-control-small-height)] px-2 py-0.5 text-[10px] leading-tight",
  large: "h-[var(--sd-form-control-large-height)] px-5 py-2.5 text-sm leading-normal",
  noShift: "sd-btn-no-shift noShift hover:!left-0 focus-visible:!left-0",
};

type SharedButtonProps = {
  accent?: boolean;
  variant?: "default" | "accent" | "solid" | "quiet" | "danger";
  size?: ControlSize;
  compact?: boolean;
  noShift?: boolean;
  className?: string;
};

export type ButtonProps<T extends ElementType = "button"> = PropsWithChildren<SharedButtonProps> & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof SharedButtonProps | "as">;

export function Button<T extends ElementType = "button">({
  as,
  accent = false,
  variant,
  size,
  compact = false,
  noShift = false,
  className = "",
  children,
  ...props
}: ButtonProps<T>) {
  const Component = (as ?? "button") as ElementType;
  const isNativeButton = Component === "button";
  const buttonType = isNativeButton ? ((props as { type?: string }).type ?? "button") : undefined;

  const buttonVariant = variant ?? (accent ? "accent" : "default");
  const variantClassName =
    buttonVariant === "accent"
      ? buttonStyles.accent
      : buttonVariant === "solid"
        ? buttonStyles.solid
        : buttonVariant === "quiet"
          ? buttonStyles.quiet
          : buttonVariant === "danger"
            ? buttonStyles.danger
            : buttonStyles.default;

  const effectiveSize: ControlSize = size ?? (compact ? "small" : "default");
  const sizeClassName =
    effectiveSize === "small"
      ? buttonStyles.compact
      : effectiveSize === "large"
        ? buttonStyles.large
        : "h-[var(--sd-form-control-height)] px-3.5 py-2 text-xs";

  return (
    <Component
      {...(isNativeButton ? { type: buttonType } : {})}
      className={cx(
        "sd-btn-effects",
        "relative left-0 inline-flex items-center justify-center overflow-hidden rounded-[0_var(--sd-button-radius)_0_var(--sd-button-radius)] border font-medium transition-[border-color,left] duration-1000 ease-in-out",
        sizeClassName,
        variantClassName,
        noShift && buttonStyles.noShift,
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
