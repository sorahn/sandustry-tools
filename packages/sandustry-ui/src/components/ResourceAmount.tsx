import type { HTMLAttributes, ReactNode } from "react";
import cx from "clsx";

export type ResourceType = "credits" | "fluxite" | "artifact" | "custom";

export type ResourceAmountProps = HTMLAttributes<HTMLSpanElement> & {
  type?: ResourceType;
  amount: number | string;
  icon?: ReactNode;
  label?: string;
  size?: "sm" | "md";
};

// SVG currency symbols representing native game currencies without importing game files
export function CreditsIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cx("shrink-0 text-[#ffe700]", className)}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 5v6M6.5 6.5h3M6.5 9.5h3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FluxiteIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cx("shrink-0 text-[#00ffff]", className)}
      aria-hidden="true"
    >
      <path d="M8 2l4 4-4 8-4-8 4-4z" fill="currentColor" fillOpacity="0.8" />
      <path d="M8 2l4 4-4 8" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.6" fill="none" />
    </svg>
  );
}

export function ArtifactIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cx("shrink-0 text-[#d946ef]", className)}
      aria-hidden="true"
    >
      <polygon points="8,1 15,8 8,15 1,8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="8,4 12,8 8,12 4,8" fill="currentColor" fillOpacity="0.6" />
    </svg>
  );
}

function formatAmount(val: number | string): string {
  if (typeof val === "number") {
    return val.toLocaleString("en-US");
  }
  return val;
}

export function ResourceAmount({
  type = "credits",
  amount,
  icon,
  label,
  size = "sm",
  className = "",
  ...props
}: ResourceAmountProps) {
  const isMd = size === "md";

  const defaultIcon =
    type === "credits" ? (
      <CreditsIcon className={isMd ? "h-3.5 w-3.5" : "h-3 w-3"} />
    ) : type === "fluxite" ? (
      <FluxiteIcon className={isMd ? "h-3.5 w-3.5" : "h-3 w-3"} />
    ) : type === "artifact" ? (
      <ArtifactIcon className={isMd ? "h-3.5 w-3.5" : "h-3 w-3"} />
    ) : null;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 select-none font-mono tabular-nums text-slate-300",
        isMd ? "text-xs" : "text-[11px]",
        className,
      )}
      {...props}
    >
      {icon ?? defaultIcon}
      <span>{formatAmount(amount)}</span>
      {label ? <span className="font-sans text-[10px] text-slate-500">{label}</span> : null}
    </span>
  );
}

export type CurrencyRowProps = HTMLAttributes<HTMLDivElement> & {
  credits?: number | string;
  fluxite?: number | string;
  artifact?: number | string;
  size?: "sm" | "md";
};

export function CurrencyRow({
  credits,
  fluxite,
  artifact,
  size = "sm",
  className = "",
  ...props
}: CurrencyRowProps) {
  return (
    <div className={cx("flex flex-wrap items-center gap-3", className)} {...props}>
      {credits !== undefined ? (
        <ResourceAmount type="credits" amount={credits} size={size} />
      ) : null}
      {fluxite !== undefined ? (
        <ResourceAmount type="fluxite" amount={fluxite} size={size} />
      ) : null}
      {artifact !== undefined ? (
        <ResourceAmount type="artifact" amount={artifact} size={size} />
      ) : null}
    </div>
  );
}
