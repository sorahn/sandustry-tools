import { LitElement, html, css } from "lit";

export type KeycapVariant = "keycap" | "bracket" | "outline";
export type KeycapSize = "sm" | "md" | "lg";

export class SandustryKeycap extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      user-select: none;
      box-sizing: border-box;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    :host([variant="bracket"]) {
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--sd-color-primary, #ffe700);
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
    }
    :host([variant="bracket"][size="sm"]) {
      font-size: 10px;
    }
    :host([variant="bracket"][size="md"]),
    :host([variant="bracket"]:not([size])) {
      font-size: 0.75rem;
    }
    :host([variant="bracket"][size="lg"]) {
      font-size: 0.875rem;
    }

    :host([variant="outline"]) {
      align-items: center;
      justify-content: center;
      border-radius: 0.25rem;
      border: 1px solid var(--sd-color-primary-glow, rgba(253, 224, 71, 0.4));
      background-color: var(--sd-color-primary-soft, rgba(253, 224, 71, 0.1));
      font-weight: 700;
      color: var(--sd-color-primary, #ffe700);
    }
    :host([variant="outline"][size="sm"]) {
      height: 1.25rem;
      min-width: 1.25rem;
      padding: 0 0.25rem;
      font-size: 10px;
    }
    :host([variant="outline"][size="md"]),
    :host([variant="outline"]:not([size])) {
      height: 1.5rem;
      min-width: 1.5rem;
      padding: 0 0.375rem;
      font-size: 0.75rem;
    }
    :host([variant="outline"][size="lg"]) {
      height: 1.75rem;
      min-width: 1.75rem;
      padding: 0 0.5rem;
      font-size: 0.875rem;
    }

    :host([variant="keycap"]),
    :host(:not([variant])) {
      align-items: center;
      justify-content: center;
      border-radius: 0.25rem;
      border: 1px solid var(--sd-color-border-hover, #444444);
      font-weight: 700;
      color: var(--sd-color-primary, #ffe700);
      background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
      box-shadow:
        0 2px 0 #111,
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    :host([variant="keycap"][size="sm"]) {
      height: 1.25rem;
      min-width: 1.25rem;
      padding: 0 0.25rem;
      font-size: 10px;
    }
    :host([variant="keycap"][size="md"]),
    :host([variant="keycap"]:not([size])) {
      height: 1.75rem;
      min-width: 1.75rem;
      padding: 0 0.5rem;
      font-size: 0.75rem;
    }
    :host([variant="keycap"][size="lg"]) {
      height: 2rem;
      min-width: 2rem;
      padding: 0 0.625rem;
      font-size: 0.875rem;
    }
  `;

  declare variant: KeycapVariant;
  declare size: KeycapSize;

  constructor() {
    super();
    this.variant = "keycap";
    this.size = "md";
  }

  override render() {
    if (this.variant === "bracket") {
      return html`[<slot></slot>]`;
    }
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-keycap")) {
  customElements.define("sandustry-keycap", SandustryKeycap);
}
