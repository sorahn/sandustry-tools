import { LitElement, html, css } from "lit";

export type BadgeTone =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "amber"
  | "blue"
  | "purple";

export type BadgeShape = "cut" | "rounded";

export class SandustryBadge extends LitElement {
  static override properties = {
    tone: { type: String, reflect: true },
    shape: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      border-width: 1px;
      border-style: solid;
      background-color: #000000;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      line-height: 1rem;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    :host([shape="cut"]),
    :host(:not([shape])) {
      border-top-right-radius: 0.5rem;
      border-bottom-left-radius: 0.5rem;
    }

    :host([shape="rounded"]) {
      border-radius: 0.25rem;
    }

    :host([tone="default"]),
    :host(:not([tone])) {
      border-color: rgba(226, 232, 240, 0.25);
      color: #ffffff;
    }

    :host([tone="accent"]) {
      border-color: rgba(255, 231, 0, 0.5);
      background-color: rgba(255, 231, 0, 0.1);
      color: #ffe700;
    }

    :host([tone="success"]) {
      border-color: rgba(52, 211, 153, 0.5);
      color: #34d399;
    }

    :host([tone="warning"]) {
      border-color: rgba(252, 211, 77, 0.5);
      color: #fde68a;
    }

    :host([tone="danger"]) {
      border-color: rgba(248, 113, 113, 0.5);
      color: #fca5a5;
    }

    :host([tone="info"]) {
      border-color: rgba(103, 232, 249, 0.5);
      color: #67e8f9;
    }

    :host([tone="neutral"]) {
      border-color: #1e293b;
      background-color: #0f172a;
      color: #94a3b8;
    }

    :host([tone="amber"]) {
      border-color: rgba(146, 64, 14, 0.4);
      background-color: rgba(69, 26, 3, 0.6);
      color: #fcd34d;
    }

    :host([tone="blue"]) {
      border-color: rgba(30, 64, 175, 0.4);
      background-color: rgba(23, 37, 84, 0.6);
      color: #93c5fd;
    }

    :host([tone="purple"]) {
      border-color: rgba(107, 33, 168, 0.4);
      background-color: rgba(59, 7, 100, 0.6);
      color: #d8b4fe;
    }
  `;

  declare tone: BadgeTone;
  declare shape: BadgeShape;

  constructor() {
    super();
    this.tone = "default";
    this.shape = "cut";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-badge")) {
  customElements.define("sandustry-badge", SandustryBadge);
}
