import { type ReactNode, useState } from "react";
import { readStoredBoolean, writeStoredBoolean } from "../utils/storage";

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
  const [collapsed, setCollapsed] = useState(() =>
    storageKey ? readStoredBoolean(storageKey, defaultCollapsed) : defaultCollapsed,
  );
  const toggle = () => {
    setCollapsed((value) => {
      const next = !value;
      if (storageKey) writeStoredBoolean(storageKey, next);
      return next;
    });
  };
  const heading = collapsible ? (
    <button
      type="button"
      className="inline-flex items-center gap-2 border-0 bg-transparent p-0 font-inherit text-slate-500 focus-visible:outline-2 focus-visible:outline-yellow-300 focus-visible:outline-offset-3"
      onClick={toggle}
      aria-expanded={!collapsed}
    >
      <svg
        className={`h-3 w-3 shrink-0 transition-transform duration-150 ${collapsed ? "-rotate-90" : ""}`}
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
  );

  return (
    <section>
      <p className="flex flex-row items-center justify-between font-mono uppercase tracking-[0.18em] text-slate-500">
        {heading}
        {headerAction}
      </p>
      {collapsed ? null : <div className="mt-3">{children}</div>}
    </section>
  );
}
