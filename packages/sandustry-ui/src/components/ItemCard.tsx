import type { ButtonHTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import "../elements/item-card";

export type ItemCardProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon?: ReactNode;
  label: ReactNode;
  meta?: ReactNode;
  selected?: boolean;
};

export function ItemCard({
  icon,
  label,
  meta,
  selected = false,
  className = "",
  ...props
}: ItemCardProps) {
  return (
    <sandustry-item-card
      selected={selected ? "" : undefined}
      disabled={props.disabled}
      class="block w-full"
    >
      <button
        {...props}
        type="button"
        className={cx(
          "group flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left transition-all duration-200",
          selected
            ? "border-[var(--sd-color-primary,#ffe700)] bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.1))]"
            : "border-[var(--sd-color-border,#2e2e2e)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] hover:border-[var(--sd-color-border-hover,#4a4a4a)] hover:bg-[var(--sd-color-surface-hover,#333333)]",
          props.disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        {icon ? (
          <span className="flex h-3 w-3 shrink-0 items-center justify-center">{icon}</span>
        ) : null}
        <span
          className={cx(
            "truncate text-xs transition-colors",
            selected
              ? "text-[var(--sd-color-primary,#ffe700)]"
              : "text-[var(--sd-color-text-muted,#b6bcc1)] group-hover:text-[var(--sd-color-text,#e8eef5)]",
          )}
        >
          {label}
        </span>
        {meta ? (
          <span className="ml-auto shrink-0 text-[10px] text-[var(--sd-color-text-subtle,#808080)]">
            {meta}
          </span>
        ) : null}
      </button>
    </sandustry-item-card>
  );
}
