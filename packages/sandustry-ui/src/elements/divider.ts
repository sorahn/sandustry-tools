import { LitElement, html, css } from "lit";

export type DividerVariant = "solid" | "accent";

export class SandustryDivider extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .line {
      height: 1px;
      width: 100%;
    }

    .line--solid {
      background-color: rgba(51, 65, 85, 0.6);
    }

    .line--accent {
      background: linear-gradient(to right, transparent, rgba(255, 231, 0, 0.4), transparent);
    }
  `;

  declare variant: DividerVariant;

  constructor() {
    super();
    this.variant = "solid";
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      this.setAttribute("role", "separator");
    }
  }

  override render() {
    return html`<div class="line line--${this.variant}" part="line"></div>`;
  }
}

if (!customElements.get("sandustry-divider")) {
  customElements.define("sandustry-divider", SandustryDivider);
}
