import { useEffect, useState, type HTMLAttributes, type ReactNode } from "react";
import cx from "clsx";
import { Spinner } from "./Spinner";
import type { ControlSize } from "../types";
import "../elements/loading-overlay";

export type LoadingOverlayProps = HTMLAttributes<HTMLDivElement> & {
  busy: boolean;
  message?: ReactNode;
  fadeDurationMs?: number;
  spinnerSize?: ControlSize;
  dataTestId?: string;
  cardClassName?: string;
  ariaLive?: "polite" | "assertive" | "off";
};

export function LoadingOverlay({
  busy,
  message,
  fadeDurationMs = 250,
  spinnerSize = "small",
  dataTestId = "loading-overlay",
  cardClassName = "",
  ariaLive = "polite",
  className = "",
  ...props
}: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(busy);
  const [visible, setVisible] = useState(busy);
  const [displayMessage, setDisplayMessage] = useState(message);

  useEffect(() => {
    if (busy) {
      setDisplayMessage(message);
      setMounted(true);
      const frame =
        typeof requestAnimationFrame !== "undefined"
          ? requestAnimationFrame(() => setVisible(true))
          : null;
      if (frame === null) {
        setVisible(true);
      }

      return () => {
        if (frame !== null && typeof cancelAnimationFrame !== "undefined") {
          cancelAnimationFrame(frame);
        }
      };
    } else {
      setVisible(false);
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      const duration = prefersReducedMotion ? 0 : fadeDurationMs;
      const timer = setTimeout(() => {
        setMounted(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [busy, message, fadeDurationMs]);

  if (!mounted) return null;

  const testId =
    ((props as Record<string, unknown>)["data-testid"] as string | undefined) ?? dataTestId;

  return (
    <sandustry-loading-overlay
      busy={busy ? "" : undefined}
      visible={visible ? "" : undefined}
      data-testid={testId}
      aria-live={ariaLive}
      aria-busy={busy ? "true" : "false"}
      {...props}
      class={cx(
        "absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity ease-out motion-reduce:transition-none",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
        className,
      )}
      style={{
        transitionDuration: `${fadeDurationMs}ms`,
        ...props.style,
      }}
    >
      <div
        className={cx(
          "flex items-center gap-2.5 rounded-lg border border-[var(--sd-color-border,#2e2e2e)] bg-[var(--sd-color-surface-elevated,#2b2b2b)]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md",
          cardClassName,
        )}
      >
        <Spinner size={spinnerSize} tone="accent" aria-hidden="true" />
        {displayMessage ? (
          <span className="font-mono text-xs font-medium text-[var(--sd-color-text,#e8eef5)]">
            {displayMessage}
          </span>
        ) : null}
      </div>
    </sandustry-loading-overlay>
  );
}
