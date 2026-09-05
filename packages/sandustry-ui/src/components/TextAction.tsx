import type { ComponentPropsWithoutRef, ElementType, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";

type SharedTextActionProps = {
  icon?: ReactNode;
  className?: string;
};

export type TextActionProps<T extends ElementType = "button"> =
  PropsWithChildren<SharedTextActionProps> & {
    as?: T;
  } & Omit<ComponentPropsWithoutRef<T>, keyof SharedTextActionProps | "as">;

export function TextAction<T extends ElementType = "button">({
  as,
  icon,
  className = "",
  children,
  ...props
}: TextActionProps<T>) {
  const Component = (as ?? "button") as ElementType;
  const isNativeButton = Component === "button";
  const buttonType = isNativeButton ? ((props as { type?: string }).type ?? "button") : undefined;

  const classes = cx(
    "inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-white/85 transition-colors hover:text-[#ffe700] focus-visible:outline-2 focus-visible:outline-[#ffe700] focus-visible:outline-offset-2",
    className,
  );

  return (
    <Component {...(isNativeButton ? { type: buttonType } : {})} {...props} className={classes}>
      {icon}
      {children}
    </Component>
  );
}
