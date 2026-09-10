import type { ButtonHTMLAttributes, ReactNode } from "react";
import cx from "clsx";
import type { ControlSize } from "../types";
import "../elements/segmented-control";

export type Segment<T extends string = string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps<T extends string = string> = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "value"
> & {
  options: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: ControlSize;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "default",
  className = "",
  ...props
}: SegmentedControlProps<T>) {
  return (
    <sandustry-segmented-control
      size={size}
      value={value}
      class={cx("flex flex-wrap gap-1", className)}
      role="group"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            {...props}
            key={option.value}
            type="button"
            disabled={option.disabled || props.disabled}
            aria-pressed={selected}
            className={cx(
              "rounded-tr-lg rounded-bl-lg border border-[var(--sd-color-border,#2e2e2e)] px-3 text-xs transition-colors",
              size === "small" && "h-[var(--sd-form-control-small-height)] py-1 text-[11px]",
              size === "default" && "h-[var(--sd-form-control-height)] py-1 text-xs",
              size === "large" && "h-[var(--sd-form-control-large-height)] py-2 text-sm",
              selected
                ? "border-[var(--sd-color-primary,#ffe700)]/50 bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.1))] text-[var(--sd-color-primary,#ffe700)]"
                : "border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.4))] text-[var(--sd-color-text-muted,#b6bcc1)] hover:border-[var(--sd-color-border-hover,#4a4a4a)] hover:text-[var(--sd-color-text,#e8eef5)]",
              (option.disabled || props.disabled) &&
                "cursor-not-allowed border-[var(--sd-color-border-subtle,#242424)]/50 bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.2))] text-[var(--sd-color-text-subtle,#808080)] hover:text-[var(--sd-color-text-subtle,#808080)]",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </sandustry-segmented-control>
  );
}
