import type { ButtonHTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import "../elements/hotbar";

export type HotbarSlot = {
  id: string;
  label?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

export type HotbarProps = {
  slots: readonly HotbarSlot[];
  selectedId?: string;
  onSelect?: (slot: HotbarSlot) => void;
  className?: string;
};

export function Hotbar({ slots, selectedId, onSelect, className = "" }: HotbarProps) {
  return (
    <sandustry-hotbar
      role="toolbar"
      aria-label="Hotbar"
      selected-id={selectedId}
      class={cx("flex gap-2", className)}
    >
      {slots.map((slot, index) => (
        <button
          key={slot.id}
          type="button"
          disabled={slot.disabled}
          aria-label={typeof slot.label === "string" ? slot.label : slot.id}
          aria-pressed={slot.id === selectedId}
          onClick={() => onSelect?.(slot)}
          className={cx(
            "relative flex h-16 w-16 items-center justify-center border text-[var(--sd-color-text,#ffffff)] shadow-md ring-2 ring-inset ring-[var(--sd-color-border,#334155)] transition-colors active:brightness-125 cursor-pointer",
            slot.id === selectedId
              ? "border-[var(--sd-color-primary,#ffe700)] bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.1))]"
              : "border-[var(--sd-color-border,#334155)] hover:border-[var(--sd-color-border-hover,#64748b)]",
            slot.disabled && "cursor-not-allowed opacity-40",
          )}
        >
          <span className="absolute left-0 top-0 z-10 rounded-br bg-[var(--sd-color-surface-muted,#070a0f)]/80 px-1 text-xs text-[var(--sd-color-text,#ffffff)]">
            {index + 1}
          </span>
          {slot.icon}
        </button>
      ))}
    </sandustry-hotbar>
  );
}

export type HotbarStepperProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  onChange?: (direction: "previous" | "next") => void;
};

export function HotbarStepper({ onChange, className = "", ...props }: HotbarStepperProps) {
  return (
    <sandustry-hotbar-stepper
      class={cx(
        "flex h-16 w-5 flex-col overflow-hidden rounded border border-[var(--sd-color-border,#334155)] bg-[var(--sd-color-surface-elevated,#1e293b)]/95 shadow-lg",
        className,
      )}
    >
      <button
        {...props}
        type="button"
        className="flex-1 text-[8px] text-[var(--sd-color-text-muted,#94a3b8)] transition-colors hover:bg-[var(--sd-color-surface-hover,#334155)] hover:text-[var(--sd-color-text,#ffffff)] cursor-pointer"
        onClick={() => onChange?.("previous")}
      >
        ▲
      </button>
      <button
        {...props}
        type="button"
        className="flex-1 border-t border-[var(--sd-color-border-subtle,#1e293b)] text-[8px] text-[var(--sd-color-text-muted,#94a3b8)] transition-colors hover:bg-[var(--sd-color-surface-hover,#334155)] hover:text-[var(--sd-color-text,#ffffff)] cursor-pointer"
        onClick={() => onChange?.("next")}
      >
        ▼
      </button>
    </sandustry-hotbar-stepper>
  );
}
