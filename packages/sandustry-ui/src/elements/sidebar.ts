import { LitElement, css, html } from "lit";

export type SidebarPosition = "start" | "end";

/** A slot-based navigation region; drawer behavior remains consumer-owned. */
export class SandustrySidebar extends LitElement {
  static override properties = {
    position: { type: String, reflect: true },
    collapsed: { type: Boolean, reflect: true },
    label: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      flex: 0 0 var(--sd-sidebar-width, 260px);
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      box-sizing: border-box;
      border-color: var(--sd-color-border, #334155);
      background: var(--sd-color-surface-muted, rgba(0, 0, 0, 0.25));
      font-family: var(--sd-font-family, inherit);
      transition: flex-basis 150ms ease;
    }

    :host([position="start"]) {
      border-right: 1px solid var(--sd-color-border, #334155);
    }

    :host([position="end"]) {
      border-left: 1px solid var(--sd-color-border, #334155);
    }

    :host([collapsed]) {
      flex-basis: var(--sd-sidebar-collapsed-width, 56px);
    }

    .sidebar {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .header,
    .footer {
      flex: 0 0 auto;
      min-width: 0;
    }

    .content {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      overflow: auto;
    }

    ::slotted([slot="header"]),
    ::slotted([slot="footer"]),
    ::slotted(*) {
      min-width: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none;
      }
    }
  `;

  declare position: SidebarPosition;
  declare collapsed: boolean;
  declare label: string;

  constructor() {
    super();
    this.position = "start";
    this.collapsed = false;
    this.label = "Navigation";
  }

  override render() {
    return html`
      <nav class="sidebar" part="sidebar" aria-label=${this.label}>
        <div class="header" part="header"><slot name="header"></slot></div>
        <div class="content" part="content"><slot></slot></div>
        <div class="footer" part="footer"><slot name="footer"></slot></div>
      </nav>
    `;
  }
}

if (!customElements.get("sandustry-sidebar")) {
  customElements.define("sandustry-sidebar", SandustrySidebar);
}
