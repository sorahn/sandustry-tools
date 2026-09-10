import {
  useId,
  useState,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import cx from "clsx";
import "../elements/collapsible";

export type CollapsibleProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLElement>, "title"> & {
    title: ReactNode;
    headerAction?: ReactNode;
    collapsible?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    collapsed?: boolean;
    defaultCollapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    headerClassName?: string;
    contentClassName?: string;
    buttonClassName?: string;
  }
>;

export function Collapsible({
  title,
  headerAction,
  collapsible = true,
  open: controlledOpen,
  defaultOpen,
  onOpenChange,
  collapsed: controlledCollapsed,
  defaultCollapsed,
  onCollapsedChange,
  headerClassName = "",
  contentClassName = "mt-3",
  buttonClassName = "",
  className = "",
  children,
  id: customId,
  ...props
}: CollapsibleProps) {
  const generatedId = useId();
  const contentId = customId ? `${customId}-content` : `collapsible-${generatedId}-content`;

  // Compute effective initial state
  const initialOpen =
    defaultOpen !== undefined
      ? defaultOpen
      : defaultCollapsed !== undefined
        ? !defaultCollapsed
        : true;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(initialOpen);

  // Compute effective controlled state
  const isControlled = controlledOpen !== undefined || controlledCollapsed !== undefined;
  const isOpen =
    controlledOpen !== undefined
      ? controlledOpen
      : controlledCollapsed !== undefined
        ? !controlledCollapsed
        : uncontrolledOpen;

  const toggle = () => {
    if (!collapsible) return;
    const nextOpen = !isOpen;
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
    onCollapsedChange?.(!nextOpen);
  };

  return (
    <sandustry-collapsible
      {...props}
      open={isOpen ? "" : undefined}
      collapsible={collapsible ? "" : undefined}
      class={cx("group block", className)}
    >
      <div
        className={cx(
          "flex flex-row items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-[var(--sd-color-text-subtle,#8295ab)]",
          headerClassName,
        )}
      >
        {collapsible ? (
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={contentId}
            onClick={toggle}
            className={cx(
              "inline-flex items-center gap-2 border-0 bg-transparent p-0 font-inherit text-[var(--sd-color-text-subtle,#8295ab)] transition-colors hover:text-[var(--sd-color-text-muted,#94a3b8)] focus-visible:outline-2 focus-visible:outline-[var(--sd-color-primary,#ffe700)] focus-visible:outline-offset-3 cursor-pointer",
              buttonClassName,
            )}
          >
            <svg
              className={cx(
                "h-3 w-3 shrink-0 transition-transform duration-150",
                !isOpen && "-rotate-90",
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
            <span>{title}</span>
          </button>
        ) : (
          <span>{title}</span>
        )}
        {headerAction}
      </div>
      {isOpen ? (
        <div id={contentId} className={contentClassName}>
          {children}
        </div>
      ) : null}
    </sandustry-collapsible>
  );
}
