import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import cx from "clsx";
import "../elements/panel";
export type { PanelVariant } from "../elements/panel";

export type PanelProps = PropsWithChildren<HTMLAttributes<HTMLElement>> & {
  header?: ReactNode;
  title?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  variant?: "default" | "hero";
  padded?: boolean;
  contentClassName?: string;
};

export function Panel({
  header,
  title,
  collapsible = false,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  variant = "default",
  padded = false,
  contentClassName = "",
  className = "",
  children,
  ...props
}: PanelProps) {
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed);
  const isControlled = controlledCollapsed !== undefined;
  const collapsed = isControlled ? controlledCollapsed : uncontrolledCollapsed;

  const toggleCollapsed = () => {
    if (isControlled) {
      onCollapsedChange?.(!collapsed);
    } else {
      setUncontrolledCollapsed((value) => !value);
    }
  };

  const panelHeader =
    header || (collapsible && title) ? (
      <div
        slot="header"
        className="box-border flex min-h-[var(--sd-control-height)] items-center justify-between border-b border-[var(--sd-color-border,#2a323d)] px-4 py-2"
      >
        {collapsible ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 border-0 bg-transparent p-0 font-inherit text-[var(--sd-color-text-muted,#b6bcc1)] focus-visible:outline-2 focus-visible:outline-[var(--sd-color-primary,#ffe700)] focus-visible:outline-offset-3"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
          >
            <svg
              className={cx(
                "h-3 w-3 shrink-0 transition-transform duration-150",
                collapsed && "-rotate-90",
              )}
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 4.5L6 8l3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[11px] text-[var(--sd-color-text-muted,#b6bcc1)]">{title}</span>
          </button>
        ) : (
          <span className="text-[11px] text-[var(--sd-color-text-muted,#b6bcc1)]">{title}</span>
        )}
        {header}
      </div>
    ) : null;

  return (
    <sandustry-panel
      {...props}
      variant={variant}
      collapsible={collapsible ? "" : undefined}
      collapsed={collapsed ? "" : undefined}
      padded={padded ? "" : undefined}
      class={cx(
        "overflow-hidden border border-[var(--sd-color-border,#334155)] bg-[var(--sd-color-surface,rgba(0,0,0,0.75))] shadow-xl text-[var(--sd-color-text,#e8eef5)]",
        variant === "hero"
          ? "rounded-[0_12px] border-[var(--sd-color-border-strong,rgba(100,116,139,0.7))] bg-[var(--sd-color-surface,rgba(0,0,0,0.92))] shadow-[0_28px_64px_rgba(0,0,0,0.56)] outline outline-1 outline-[var(--sd-color-bg,#000000)]"
          : "rounded",
        className,
      )}
    >
      {panelHeader}
      {collapsed ? null : <div className={cx(padded && "p-4", contentClassName)}>{children}</div>}
    </sandustry-panel>
  );
}
