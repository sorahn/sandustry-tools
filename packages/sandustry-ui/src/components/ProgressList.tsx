import type { HTMLAttributes, PropsWithChildren } from "react";
import cx from "clsx";
import type { ProgressListItemVariant } from "../elements/progress-list";
import "../elements/progress-list";
export type { ProgressListItemVariant };

export type ProgressListProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  height?: string;
};

export function ProgressList({
  height = "120px",
  className = "",
  children,
  ...props
}: ProgressListProps) {
  return (
    <sandustry-progress-list
      {...props}
      height={height}
      role={props.role ?? "list"}
      class={cx(
        "relative block overflow-y-auto rounded border border-[var(--sd-color-border-subtle,#1e293b)] bg-[var(--sd-color-surface-muted,#070a0f)]/50 p-4 pr-5 text-left text-sm leading-[1.8] text-[var(--sd-color-text,#ffffff)]",
        "sd-no-scrollbar",
        className,
      )}
      style={{ ...props.style, height }}
    >
      {children}
    </sandustry-progress-list>
  );
}

export type ProgressListItemProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  variant?: ProgressListItemVariant;
  last?: boolean;
};

export function ProgressListItem({
  variant = "default",
  last = false,
  className = "",
  children,
  ...props
}: ProgressListItemProps) {
  return (
    <sandustry-progress-list-item
      {...props}
      variant={variant}
      last={last ? "" : undefined}
      role={props.role ?? "listitem"}
      class={cx(
        "relative block mb-2 pl-5 font-medium opacity-0 animate-sd-progress-fade-in",
        variant === "active" && "text-[var(--sd-color-primary,#ffe700)] sd-text-glow-yellow",
        variant === "substep" &&
          "mb-1 text-[13px] font-normal text-[var(--sd-color-text-muted,#94a3b8)]",
        last && "mb-0",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "absolute left-0 w-4 text-center font-bold text-[var(--sd-color-primary,#ffe700)]",
          variant === "substep"
            ? last
              ? "text-sm animate-sd-progress-slide"
              : "text-sm"
            : "text-base animate-sd-progress-pulse",
          variant === "active" && "[animation:none] sd-text-glow-yellow",
          variant === "substep" && !last && "before:content-['•']",
          variant === "substep" && last && "before:content-['→']",
          variant !== "substep" && "before:content-['▸']",
        )}
      />
      {children}
    </sandustry-progress-list-item>
  );
}
