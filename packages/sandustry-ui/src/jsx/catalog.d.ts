import type { SDElementProps } from "./shared";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sandustry-resource-amount": SDElementProps<{
        type?: string;
        amount?: string | number;
        size?: string;
      }>;
      "sandustry-currency-row": SDElementProps<{
        size?: string;
      }>;
      "sandustry-hotbar": SDElementProps<{
        selectedId?: string;
        "selected-id"?: string;
      }>;
      "sandustry-hotbar-stepper": SDElementProps;
    }
  }
}
