import type { SDButtonProps, SDElementProps, SDSelectProps } from "./shared";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sandustry-button": SDButtonProps<{
        variant?: string;
        size?: string;
        noShift?: string | boolean;
        "no-shift"?: string | boolean;
        href?: string;
        target?: string;
      }>;
      "sandustry-icon-button": SDButtonProps<{
        label?: string;
        size?: string;
      }>;
      "sandustry-text-action": SDButtonProps<{
        href?: string;
      }>;
      "sandustry-text-input": SDElementProps<{
        tone?: string;
        monospace?: string | boolean;
        scale?: string;
        placeholder?: string;
        value?: string;
      }>;
      "sandustry-text-area": SDElementProps<{
        placeholder?: string;
        value?: string;
      }>;
      "sandustry-search-input": SDElementProps<{
        scale?: string;
        placeholder?: string;
        value?: string;
      }>;
      "sandustry-checkbox": SDElementProps<{
        boxed?: string | boolean;
        size?: string;
        label?: string;
        checked?: boolean;
      }>;
      "sandustry-switch": SDElementProps<{
        label?: string;
        size?: string;
        checked?: boolean;
      }>;
      "sandustry-slider": SDElementProps<{
        label?: string;
        showValue?: boolean | string;
        "show-value"?: boolean | string;
        size?: string;
        min?: number;
        max?: number;
        step?: number;
        value?: number;
      }>;
      "sandustry-segmented-control": SDElementProps<{
        size?: string;
        value?: string;
      }>;
      "sandustry-select": SDSelectProps<{
        scale?: string;
      }>;
    }
  }
}
