import { LitElement, html, css } from "lit";

export class SandustryLockedState extends LitElement {
  static override properties = {
    boxed: { type: Boolean, reflect: true },
    title: { type: String },
    label: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    :host([boxed]) {
      position: relative;
      border-top-right-radius: 0.5rem;
      border-bottom-left-radius: 0.5rem;
      border-width: 1px;
      border-style: dashed;
      border-color: var(--sd-color-border-hover, #475569);
      padding: 1rem;
    }
  `;

  declare boxed: boolean;
  declare title: string;
  declare label: string;

  constructor() {
    super();
    this.boxed = false;
    this.title = "";
    this.label = "Coming soon";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-locked-state")) {
  customElements.define("sandustry-locked-state", SandustryLockedState);
}
