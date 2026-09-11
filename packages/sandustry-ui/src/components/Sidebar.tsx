import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import type { SidebarPosition } from "../elements/sidebar";
import type {} from "../jsx";
import "../elements/sidebar";

export type SidebarProps = PropsWithChildren<HTMLAttributes<HTMLElement>> & {
  header?: ReactNode;
  footer?: ReactNode;
  position?: SidebarPosition;
  collapsed?: boolean;
  ariaLabel?: string;
};

export function Sidebar({
  header,
  footer,
  position = "start",
  collapsed = false,
  ariaLabel = "Navigation",
  className = "",
  children,
  ...props
}: SidebarProps) {
  return (
    <sandustry-sidebar
      {...props}
      position={position}
      collapsed={collapsed ? "" : undefined}
      label={ariaLabel}
      aria-label={ariaLabel}
      class={cx("h-full", className)}
    >
      {header ? <div slot="header">{header}</div> : null}
      {children}
      {footer ? <div slot="footer">{footer}</div> : null}
    </sandustry-sidebar>
  );
}
