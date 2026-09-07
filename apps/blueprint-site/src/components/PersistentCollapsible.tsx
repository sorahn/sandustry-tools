import { useState } from "react";
import { Collapsible, type CollapsibleProps } from "@sandustry/ui";
import { readStoredBoolean, writeStoredBoolean } from "../utils/storage";

export type PersistentCollapsibleProps = CollapsibleProps & {
  storageKey?: string;
};

export function PersistentCollapsible({
  storageKey,
  open: controlledOpen,
  defaultOpen,
  defaultCollapsed,
  onOpenChange,
  ...props
}: PersistentCollapsibleProps) {
  const initialOpen =
    defaultOpen !== undefined
      ? defaultOpen
      : defaultCollapsed !== undefined
        ? !defaultCollapsed
        : true;

  const [storedOpen, setStoredOpen] = useState(() =>
    storageKey ? readStoredBoolean(storageKey, initialOpen) : initialOpen,
  );

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : storedOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setStoredOpen(nextOpen);
    }
    if (storageKey) {
      writeStoredBoolean(storageKey, nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return <Collapsible {...props} open={isOpen} onOpenChange={handleOpenChange} />;
}
