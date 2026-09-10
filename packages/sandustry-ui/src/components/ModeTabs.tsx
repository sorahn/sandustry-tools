import type { ButtonHTMLAttributes, HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import "../elements/mode-tabs";

export type ModeTabItem = {
  id: string;
  label: ReactNode;
  hotkey?: string;
  disabled?: boolean;
};

export type ModeTabsProps = PropsWithChildren<Omit<HTMLAttributes<HTMLDivElement>, "onChange">> & {
  value?: string;
  onChange?: (value: string) => void;
  items?: readonly ModeTabItem[];
};

export function ModeTabs({
  value,
  onChange,
  items,
  className = "",
  children,
  ...props
}: ModeTabsProps) {
  return (
    <sandustry-mode-tabs
      {...props}
      role="tablist"
      value={value}
      class={cx("flex items-center gap-2", className)}
    >
      {items
        ? items.map((item) => (
            <ModeTab
              key={item.id}
              selected={item.id === value}
              disabled={item.disabled}
              hotkey={item.hotkey}
              onClick={() => onChange?.(item.id)}
            >
              {item.label}
            </ModeTab>
          ))
        : children}
    </sandustry-mode-tabs>
  );
}

export type ModeTabProps = PropsWithChildren<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    selected?: boolean;
    hotkey?: string;
    children?: ReactNode;
  }
>;

export function ModeTab({
  selected = false,
  hotkey,
  className = "",
  disabled = false,
  children,
  ...props
}: ModeTabProps) {
  const formattedHotkey = hotkey
    ? hotkey.startsWith("[") && hotkey.endsWith("]")
      ? hotkey
      : `[${hotkey}]`
    : null;

  return (
    <sandustry-mode-tab
      selected={selected ? "" : undefined}
      disabled={disabled ? true : undefined}
      hotkey={formattedHotkey ?? undefined}
      class="inline-block"
    >
      <button
        {...props}
        type="button"
        role="tab"
        disabled={disabled}
        aria-selected={selected}
        className={cx(
          "relative flex h-10 w-48 items-center justify-between overflow-hidden rounded-tr-md rounded-bl-md border px-3 text-sm font-medium tracking-wider shadow-md transition-all duration-200 select-none cursor-pointer",
          "active:scale-90",
          "sd-sheen",
          selected
            ? "border-[var(--sd-color-primary,#ffe700)] text-[var(--sd-color-primary,#ffe700)] bg-[linear-gradient(45deg,var(--sd-color-primary-soft,rgba(255,231,0,0.15)),transparent)]"
            : "border-slate-500 bg-black/25 text-white hover:border-transparent hover:text-[var(--sd-color-primary,#ffe700)]",
          disabled &&
            "cursor-not-allowed opacity-40 hover:border-slate-500 hover:text-white before:hidden active:scale-100",
          className,
        )}
      >
        <span className="truncate">{children}</span>
        {formattedHotkey ? (
          <span
            className={cx(
              "ml-2 shrink-0 font-mono text-xs font-bold sd-drop-shadow transition-colors",
              selected
                ? "text-[var(--sd-color-primary,#ffe700)]"
                : "text-[var(--sd-color-primary,#ffe700)] group-hover:text-[var(--sd-color-primary,#ffe700)]",
            )}
          >
            {formattedHotkey}
          </span>
        ) : null}
      </button>
    </sandustry-mode-tab>
  );
}
