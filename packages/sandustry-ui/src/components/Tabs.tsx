import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";

export type TabItem = {
  id: string;
  label: ReactNode;
  disabled?: boolean;
  badge?: ReactNode;
};

export type TabsProps = PropsWithChildren<Omit<HTMLAttributes<HTMLDivElement>, "onChange">> & {
  value?: string;
  onChange?: (value: string) => void;
  items?: readonly TabItem[];
};

export function Tabs({ value, onChange, items, className = "", children, ...props }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cx("flex items-center gap-4 border-b border-slate-700/60", className)}
      {...props}
    >
      {items
        ? items.map((item) => (
            <Tab
              key={item.id}
              selected={item.id === value}
              disabled={item.disabled}
              onClick={() => onChange?.(item.id)}
            >
              {item.label}
              {item.badge ? <span className="ml-1.5">{item.badge}</span> : null}
            </Tab>
          ))
        : children}
    </div>
  );
}

export type TabProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  selected?: boolean;
};

export function Tab({ selected = false, className = "", children, ...props }: TabProps) {
  return (
    <button
      {...props}
      type="button"
      role="tab"
      aria-selected={selected}
      className={cx(
        "cursor-pointer border-b-2 px-2 pb-2 text-sm font-medium tracking-wider outline-none transition-colors",
        selected
          ? "border-[#ffe700] text-[#ffe700]"
          : "border-transparent text-slate-300 hover:border-slate-500 hover:text-white",
        props.disabled &&
          "cursor-not-allowed opacity-40 hover:border-transparent hover:text-slate-300",
        className,
      )}
    >
      {children}
    </button>
  );
}
