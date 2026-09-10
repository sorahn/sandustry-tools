import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import "../elements/category-list";

export type CategoryButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  selected?: boolean;
};

export function CategoryButton({
  label,
  icon,
  badge,
  selected = false,
  className = "",
  disabled = false,
  ...props
}: CategoryButtonProps) {
  return (
    <sandustry-category-button
      selected={selected ? "" : undefined}
      disabled={disabled ? true : undefined}
      class={cx(
        "group block w-full",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={selected}
        className={cx(
          "relative left-0 flex w-full items-center justify-between overflow-hidden rounded px-3 py-2 text-left text-sm transition-all duration-200 cursor-pointer",
          !disabled &&
            "group-hover:left-2 group-hover:duration-0 group-hover:bg-[var(--sd-color-surface-hover,#333333)] group-hover:text-[var(--sd-color-primary,#ffe700)]",
          selected
            ? "left-1 bg-[var(--sd-color-surface-elevated,#2b2b2b)] font-medium text-[var(--sd-color-primary,#ffe700)]"
            : "text-[var(--sd-color-text-muted,#b6bcc1)]",
          className,
        )}
        {...props}
      >
        <span className="flex items-center gap-2 truncate">
          {icon ? <span className="shrink-0">{icon}</span> : null}
          <span className="truncate">{label}</span>
        </span>
        {badge ? (
          <span
            className={cx(
              "ml-2 shrink-0 font-mono text-[11px]",
              selected
                ? "text-[var(--sd-color-primary,#ffe700)]"
                : "text-[var(--sd-color-text-subtle,#808080)] group-hover:text-[var(--sd-color-primary,#ffe700)]",
            )}
          >
            {badge}
          </span>
        ) : null}
      </button>
    </sandustry-category-button>
  );
}

export type CategoryListProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  bordered?: boolean;
};

export function CategoryList({
  children,
  bordered = true,
  className = "",
  ...props
}: CategoryListProps) {
  return (
    <sandustry-category-list
      {...props}
      bordered={bordered ? "" : undefined}
      class={cx(
        "flex flex-col gap-1 overflow-y-auto pr-2",
        bordered && "border-r border-[var(--sd-color-border-subtle,#242424)]",
        className,
      )}
    >
      {children}
    </sandustry-category-list>
  );
}
