import type { PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import cx from "clsx";
import { IconButton } from "@sandustry/ui";
import { AppStatusBar, type AppStatusBarProps } from "./AppStatusBar";

export type AppWorkspaceShellProps = PropsWithChildren<{
  sidebar?: ReactNode;
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  sidebarTitle?: string;
  sidebarWidth?: string;
  sidebarCollapsed?: boolean;
  defaultSidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  statusBarProps?: AppStatusBarProps;
  footer?: ReactNode;
  overlays?: ReactNode;
  className?: string;
}>;

export function AppWorkspaceShell({
  sidebar,
  sidebarHeader,
  sidebarFooter,
  sidebarTitle = "Inspector",
  sidebarWidth = "w-80 lg:w-96",
  sidebarCollapsed: controlledCollapsed,
  defaultSidebarCollapsed = false,
  onSidebarCollapsedChange,
  statusBarProps,
  footer,
  overlays,
  className,
  children,
}: AppWorkspaceShellProps) {
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultSidebarCollapsed);
  const isCollapsed = controlledCollapsed ?? uncontrolledCollapsed;

  const handleToggleSidebar = () => {
    const next = !isCollapsed;
    if (controlledCollapsed === undefined) {
      setUncontrolledCollapsed(next);
    }
    onSidebarCollapsedChange?.(next);
  };

  return (
    <div
      className={cx(
        "flex h-full w-full flex-1 min-h-0 min-w-0 flex-col overflow-hidden bg-[var(--sd-color-bg,#181c20)]",
        className,
      )}
    >
      {/* Workspace Body: Canvas + Right Sidebar */}
      <div className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* Main Canvas Landmark */}
        <main
          className="relative flex h-full flex-1 min-h-0 min-w-0 flex-col overflow-hidden"
          aria-label="Workspace canvas"
        >
          {children}

          {/* Floating Expand Sidebar Button (when sidebar is collapsed) */}
          {sidebar && isCollapsed ? (
            <div className="absolute right-3 top-16 z-30">
              <IconButton
                size="small"
                label="Show inspector sidebar"
                onClick={handleToggleSidebar}
                className="border border-[var(--sd-color-border,#2a323d)] bg-[var(--sd-color-surface-elevated,#262d37)]/90 shadow-md backdrop-blur text-[var(--sd-color-text,#e8eef5)] hover:border-[var(--sd-color-primary,#ffe700)] hover:text-[var(--sd-color-primary,#ffe700)]"
              >
                <span className="font-mono text-xs">◨</span>
              </IconButton>
            </div>
          ) : null}
        </main>

        {/* Right Sidebar Landmark */}
        {sidebar ? (
          <aside
            aria-label={sidebarTitle}
            className={cx(
              "relative flex flex-col shrink-0 border-l border-[var(--sd-color-border,#2a323d)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.35))] transition-[width,margin] duration-150 ease-out z-20",
              isCollapsed ? "w-0 overflow-hidden border-l-0" : sidebarWidth,
            )}
          >
            {/* Sidebar Header */}
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--sd-color-border,#2a323d)]/80 px-3 font-mono text-xs text-[var(--sd-color-text-muted,#b6bcc1)] bg-[var(--sd-color-surface,#1c2127)]/50">
              <div className="flex min-w-0 items-center gap-2 font-semibold uppercase tracking-wider text-[11px] text-[var(--sd-color-text,#e8eef5)] truncate">
                {sidebarHeader ?? <span>{sidebarTitle}</span>}
              </div>
              <IconButton
                size="small"
                label="Collapse sidebar"
                onClick={handleToggleSidebar}
                className="text-[var(--sd-color-text-muted,#b6bcc1)] hover:text-[var(--sd-color-text,#e8eef5)]"
              >
                <span className="font-mono text-xs">◧</span>
              </IconButton>
            </div>

            {/* Sidebar Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{sidebar}</div>

            {/* Sidebar Footer */}
            {sidebarFooter ? (
              <div className="shrink-0 border-t border-[var(--sd-color-border,#2a323d)]/80 bg-[var(--sd-color-surface,#1c2127)]/40 p-2 text-xs">
                {sidebarFooter}
              </div>
            ) : null}
          </aside>
        ) : null}

        {/* Overlays (drag scrims, modals) */}
        {overlays ? (
          <div className="pointer-events-none absolute inset-0 z-40">{overlays}</div>
        ) : null}
      </div>

      {/* Fixed Status Bar Footer */}
      {footer !== undefined ? footer : <AppStatusBar {...statusBarProps} />}
    </div>
  );
}
