import type { SDElementProps } from "./shared";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sandustry-status-indicator": SDElementProps<{
        tone?: string;
        label?: string;
        value?: string;
      }>;
      "sandustry-badge": SDElementProps<{
        tone?: string;
        shape?: string;
      }>;
      "sandustry-divider": SDElementProps<{
        variant?: string;
      }>;
      "sandustry-keycap": SDElementProps<{
        variant?: string;
        size?: string;
      }>;
      "sandustry-tier-pips": SDElementProps<{
        current?: number;
        max?: number;
      }>;
      "sandustry-spinner": SDElementProps<{
        size?: string;
        tone?: string;
        label?: string;
      }>;
      "sandustry-property-tile": SDElementProps<{
        label?: string;
        value?: string;
        subValue?: string;
      }>;
      "sandustry-alert": SDElementProps<{
        tone?: string;
        title?: string;
      }>;
    }
  }
}
