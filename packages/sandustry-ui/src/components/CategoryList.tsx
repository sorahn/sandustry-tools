import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";

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
    <div
      className={cx("group w-full", disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer")}
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={selected}
        className={cx(
          "relative left-0 flex w-full items-center justify-between overflow-hidden rounded px-3 py-2 text-left text-sm transition-all duration-200",
          !disabled &&
            "group-hover:left-2 group-hover:duration-0 group-hover:bg-slate-800 group-hover:text-[#ffe700]",
          selected ? "left-1 bg-slate-800 font-medium text-[#ffe700]" : "text-slate-200",
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
              selected ? "text-yellow-300/80" : "text-slate-500 group-hover:text-yellow-300/80",
            )}
          >
            {badge}
          </span>
        ) : null}
      </button>
    </div>
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
    <nav
      className={cx(
        "flex flex-col gap-1 overflow-y-auto pr-2",
        bordered && "border-r border-slate-800",
        className,
      )}
      {...props}
    >
      {children}
    </nav>
  );
}
