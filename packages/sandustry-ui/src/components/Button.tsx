import type { ComponentPropsWithoutRef, ElementType, PropsWithChildren } from "react";
import cx from "clsx";
import styles from "../styles/button.module.css";

export const buttonStyles = {
  button: cx(
    styles.effects,
    "relative left-0 inline-flex min-h-9 items-center justify-center overflow-hidden rounded-[0_var(--sd-button-radius)_0_var(--sd-button-radius)] border px-3.5 py-2 text-xs font-medium transition-[border-color,left] duration-1000 ease-in-out",
  ),
  effects: styles.effects,
  default: "border-slate-200 bg-black text-white",
  accent: "border-yellow-300/50 bg-yellow-300/10 text-yellow-300",
  solid: cx(styles.solid, "border-[#ffe700] bg-[#ffe700] text-black font-bold"),
  quiet: cx(styles.quiet, "border-transparent bg-transparent text-slate-400"),
  danger: "border-red-400 bg-black text-white",
  compact: "min-h-0 px-1.5 py-0.75 text-[10px]",
  noShift: styles.noShift,
};

type SharedButtonProps = {
  accent?: boolean;
  variant?: "default" | "accent" | "solid" | "quiet" | "danger";
  className?: string;
};

export type ButtonProps<T extends ElementType = "button"> = PropsWithChildren<SharedButtonProps> & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof SharedButtonProps | "as">;

export function Button<T extends ElementType = "button">({
  as,
  accent = false,
  variant,
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

  return (
    <Component
      {...(isNativeButton ? { type: buttonType } : {})}
      className={cx(buttonStyles.button, styles.effects, variantClassName, className)}
      {...props}
    >
      {children}
    </Component>
  );
}
