import { LitElement, html, css } from "lit";

export type AlertTone = "info" | "warning" | "danger" | "accent" | "neutral";

export class SandustryAlert extends LitElement {
  static override properties = {
    tone: { type: String, reflect: true },
    title: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      border-radius: 0.25rem;
      border-width: 1px;
      border-style: solid;
      padding: 0.5rem;
      font-size: 0.75rem;
      line-height: 1.625;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    :host([tone="warning"]),
    :host(:not([tone])) {
      border-color: var(--sd-color-warning-border, rgba(180, 83, 9, 0.6));
      background-color: var(--sd-color-warning-soft, rgba(69, 26, 3, 0.3));
      color: var(--sd-color-warning, #fde68a);
    }

    :host([tone="danger"]) {
      border-color: var(--sd-color-danger-border, rgba(185, 28, 28, 0.6));
      background-color: var(--sd-color-danger-soft, rgba(69, 10, 10, 0.3));
      color: var(--sd-color-danger, #fecaca);
    }

    :host([tone="info"]) {
      border-color: var(--sd-color-info-border, rgba(29, 78, 216, 0.6));
      background-color: var(--sd-color-info-soft, rgba(23, 37, 84, 0.3));
      color: var(--sd-color-info, #bfdbfe);
    }

    :host([tone="accent"]) {
      border-color: var(--sd-color-primary-glow, rgba(234, 179, 8, 0.6));
      background-color: var(--sd-color-primary-soft, rgba(113, 63, 18, 0.3));
      color: var(--sd-color-primary, #fef08a);
    }

    :host([tone="neutral"]) {
      border-color: var(--sd-color-border-subtle, #1e293b);
      background-color: var(--sd-color-surface-elevated, rgba(15, 23, 42, 0.6));
      color: var(--sd-color-text, #cbd5e1);
    }

    .title-row {
      font-weight: 600;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
  `;

  declare tone: AlertTone;
  declare title: string;

  constructor() {
    super();
    this.tone = "warning";
    this.title = "";
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) {
      const defaultRole = this.tone === "danger" || this.tone === "warning" ? "alert" : "status";
      this.setAttribute("role", defaultRole);
    }
  }

  override render() {
    return html`
      <slot name="title">
        ${
          this.title
            ? html`
                <div class="title-row" part="title">
                  <slot name="icon"></slot>
                  <span>${this.title}</span>
                </div>
              `
            : ""
        }
      </slot>
      <slot></slot>
    `;
  }
}

if (!customElements.get("sandustry-alert")) {
  customElements.define("sandustry-alert", SandustryAlert);
}
