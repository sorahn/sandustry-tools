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

export const CREDITS_SPRITE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAATVJREFUWIXtl69Ow1AUh7+zLHuBmhH+LFuC4QkIcg+AQ+HmULipZYJMzaFwOBSOB0ASngBDAuHPgqF4Zu7EcjtK27tx03OL2E80ze3N+b60OTc9QjYmZ00t8hs+NPvB4GdynxJI4PHDVA0a7TUSOCBWoBK4vVQGB6jZmyrgKYEq4OoCy+AA9VWL+MYFdwrEn19zAZq2iG8K4RkBC/Up5JtFF7jhapE/nP0qb6AOYOIuTG/zdzS6SFTwrISonwNrgbXAsvyPNny8c2/aPdBA/xCQbz1AmQK+f8vOTyeAebrxLL1COoduCQHM87WeAED7qFhCAPNypSsA0DrOlxDAvF7qCwDs9LISApi3izACANsnaYlkMHk/Dyexdbpgp0azyTicxGZ/LpEZTj9G4SQ2BvmtEXQ8nwEdjFH1S9fw7gAAAABJRU5ErkJggg==";

export const FLUXITE_SPRITE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAPxJREFUWIXtl08LgjAYxp9JUHROOkh4K/D7f5auCl0SQ4jAU1CXJs757o9zWwef05hzv2fPtldkkPWZ6PMmNoZ3RRj+/soAgA0N9PBH3XiBHo6pAMcggShw3ogGB4CEN2LAAWBDvdi+WwDAObs4m6DgggEOVEzgInICMgGbSVyUGIzxKimB7XMndmR9a06F0qZmtAW21VF16EgD0sp/am5m1zM9qa8bpUXOwFw4TLage3XK53mRz4ZDl0CNu1c4phIYQzmEkgtcMKBaraYSOhWotRKuBkgDFUpUKOMZCCXpFoRY9VD/k0DolXNFT2A1wEx+SF2/eFoDFmMX1xep6EpGPT0GxQAAAABJRU5ErkJggg==";

export const ARTIFACT_SPRITE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAOhJREFUOI1jZGBg+M9AAWBhYGBgWJb5GUPi29fvBDWnLBKDGHD94gOSbN078yeEsQjqAhj4/Q/TVlYmTgYGBgaG5mO6cDGL74fhbCZCtqEZyoguz4IuwMDAwNBxwgzOrrA4hWwIRoDDDcDifEZkDRanDqPL43YBMnj7+RnDsdZfDAzPoAKv32AagC3wYGD21QAGhgDcFjDBbMEBGAlhJpgtOAz5j4TR+f8ZGBj+MzFgiRokxciBB+fDMAMDjkBED3FcMYBhAHKI80pJ4tSEDGDOx0gg2htWoQqgRR8DAwPD1dQs/P4nBgAAHYZYhgkbqboAAAAASUVORK5CYII=";

export function CreditsIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <img
      src={CREDITS_SPRITE}
      alt="Credits"
      className={cx("shrink-0 object-contain [image-rendering:pixelated]", className)}
      aria-hidden="true"
    />
  );
}

export function FluxiteIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <img
      src={FLUXITE_SPRITE}
      alt="Fluxite"
      className={cx("shrink-0 object-contain [image-rendering:pixelated]", className)}
      aria-hidden="true"
    />
  );
}

export function ArtifactIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <img
      src={ARTIFACT_SPRITE}
      alt="Artifact"
      className={cx("shrink-0 object-contain [image-rendering:pixelated]", className)}
      aria-hidden="true"
    />
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
