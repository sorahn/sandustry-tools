import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import "../elements/tabs";

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
    <sandustry-tabs
      {...props}
      role="tablist"
      value={value}
      class={cx(
        "flex items-center gap-4 border-b border-[var(--sd-color-border,#2e2e2e)]",
        className,
      )}
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
    </sandustry-tabs>
  );
}

export type TabProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  selected?: boolean;
};

export function Tab({ selected = false, className = "", children, ...props }: TabProps) {
  return (
    <sandustry-tab
      selected={selected ? "" : undefined}
      disabled={props.disabled ? true : undefined}
      class="inline-flex items-center"
    >
      <button
        {...props}
        type="button"
        role="tab"
        aria-selected={selected}
        className={cx(
          "cursor-pointer border-b-2 px-2 pb-2 text-sm font-medium tracking-wider outline-none transition-colors",
          selected
            ? "border-[var(--sd-color-primary,#ffe700)] text-[var(--sd-color-primary,#ffe700)]"
            : "border-transparent text-[var(--sd-color-text-muted,#b6bcc1)] hover:border-[var(--sd-color-border-hover,#4a4a4a)] hover:text-[var(--sd-color-text,#e8eef5)]",
          props.disabled &&
            "cursor-not-allowed opacity-40 hover:border-transparent hover:text-[var(--sd-color-text-subtle,#808080)]",
          className,
        )}
      >
        {children}
      </button>
    </sandustry-tab>
  );
}
