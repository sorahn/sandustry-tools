import { LitElement, html, css } from "lit";

export type ActionBarAlign = "start" | "end" | "between";

export class SandustryActionBar extends LitElement {
  static override properties = {
    align: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      gap: 0.75rem;
      border-top-width: 1px;
      border-top-style: solid;
      border-top-color: var(--sd-color-border-subtle, rgba(51, 65, 85, 0.4));
      padding: 0.75rem 1rem;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    :host([align="start"]) {
      justify-content: flex-start;
    }

    :host([align="end"]),
    :host(:not([align])) {
      justify-content: flex-end;
    }

    :host([align="between"]) {
      justify-content: space-between;
    }
  `;

  declare align: ActionBarAlign;

  constructor() {
    super();
    this.align = "end";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-action-bar")) {
  customElements.define("sandustry-action-bar", SandustryActionBar);
}
