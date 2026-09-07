import type { ReactNode } from "react";
import { PersistentCollapsible } from "./PersistentCollapsible";

export function BlueprintMapSidebarSection({
  title,
  children,
  collapsible = false,
  defaultCollapsed = false,
  storageKey,
  headerAction,
}: {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  storageKey?: string;
  headerAction?: ReactNode;
}) {
  return (
    <PersistentCollapsible
      title={title}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
      storageKey={storageKey}
      headerAction={headerAction}
    >
      {children}
    </PersistentCollapsible>
  );
}
