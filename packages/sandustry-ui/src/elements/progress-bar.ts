import { LitElement, html, css } from "lit";

export type ProgressBarTone = "accent" | "success" | "info" | "warning" | "danger";

export class SandustryProgressBar extends LitElement {
  static override properties = {
    value: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    tone: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare value: number;
  declare max: number;
  declare tone: ProgressBarTone;

  constructor() {
    super();
    this.value = 0;
    this.max = 100;
    this.tone = "accent";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-progress-bar")) {
  customElements.define("sandustry-progress-bar", SandustryProgressBar);
}
