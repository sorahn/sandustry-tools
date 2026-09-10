import { useState, type HTMLAttributes, type ReactNode } from "react";
import cx from "clsx";
import "../elements/color-picker";

export const DEFAULT_PRESET_COLORS: readonly string[] = [
  "#ff0000",
  "#ff8000",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#0000ff",
  "#8000ff",
  "#ff00ff",
  "#ffffff",
  "#ffddaa",
  "#cceeef",
  "#ffb080",
  "#aaaaaa",
  "#555555",
  "#303030",
  "#000000",
];

function getContrastColor(hex: string): string {
  if (!hex || hex.length < 7) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#141414" : "#ffffff";
}

export type ColorPickerProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  value?: string | null;
  onChange?: (color: string | null) => void;
  onClose?: () => void;
  title?: ReactNode;
  showDefault?: boolean;
  showCustom?: boolean;
  swatches?: readonly string[];
};

export function ColorPicker({
  value = null,
  onChange,
  onClose,
  title = "Color",
  showDefault = true,
  showCustom = true,
  swatches = DEFAULT_PRESET_COLORS,
  className = "",
  ...props
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState<string>(value ?? "#808080");

  const isDefaultSelected = value === null || value === "";

  const handleSelect = (color: string | null) => {
    onChange?.(color);
  };

  return (
    <sandustry-color-picker
      role="dialog"
      aria-label={typeof title === "string" ? title : "Color picker"}
      value={value}
      class={cx(
        "block w-[242px] rounded border border-[var(--sd-color-border,#2e2e2e)] bg-[var(--sd-color-surface,#222222)]/95 p-2 shadow-xl backdrop-blur-sm",
        "flex flex-col gap-2 select-none",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--sd-color-border-subtle,#242424)] pb-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--sd-color-text-subtle,#808080)]">
          {title}
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close color picker"
            className="p-1 text-[var(--sd-color-text-subtle,#808080)] transition-colors hover:text-[var(--sd-color-text,#e8eef5)]"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M1 1L9 9M9 1L1 9" />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Default / Transparent Option */}
      {showDefault ? (
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={cx(
            "-mx-1 flex items-center gap-2 rounded p-1 text-left transition-colors hover:bg-[var(--sd-color-surface-hover,#333333)]",
            isDefaultSelected && "bg-[var(--sd-color-surface-elevated,#2b2b2b)]",
          )}
        >
          <div
            className={cx(
              "h-5 w-5 rounded-sm border transition-all sd-checkerboard",
              isDefaultSelected
                ? "border-[var(--sd-color-primary,#ffe700)] shadow-[0_0_4px_var(--sd-color-primary,#ffe700)]"
                : "border-[var(--sd-color-border,#2e2e2e)]",
            )}
          />
          <span
            className={cx(
              "text-[10px] text-[var(--sd-color-text-muted,#b6bcc1)]",
              isDefaultSelected ? "font-bold text-[var(--sd-color-text,#e8eef5)]" : "font-normal",
            )}
          >
            Default
          </span>
        </button>
      ) : null}

      {/* Preset Swatches Grid */}
      <div className="grid grid-cols-8 gap-1">
        {swatches.map((color) => {
          const isSelected = value?.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => handleSelect(color)}
              aria-label={color}
              className={cx(
                "aspect-square w-full rounded-sm border transition-transform hover:scale-110",
                isSelected
                  ? "border-[var(--sd-color-primary,#ffe700)] scale-105 shadow-[0_0_4px_var(--sd-color-primary,#ffe700)]"
                  : "border-black/40 hover:border-[var(--sd-color-border-hover,#4a4a4a)]",
              )}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>

      {/* Custom Color Input */}
      {showCustom ? (
        <div className="flex items-center gap-2 border-t border-[var(--sd-color-border-subtle,#242424)] pt-2">
          <span className="text-[10px] text-[var(--sd-color-text-subtle,#808080)]">Custom:</span>
          <div
            className="relative flex h-6 flex-grow items-center justify-center overflow-hidden rounded border border-[var(--sd-color-border,#2e2e2e)] transition-colors hover:border-[var(--sd-color-border-hover,#4a4a4a)]"
            style={{ backgroundColor: customColor }}
          >
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                handleSelect(e.target.value);
              }}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Custom color picker"
            />
            <span
              className="pointer-events-none font-mono text-[10px] font-medium sd-drop-shadow"
              style={{ color: getContrastColor(customColor) }}
            >
              {value && !isDefaultSelected ? value.toUpperCase() : "None"}
            </span>
          </div>
        </div>
      ) : null}
    </sandustry-color-picker>
  );
}
