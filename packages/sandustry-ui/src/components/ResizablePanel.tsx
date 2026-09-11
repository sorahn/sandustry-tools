import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import cx from "clsx";
import type {
  ResizablePanelCollapseChangeDetail,
  ResizablePanelPosition,
  ResizablePanelSizeChangeDetail,
  SandustryResizablePanel,
} from "../elements/resizable-panel";
import type {} from "../jsx";
import "../elements/resizable-panel";

export type ResizablePanelProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  sidebar: ReactNode;
  sidebarClassName?: string;
  contentClassName?: string;
  sidebarPosition?: ResizablePanelPosition;
  size?: number;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  step?: number;
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  collapseSize?: number;
  responsive?: boolean;
  stackBreakpoint?: number;
  onSizeChange?: (size: number, detail: ResizablePanelSizeChangeDetail) => void;
  onCollapsedChange?: (collapsed: boolean, detail: ResizablePanelCollapseChangeDetail) => void;
};

export function ResizablePanel({
  sidebar,
  sidebarClassName = "",
  contentClassName = "",
  sidebarPosition = "start",
  size,
  defaultSize,
  minSize,
  maxSize,
  step,
  collapsible = false,
  collapsed: controlledCollapsed,
  defaultCollapsed = false,
  collapseSize,
  responsive = true,
  stackBreakpoint,
  onSizeChange,
  onCollapsedChange,
  className = "",
  children,
  ...props
}: ResizablePanelProps) {
  const panelRef = useRef<SandustryResizablePanel>(null);
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed);
  const collapsed = controlledCollapsed ?? uncontrolledCollapsed;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleSizeChange = (event: Event) => {
      const detail = (event as CustomEvent<ResizablePanelSizeChangeDetail>).detail;
      onSizeChange?.(detail.size, detail);
    };
    const handleCollapseChange = (event: Event) => {
      const detail = (event as CustomEvent<ResizablePanelCollapseChangeDetail>).detail;
      if (controlledCollapsed === undefined) setUncontrolledCollapsed(detail.collapsed);
      onCollapsedChange?.(detail.collapsed, detail);
    };

    panel.addEventListener("sd-size-change", handleSizeChange);
    panel.addEventListener("sd-collapse-change", handleCollapseChange);
    return () => {
      panel.removeEventListener("sd-size-change", handleSizeChange);
      panel.removeEventListener("sd-collapse-change", handleCollapseChange);
    };
  }, [controlledCollapsed, onCollapsedChange, onSizeChange]);

  return (
    <sandustry-resizable-panel
      ref={panelRef}
      {...props}
      sidebar-position={sidebarPosition}
      size={size ?? defaultSize}
      min-size={minSize}
      max-size={maxSize}
      step={step}
      collapsible={collapsible ? "" : undefined}
      collapsed={collapsed ? "" : undefined}
      collapse-size={collapseSize}
      responsive={responsive ? "" : undefined}
      stack-breakpoint={stackBreakpoint}
      class={cx("flex min-h-0", className)}
    >
      <aside
        slot="sidebar"
        className={cx(
          "flex min-h-0 shrink-0 flex-col border-[var(--sd-color-border,#2e2e2e)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.25))]",
          sidebarPosition === "start" ? "border-r" : "border-l",
          sidebarClassName,
        )}
      >
        {sidebar}
      </aside>
      <main className={cx("flex min-h-0 min-w-0 flex-1 flex-col", contentClassName)}>
        {children}
      </main>
    </sandustry-resizable-panel>
  );
}
