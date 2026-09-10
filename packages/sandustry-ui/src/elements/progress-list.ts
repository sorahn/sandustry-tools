import { LitElement, html, css } from "lit";

export type ProgressListItemVariant = "default" | "active" | "substep";

export class SandustryProgressList extends LitElement {
  static override properties = {
    height: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      position: relative;
      overflow-y: auto;
      border-radius: 0.25rem;
      border-width: 1px;
      border-style: solid;
      border-color: rgba(226, 232, 240, 0.2);
      background-color: rgba(0, 0, 0, 0.3);
      padding: 1rem 1.25rem 1rem 1rem;
      text-align: left;
      font-size: 0.875rem;
      line-height: 1.8;
      color: rgba(255, 255, 255, 0.75);
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare height: string;

  constructor() {
    super();
    this.height = "120px";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

export class SandustryProgressListItem extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
    last: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      position: relative;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare variant: ProgressListItemVariant;
  declare last: boolean;

  constructor() {
    super();
    this.variant = "default";
    this.last = false;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-progress-list")) {
  customElements.define("sandustry-progress-list", SandustryProgressList);
}

if (!customElements.get("sandustry-progress-list-item")) {
  customElements.define("sandustry-progress-list-item", SandustryProgressListItem);
}
