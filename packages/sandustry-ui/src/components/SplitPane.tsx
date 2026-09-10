import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import cx from "clsx";
import "../elements/split-pane";

export type SplitPaneProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  sidebar: ReactNode;
  sidebarClassName?: string;
  contentClassName?: string;
  sidebarPosition?: "start" | "end";
};

export function SplitPane({
  sidebar,
  sidebarClassName = "",
  contentClassName = "",
  sidebarPosition = "start",
  className = "",
  children,
  ...props
}: SplitPaneProps) {
  const hasWidth = /(^|\s)w-/.test(sidebarClassName);
  const sidebarNode = (
    <aside
      className={cx(
        "flex min-h-0 shrink-0 flex-col border-[var(--sd-color-border,#2e2e2e)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.25))]",
        !hasWidth && "w-52",
        sidebarPosition === "start" ? "border-r" : "border-l",
        sidebarClassName,
      )}
    >
      {sidebar}
    </aside>
  );

  return (
    <sandustry-split-pane
      {...props}
      sidebar-position={sidebarPosition}
      class={cx("flex min-h-0", className)}
    >
      {sidebarPosition === "start" ? sidebarNode : null}
      <main className={cx("flex min-h-0 min-w-0 flex-1 flex-col", contentClassName)}>
        {children}
      </main>
      {sidebarPosition === "end" ? sidebarNode : null}
    </sandustry-split-pane>
  );
}
