import { useId, useLayoutEffect, useRef, useState } from "react";
import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { createPortal } from "react-dom";
import cx from "clsx";

export type TooltipProps = PropsWithChildren<Omit<HTMLAttributes<HTMLDivElement>, "content">> & {
  content: ReactNode;
  side?: "top" | "bottom";
};

export type TooltipSurfaceProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function TooltipSurface({ children, className = "", ...props }: TooltipSurfaceProps) {
  return (
    <div
      {...props}
      role="tooltip"
      className={cx("w-max max-w-64 rounded bg-black/70 px-2 py-1 text-base text-white", className)}
    >
      {children}
    </div>
  );
}

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

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setPosition({
        left: rect.left + rect.width / 2,
        top: side === "top" ? rect.top - 8 : rect.bottom + 8,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, side]);

  return (
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
  );
}
