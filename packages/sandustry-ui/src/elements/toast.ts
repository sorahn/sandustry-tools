import { LitElement, html, css } from "lit";

export type ToastVariant = "default" | "hint" | "danger";

export class SandustryToast extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
    title: { type: String },
  };

  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare variant: ToastVariant;
  declare title: string;

  constructor() {
    super();
    this.variant = "default";
    this.title = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

export class SandustryToastContainer extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-toast")) {
  customElements.define("sandustry-toast", SandustryToast);
}

if (!customElements.get("sandustry-toast-container")) {
  customElements.define("sandustry-toast-container", SandustryToastContainer);
}
