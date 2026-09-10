import { LitElement, html, css } from "lit";
import type { ControlSize } from "../types";

export type SpinnerTone = "accent" | "yellow" | "neutral" | "white";

export class SandustrySpinner extends LitElement {
  static override properties = {
    size: { type: String, reflect: true },
    tone: { type: String, reflect: true },
    label: { type: String },
  };

  static override styles = css`
    :host {
      display: inline-block;
      flex-shrink: 0;
      border-radius: 9999px;
      border-style: solid;
      border-top-color: transparent !important;
      animation: spin 1s linear infinite;
      box-sizing: border-box;
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    :host([size="small"]) {
      width: 0.875rem;
      height: 0.875rem;
      border-width: 2px;
    }

    :host([size="default"]),
    :host(:not([size])) {
      width: 1.25rem;
      height: 1.25rem;
      border-width: 2px;
    }

    :host([size="large"]) {
      width: 2rem;
      height: 2rem;
      border-width: 3px;
    }

    :host([tone="accent"]),
    :host([tone="yellow"]),
    :host(:not([tone])) {
      border-color: var(--sd-color-primary, #facc15);
    }

    :host([tone="neutral"]) {
      border-color: var(--sd-color-text-muted, #94a3b8);
    }

    :host([tone="white"]) {
      border-color: var(--sd-color-text, #ffffff);
    }
  `;

  declare size: ControlSize;
  declare tone: SpinnerTone;
  declare label: string;

  constructor() {
    super();
    this.size = "default";
    this.tone = "accent";
    this.label = "Loading…";
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "status");
    }
    if (!this.hasAttribute("aria-label")) {
      this.setAttribute("aria-label", this.label);
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-spinner")) {
  customElements.define("sandustry-spinner", SandustrySpinner);
}
