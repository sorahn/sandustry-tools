import type { ComponentPropsWithoutRef, ElementType, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import "../elements/text-action";

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
  const Component = as as ElementType | undefined;
  const isCustom = Boolean(Component && Component !== "button");

  const classes = cx(
    "inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-white/85 transition-colors hover:text-[#ffe700] focus-visible:outline-2 focus-visible:outline-[#ffe700] focus-visible:outline-offset-2",
    className,
  );

  if (isCustom && Component) {
    return (
      <Component {...props} className={classes}>
        {icon}
        {children}
      </Component>
    );
  }

  const buttonType = (props as { type?: "button" | "submit" | "reset" }).type ?? "button";

  return (
    <sandustry-text-action {...props} type={buttonType} class={classes}>
      {icon ? <span slot="icon">{icon}</span> : null}
      {children}
    </sandustry-text-action>
  );
}
