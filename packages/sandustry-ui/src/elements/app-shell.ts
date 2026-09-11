import { LitElement, css, html } from "lit";

export type AppShellSidebarPosition = "start" | "end";

export class SandustryAppShell extends LitElement {
  static override properties = {
    sidebarPosition: { type: String, attribute: "sidebar-position", reflect: true },
    responsive: { type: Boolean, reflect: true },
    stackBreakpoint: { type: Number, attribute: "stack-breakpoint", reflect: true },
    stacked: { type: Boolean, reflect: true },
    hasTopbar: { type: Boolean, attribute: "has-topbar", reflect: true },
    hasSidebar: { type: Boolean, attribute: "has-sidebar", reflect: true },
    hasFooter: { type: Boolean, attribute: "has-footer", reflect: true },
    hasOverlays: { type: Boolean, attribute: "has-overlays", reflect: true },
    sidebarLabel: { type: String, attribute: "sidebar-label" },
    mainLabel: { type: String, attribute: "main-label" },
  };

  static override styles = css`
    :host {
      position: relative;
      display: grid;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      grid-template-rows: auto minmax(0, 1fr) auto;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    .topbar,
    .footer {
      min-width: 0;
    }

    .body {
      display: flex;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .sidebar {
      display: flex;
      flex: 0 0 var(--sd-shell-sidebar-size, 260px);
      flex-direction: column;
      align-self: stretch;
      min-width: 0;
      min-height: 0;
      height: 100%;
      overflow: hidden;
      box-sizing: border-box;
    }

    .main {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .overlay {
      position: absolute;
      z-index: 20;
      inset: 0;
      pointer-events: none;
    }

    ::slotted([slot="topbar"]),
    ::slotted([slot="sidebar"]),
    ::slotted([slot="footer"]),
    ::slotted([slot="overlays"]) {
      box-sizing: border-box;
    }

    ::slotted([slot="topbar"]),
    ::slotted([slot="footer"]) {
      width: 100%;
    }

    ::slotted([slot="sidebar"]) {
      display: flex;
      flex: 1 1 auto;
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow: auto;
    }

    ::slotted([slot="overlays"]) {
      pointer-events: auto;
    }

    :host(:not([has-topbar])) .topbar,
    :host(:not([has-sidebar])) .sidebar,
    :host(:not([has-footer])) .footer,
    :host(:not([has-overlays])) .overlay {
      display: none;
    }

    :host([stacked]) .body,
    :host([stacked][sidebar-position="end"]) .body {
      flex-direction: column;
    }

    :host([stacked]) .sidebar {
      flex: 0 0 auto;
      width: 100%;
      height: auto;
      max-height: 45%;
    }

    :host([stacked]) ::slotted([slot="sidebar"]) {
      flex: 1 1 auto;
      height: auto;
      max-height: 100%;
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        scroll-behavior: auto;
      }
    }
  `;

  declare sidebarPosition: AppShellSidebarPosition;
  declare responsive: boolean;
  declare stackBreakpoint: number;
  declare stacked: boolean;
  declare hasTopbar: boolean;
  declare hasSidebar: boolean;
  declare hasFooter: boolean;
  declare hasOverlays: boolean;
  declare sidebarLabel: string;
  declare mainLabel: string;

  private resizeObserver?: ResizeObserver;

  constructor() {
    super();
    this.sidebarPosition = "start";
    this.responsive = true;
    this.stackBreakpoint = 760;
    this.stacked = false;
    this.hasTopbar = false;
    this.hasSidebar = false;
    this.hasFooter = false;
    this.hasOverlays = false;
    this.sidebarLabel = "Navigation";
    this.mainLabel = "Main content";
  }

  override connectedCallback() {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(() => this.updateStackedState());
    this.resizeObserver.observe(this);
  }

  override disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    super.disconnectedCallback();
  }

  override firstUpdated() {
    this.updateSlotPresence();
    this.updateStackedState();
  }

  override updated(changed: Map<PropertyKey, unknown>) {
    if (changed.has("responsive") || changed.has("stackBreakpoint")) {
      this.updateStackedState();
    }
  }

  private updateStackedState() {
    const shouldStack =
      this.responsive && this.clientWidth > 0 && this.clientWidth < this.stackBreakpoint;
    if (shouldStack !== this.stacked) this.stacked = shouldStack;
  }

  private updateSlotPresence() {
    const slots = this.renderRoot.querySelectorAll<HTMLSlotElement>("slot");
    for (const slot of slots) {
      const present = slot.assignedElements({ flatten: true }).length > 0;
      if (slot.name === "topbar") this.hasTopbar = present;
      if (slot.name === "sidebar") this.hasSidebar = present;
      if (slot.name === "footer") this.hasFooter = present;
      if (slot.name === "overlays") this.hasOverlays = present;
    }
  }

  private handleSlotChange() {
    this.updateSlotPresence();
  }

  override render() {
    const topbar = html`<header class="topbar" part="topbar">
      <slot name="topbar" @slotchange=${this.handleSlotChange}></slot>
    </header>`;
    const sidebar = html`<aside class="sidebar" part="sidebar" aria-label=${this.sidebarLabel}>
      <slot name="sidebar" @slotchange=${this.handleSlotChange}></slot>
    </aside>`;
    const main = html`<main class="main" part="main" aria-label=${this.mainLabel}>
      <slot></slot>
    </main>`;
    const footer = html`<footer class="footer" part="footer">
      <slot name="footer" @slotchange=${this.handleSlotChange}></slot>
    </footer>`;
    const overlays = html`<div class="overlay" part="overlays">
      <slot name="overlays" @slotchange=${this.handleSlotChange}></slot>
    </div>`;

    return html`${topbar}
      <div class="body">
        ${this.sidebarPosition === "start" ? sidebar : main}${
          this.sidebarPosition === "start" ? main : sidebar
        }
      </div>
      ${footer}${overlays}`;
  }
}

if (!customElements.get("sandustry-app-shell")) {
  customElements.define("sandustry-app-shell", SandustryAppShell);
}
