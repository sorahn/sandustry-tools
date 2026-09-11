import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import type { AppShellSidebarPosition } from "../elements/app-shell";
import type {} from "../jsx";
import "../elements/app-shell";

export type AppShellProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  topBar?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  overlays?: ReactNode;
  sidebarPosition?: AppShellSidebarPosition;
  responsive?: boolean;
  stackBreakpoint?: number;
  sidebarLabel?: string;
  mainLabel?: string;
};

export function AppShell({
  topBar,
  sidebar,
  footer,
  overlays,
  sidebarPosition = "start",
  responsive = true,
  stackBreakpoint,
  sidebarLabel = "Navigation",
  mainLabel = "Main content",
  className,
  children,
  ...props
}: AppShellProps) {
  return (
    <sandustry-app-shell
      {...props}
      sidebar-position={sidebarPosition}
      responsive={responsive ? "" : undefined}
      stack-breakpoint={stackBreakpoint}
      sidebar-label={sidebarLabel}
      main-label={mainLabel}
      has-topbar={topBar ? "" : undefined}
      has-sidebar={sidebar ? "" : undefined}
      has-footer={footer ? "" : undefined}
      has-overlays={overlays ? "" : undefined}
      class={className}
    >
      {topBar ? <div slot="topbar">{topBar}</div> : null}
      {sidebar ? <div slot="sidebar">{sidebar}</div> : null}
      {footer ? <div slot="footer">{footer}</div> : null}
      {overlays ? <div slot="overlays">{overlays}</div> : null}
      {children}
    </sandustry-app-shell>
  );
}
