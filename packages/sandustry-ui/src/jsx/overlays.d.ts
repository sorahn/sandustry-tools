import type { SDButtonProps, SDElementProps } from "./shared";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sandustry-collapsible": SDElementProps<{
        open?: boolean | string;
        collapsible?: boolean | string;
        title?: string;
      }>;
      "sandustry-dialog": SDElementProps<{
        open?: boolean | string;
        title?: string;
      }>;
      "sandustry-popover": SDElementProps<{
        open?: boolean | string;
        side?: string;
      }>;
      "sandustry-tooltip": SDElementProps<{
        side?: string;
      }>;
      "sandustry-tooltip-surface": SDElementProps;
      "sandustry-toast": SDElementProps<{
        variant?: string;
        title?: string;
      }>;
      "sandustry-toast-container": SDElementProps;
      "sandustry-loading-overlay": SDElementProps<{
        busy?: boolean | string;
        visible?: boolean | string;
      }>;
      "sandustry-file-dropzone": SDElementProps<{
        dragging?: boolean | string;
        disabled?: boolean | string;
        accept?: string;
        multiple?: boolean | string;
      }>;
      "sandustry-color-picker": SDElementProps<{
        value?: string | null;
      }>;
      "sandustry-element-picker": SDElementProps<{
        value?: string;
        query?: string;
        matter?: string;
      }>;
      "sandustry-filter-overlay": SDButtonProps<{
        status?: string;
      }>;
      "sandustry-modal-footer-tip": SDElementProps;
      "sandustry-progress-bar": SDElementProps<{
        value?: number;
        max?: number;
        tone?: string;
      }>;
    }
  }
}
