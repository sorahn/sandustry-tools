import type { HTMLAttributes, PropsWithChildren } from "react";
import cx from "clsx";
import "../elements/action-bar";
export type { ActionBarAlign } from "../elements/action-bar";

export type ActionBarProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  align?: "start" | "end" | "between";
};

export function ActionBar({ align = "end", className = "", children, ...props }: ActionBarProps) {
  return (
    <sandustry-action-bar
      align={align}
      class={cx(
        "flex shrink-0 items-center gap-3 border-t border-[var(--sd-color-border,#2e2e2e)] px-4 py-3",
        align === "start" && "justify-start",
        align === "end" && "justify-end",
        align === "between" && "justify-between",
        className,
      )}
      {...props}
    >
      {children}
    </sandustry-action-bar>
  );
}
