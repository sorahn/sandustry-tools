import { useId, useLayoutEffect, useRef, useState } from "react";
import type { HTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { createPortal } from "react-dom";
import cx from "clsx";

export type PopoverProps = Omit<PropsWithChildren<HTMLAttributes<HTMLDivElement>>, "content"> & {
  content: ReactNode;
  open?: boolean;
  side?: "top" | "bottom" | "left" | "right";
  onClose?: () => void;
};

export function Popover({
  content,
  open = false,
  side = "bottom",
  onClose,
  className = "",
  children,
  ...props
}: PopoverProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      let left = rect.left;
      let top = rect.bottom + 8;

      if (side === "top") {
        top = rect.top - 8;
      } else if (side === "bottom") {
        top = rect.bottom + 8;
      } else if (side === "left") {
        left = rect.left - 8;
        top = rect.top;
      } else if (side === "right") {
        left = rect.right + 8;
        top = rect.top;
      }

      // Clamp horizontally to prevent viewport overflow on narrow screens
      if (side === "top" || side === "bottom") {
        left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - 220));
      }

      setPosition({ left, top });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      onClose?.();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, side, onClose]);

  return (
    <span ref={triggerRef} className="inline-flex">
      {children}
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              {...props}
              ref={popoverRef}
              id={popoverId}
              role="dialog"
              className={cx(
                "fixed z-50 min-w-48 rounded border border-slate-700 bg-black/90 p-2 text-white shadow-xl backdrop-blur-sm",
                side === "top" && "-translate-y-full",
                side === "left" && "-translate-x-full",
                className,
              )}
              style={{ left: position.left, top: position.top, ...props.style }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
