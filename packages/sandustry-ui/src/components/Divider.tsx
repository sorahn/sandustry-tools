import type { HTMLAttributes } from "react";
import cx from "clsx";
import "../elements/divider";

export type { DividerVariant } from "../elements/divider";
import type { DividerVariant } from "../elements/divider";

export type DividerProps = HTMLAttributes<HTMLDivElement> & {
  variant?: DividerVariant;
};

export function Divider({ variant = "solid", className = "", ...props }: DividerProps) {
  return (
    <sandustry-divider
      {...props}
      variant={variant}
      role={props.role ?? "separator"}
      class={cx("w-full", className)}
    >
      <div
        className={cx(
          "h-px w-full",
          variant === "solid"
            ? "bg-[var(--sd-color-border,#2e2e2e)]"
            : "bg-gradient-to-r from-transparent via-[var(--sd-color-primary,#ffe700)]/40 to-transparent",
        )}
      />
    </sandustry-divider>
  );
}
