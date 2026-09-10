import type { HTMLAttributes, PropsWithChildren } from "react";
import cx from "clsx";
import "../elements/list";
export type { ListVariant } from "../elements/list";

export type ListProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  variant?: "default" | "panel" | "flush";
};

export function List({ variant = "default", className = "", children, ...props }: ListProps) {
  return (
    <sandustry-list
      {...props}
      variant={variant}
      role={props.role ?? "list"}
      class={cx(
        "flex flex-col",
        variant === "default" && "gap-1",
        variant === "panel" &&
          "gap-1 rounded border border-[var(--sd-color-border,#2e2e2e)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] p-2",
        variant === "flush" && "divide-y divide-[var(--sd-color-border-subtle,#242424)]",
        className,
      )}
    >
      {children}
    </sandustry-list>
  );
}
