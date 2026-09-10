import { LitElement, html, css } from "lit";

export type StatusIndicatorTone = "neutral" | "online" | "warning" | "danger";

export class SandustryStatusIndicator extends LitElement {
  static override properties = {
    tone: { type: String, reflect: true },
    label: { type: String },
    value: { type: String },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      line-height: 1rem;
      color: rgba(255, 255, 255, 0.7);
      font-family: var(--sd-font-family, inherit);
    }

    .indicator {
      display: inline-block;
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 9999px;
      border-width: 1px;
      border-style: solid;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .indicator--neutral {
      border-color: #64748b;
      background-color: #94a3b8;
    }

    .indicator--online {
      border-color: #16a34a;
      background-color: #22c55e;
    }

    .indicator--warning {
      border-color: #f59e0b;
      background-color: #fbbf24;
    }

    .indicator--danger {
      border-color: #dc2626;
      background-color: #ef4444;
    }

    .tabular {
      font-variant-numeric: tabular-nums;
    }
  `;

  declare tone: StatusIndicatorTone;
  declare label?: string;
  declare value?: string;

  constructor() {
    super();
    this.tone = "neutral";
  }

  override render() {
    return html`
      <slot name="indicator">
        <span class="indicator indicator--${this.tone}" aria-hidden="true" part="indicator"></span>
      </slot>
      <slot name="label">${this.label ? html`<span part="label">${this.label}</span>` : ""}</slot>
      <slot name="value"
        >${this.value !== undefined && this.value !== null ? html`<span class="tabular" part="value">${this.value}</span>` : ""}</slot
      >
      <slot></slot>
    `;
  }
}

if (!customElements.get("sandustry-status-indicator")) {
  customElements.define("sandustry-status-indicator", SandustryStatusIndicator);
}
