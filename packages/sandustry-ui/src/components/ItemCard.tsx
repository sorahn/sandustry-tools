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
            : "border-slate-700 bg-black/40 hover:border-slate-500 hover:bg-black/60",
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
              : "text-slate-300 group-hover:text-white",
          )}
        >
          {label}
        </span>
        {meta ? <span className="ml-auto shrink-0 text-[10px] text-slate-500">{meta}</span> : null}
      </button>
    </sandustry-item-card>
  );
}
