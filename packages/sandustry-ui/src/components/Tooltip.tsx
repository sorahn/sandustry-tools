import { forwardRef, useId, useLayoutEffect, useRef, useState } from "react";
import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { createPortal } from "react-dom";
import cx from "clsx";
import type { TooltipSide } from "../elements/tooltip";
import "../elements/tooltip";
export type { TooltipSide };

export type TooltipProps = PropsWithChildren<Omit<HTMLAttributes<HTMLDivElement>, "content">> & {
  content: ReactNode;
  side?: TooltipSide;
};

export type TooltipSurfaceProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export const TooltipSurface = forwardRef<HTMLElement, TooltipSurfaceProps>(function TooltipSurface(
  { children, className = "", ...props },
  ref,
) {
  return (
    <sandustry-tooltip-surface
      {...props}
      ref={ref}
      role="tooltip"
      class={cx(
        "block w-max max-w-64 rounded border border-[var(--sd-color-border-strong,#3d3d3d)] bg-[var(--sd-color-surface-elevated,#2b2b2b)] px-2.5 py-1.5 text-base text-[var(--sd-color-text,#e8eef5)] shadow-2xl ring-1 ring-black/60 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </sandustry-tooltip-surface>
  );
});

export function Tooltip({
  content,
  side = "top",
  className = "",
  children,
  ...props
}: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const tooltipRef = useRef<HTMLElement>(null);
  const positionedRef = useRef(false);
  const positionFrameRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      positionedRef.current = false;
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const nextPosition = {
        left: rect.left + rect.width / 2,
        top: side === "top" ? rect.top - 8 : rect.bottom + 8,
      };
      if (!positionedRef.current) {
        positionedRef.current = true;
        setPosition(nextPosition);
      } else if (tooltipRef.current) {
        tooltipRef.current.style.left = `${nextPosition.left}px`;
        tooltipRef.current.style.top = `${nextPosition.top}px`;
      }
    };

    const schedulePositionUpdate = () => {
      if (positionFrameRef.current !== null) return;
      positionFrameRef.current = window.requestAnimationFrame(() => {
        positionFrameRef.current = null;
        updatePosition();
      });
    };

    updatePosition();
    window.addEventListener("resize", schedulePositionUpdate);
    window.addEventListener("scroll", schedulePositionUpdate, true);
    return () => {
      window.removeEventListener("resize", schedulePositionUpdate);
      window.removeEventListener("scroll", schedulePositionUpdate, true);
      if (positionFrameRef.current !== null) {
        window.cancelAnimationFrame(positionFrameRef.current);
        positionFrameRef.current = null;
      }
    };
  }, [open, side]);

  return (
    <sandustry-tooltip side={side} class="inline-flex">
      <span
        ref={triggerRef}
        aria-describedby={open ? tooltipId : undefined}
        className="inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
        {open && typeof document !== "undefined"
          ? createPortal(
              <TooltipSurface
                {...props}
                ref={tooltipRef}
                id={tooltipId}
                className={cx(
                  "pointer-events-none fixed z-50 -translate-x-1/2",
                  side === "top" && "-translate-y-full",
                  className,
                )}
                style={{ left: position.left, top: position.top, ...props.style }}
              >
                {content}
              </TooltipSurface>,
              document.body,
            )
          : null}
      </span>
    </sandustry-tooltip>
  );
}
