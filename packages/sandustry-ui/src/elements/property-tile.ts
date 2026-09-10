import { LitElement, html, css } from "lit";

export class SandustryPropertyTile extends LitElement {
  static override properties = {
    label: { type: String },
    value: { type: String },
    subValue: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      border-radius: 0.25rem;
      border: 1px solid var(--sd-color-border-subtle, rgba(30, 41, 59, 0.6));
      background-color: var(--sd-color-surface, rgba(2, 6, 23, 0.5));
      padding: 0.5rem;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    .label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      letter-spacing: 0.05em;
      color: var(--sd-color-text-subtle, #64748b);
    }

    .value {
      display: block;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: var(--sd-color-text, #e2e8f0);
      font-weight: 500;
    }

    .sub-value {
      display: block;
      color: var(--sd-color-text-subtle, #475569);
      font-size: 10px;
      margin-top: 0.125rem;
    }
  `;

  declare label?: string;
  declare value?: string;
  declare subValue?: string;

  override render() {
    return html`
      <slot name="label">
        ${this.label ? html`<span class="label" part="label">${this.label}</span>` : ""}
      </slot>
      <slot>
        ${this.value !== undefined ? html`<span class="value" part="value">${this.value}</span>` : ""}
      </slot>
      <slot name="subValue">
        ${this.subValue ? html`<span class="sub-value" part="sub-value">${this.subValue}</span>` : ""}
      </slot>
    `;
  }
}

if (!customElements.get("sandustry-property-tile")) {
  customElements.define("sandustry-property-tile", SandustryPropertyTile);
}
