import { useState, type HTMLAttributes, type ReactNode } from "react";
import cx from "clsx";

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

const checkerboardStyle = {
  backgroundImage:
    "linear-gradient(45deg, rgb(68, 68, 68) 25%, transparent 25%), linear-gradient(-45deg, rgb(68, 68, 68) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgb(68, 68, 68) 75%), linear-gradient(-45deg, transparent 75%, rgb(68, 68, 68) 75%)",
  backgroundSize: "8px 8px",
  backgroundPosition: "0px 0px, 0px 4px, 4px -4px, -4px 0px",
};

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
    <div
      role="dialog"
      aria-label={typeof title === "string" ? title : "Color picker"}
      className={cx(
        "w-[242px] rounded border border-slate-700 bg-black/90 p-2 shadow-xl backdrop-blur-sm",
        "flex flex-col gap-2 select-none",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close color picker"
            className="p-1 text-slate-500 transition-colors hover:text-white"
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
            "-mx-1 flex items-center gap-2 rounded p-1 text-left transition-colors hover:bg-slate-800",
            isDefaultSelected && "bg-slate-800/80",
          )}
        >
          <div
            className={cx(
              "h-5 w-5 rounded-sm border transition-all",
              isDefaultSelected ? "border-white shadow-[0_0_4px_#ffffff]" : "border-slate-500",
            )}
            style={checkerboardStyle}
          />
          <span
            className={cx(
              "text-[10px] text-slate-300",
              isDefaultSelected ? "font-bold text-white" : "font-normal",
            )}
          >
            Default
          </span>
        </button>
      ) : null}

      {/* 8-Column Swatches Grid */}
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
                "aspect-square w-full rounded-sm border transition-transform",
                isSelected
                  ? "z-10 scale-105 border-white shadow-[0_0_5px_#ffffff]"
                  : "border-white/10 hover:scale-110 hover:border-white/50",
              )}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>

      {/* Custom Color Input */}
      {showCustom ? (
        <div className="flex items-center gap-2 border-t border-slate-700 pt-2">
          <span className="text-[10px] text-slate-400">Custom:</span>
          <div
            className="relative flex h-6 flex-grow items-center justify-center overflow-hidden rounded border border-slate-600 transition-colors hover:border-slate-500"
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
            <span className="pointer-events-none font-mono text-[10px] text-white opacity-90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {value && !isDefaultSelected ? value.toUpperCase() : "None"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
