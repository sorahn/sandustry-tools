import { LitElement, css, html } from "lit";

export type ResizablePanelPosition = "start" | "end";

export interface ResizablePanelSizeChangeDetail {
  size: number;
  collapsed: boolean;
}

export interface ResizablePanelCollapseChangeDetail {
  collapsed: boolean;
  size: number;
}

export class SandustryResizablePanel extends LitElement {
  static override properties = {
    sidebarPosition: { type: String, attribute: "sidebar-position", reflect: true },
    size: { type: Number, reflect: true },
    minSize: { type: Number, attribute: "min-size", reflect: true },
    maxSize: { type: Number, attribute: "max-size", reflect: true },
    step: { type: Number, reflect: true },
    collapsible: { type: Boolean, reflect: true },
    collapsed: { type: Boolean, reflect: true },
    collapseSize: { type: Number, attribute: "collapse-size", reflect: true },
    responsive: { type: Boolean, reflect: true },
    stackBreakpoint: { type: Number, attribute: "stack-breakpoint", reflect: true },
    stacked: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    .layout {
      display: flex;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
    }

    ::slotted([slot="sidebar"]) {
      display: flex;
      flex: 0 0 var(--sd-resizable-panel-size, 260px);
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      box-sizing: border-box;
    }

    ::slotted(main) {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }

    .divider {
      position: relative;
      z-index: 1;
      display: flex;
      flex: 0 0 9px;
      align-items: center;
      justify-content: center;
      width: 9px;
      min-width: 9px;
      margin: 0 -4px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--sd-color-border-strong, #64748b);
      cursor: col-resize;
      touch-action: none;
    }

    .divider::before {
      content: "";
      display: block;
      width: 1px;
      height: 100%;
      background: currentColor;
      opacity: 0.75;
      transition:
        width 120ms ease,
        background-color 120ms ease;
    }

    .divider:hover,
    .divider:focus-visible {
      color: var(--sd-color-primary, #ffe700);
    }

    .divider:focus-visible {
      outline: 2px solid var(--sd-color-primary, #ffe700);
      outline-offset: -1px;
    }

    .divider:hover::before,
    .divider:focus-visible::before {
      width: 3px;
    }

    :host([collapsed]) ::slotted([slot="sidebar"]) {
      pointer-events: none;
      visibility: hidden;
    }

    :host([stacked]) .layout {
      flex-direction: column;
    }

    :host([stacked]) ::slotted([slot="sidebar"]) {
      flex-basis: var(--sd-resizable-panel-size, 260px);
      width: 100%;
    }

    :host([stacked]) .divider {
      width: 100%;
      min-width: 0;
      height: 9px;
      min-height: 9px;
      margin: -4px 0;
      cursor: row-resize;
    }

    :host([stacked]) .divider::before {
      width: 100%;
      height: 1px;
    }

    :host([stacked]) .divider:hover::before,
    :host([stacked]) .divider:focus-visible::before {
      width: 100%;
      height: 3px;
    }

    @media (prefers-reduced-motion: reduce) {
      .divider::before {
        transition: none;
      }
    }
  `;

  declare sidebarPosition: ResizablePanelPosition;
  declare size: number;
  declare minSize: number;
  declare maxSize: number;
  declare step: number;
  declare collapsible: boolean;
  declare collapsed: boolean;
  declare collapseSize: number;
  declare responsive: boolean;
  declare stackBreakpoint: number;
  declare stacked: boolean;

  private resizeObserver?: ResizeObserver;
  private lastExpandedSize: number;
  private liveSize?: number;
  private pointerStart?: { coordinate: number; size: number; pointerId: number };

  constructor() {
    super();
    this.sidebarPosition = "start";
    this.size = 260;
    this.minSize = 180;
    this.maxSize = 480;
    this.step = 16;
    this.collapsible = false;
    this.collapsed = false;
    this.collapseSize = 0;
    this.responsive = true;
    this.stackBreakpoint = 720;
    this.stacked = false;
    this.lastExpandedSize = this.size;
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
    this.updateStackedState();
    this.syncSidebarSize();
  }

  override updated(changed: Map<PropertyKey, unknown>) {
    if (
      changed.has("size") ||
      changed.has("minSize") ||
      changed.has("maxSize") ||
      changed.has("collapsed") ||
      changed.has("collapseSize") ||
      changed.has("stacked")
    ) {
      this.syncSidebarSize();
    }
    if (changed.has("responsive") || changed.has("stackBreakpoint")) {
      this.updateStackedState();
    }
  }

  private get sidebarElement(): HTMLElement | undefined {
    return this.renderRoot
      .querySelector<HTMLSlotElement>('slot[name="sidebar"]')
      ?.assignedElements({ flatten: true })
      .find((element): element is HTMLElement => element instanceof HTMLElement);
  }

  private get dividerElement(): HTMLElement | undefined {
    return this.renderRoot.querySelector<HTMLElement>(".divider") ?? undefined;
  }

  private clampSize(size: number) {
    const minSize = Math.min(this.minSize, this.maxSize);
    const maxSize = Math.max(this.minSize, this.maxSize);
    return Math.min(Math.max(size, minSize), maxSize);
  }

  private currentSize() {
    return this.liveSize ?? this.clampSize(this.size);
  }

  private effectiveSize(size = this.currentSize()) {
    return this.collapsed ? Math.max(0, this.collapseSize) : size;
  }

  private syncSidebarSize() {
    const sidebar = this.sidebarElement;
    if (!sidebar) return;

    const size = this.effectiveSize();
    sidebar.style.setProperty("--sd-resizable-panel-size", `${size}px`);
    sidebar.style.inlineSize = this.stacked ? "" : `${size}px`;
    sidebar.style.blockSize = this.stacked ? `${size}px` : "";
    this.updateDividerValue(size);
  }

  private updateDividerValue(size = this.effectiveSize()) {
    this.dividerElement?.setAttribute("aria-valuenow", String(size));
  }

  private updateStackedState() {
    const shouldStack =
      this.responsive && this.clientWidth > 0 && this.clientWidth < this.stackBreakpoint;
    if (shouldStack !== this.stacked) this.stacked = shouldStack;
  }

  private dispatchSizeChange(size = this.effectiveSize()) {
    this.dispatchEvent(
      new CustomEvent<ResizablePanelSizeChangeDetail>("sd-size-change", {
        bubbles: true,
        composed: true,
        detail: { size, collapsed: this.collapsed },
      }),
    );
  }

  private dispatchCollapseChange() {
    this.dispatchEvent(
      new CustomEvent<ResizablePanelCollapseChangeDetail>("sd-collapse-change", {
        bubbles: true,
        composed: true,
        detail: { collapsed: this.collapsed, size: this.effectiveSize() },
      }),
    );
  }

  private setPanelSize(size: number) {
    this.liveSize = undefined;
    const nextSize = this.clampSize(size);
    if (this.collapsed) this.collapsed = false;
    this.lastExpandedSize = nextSize;
    if (nextSize === this.size && !this.collapsed) return;
    this.size = nextSize;
    this.dispatchSizeChange();
  }

  private setLivePanelSize(size: number) {
    const nextSize = this.clampSize(size);
    if (nextSize === this.currentSize()) return;

    this.liveSize = nextSize;
    this.lastExpandedSize = nextSize;
    this.syncSidebarSize();
  }

  private commitLivePanelSize() {
    if (this.liveSize === undefined) return;

    const nextSize = this.liveSize;
    this.liveSize = undefined;
    if (nextSize === this.clampSize(this.size)) return;

    this.size = nextSize;
    this.dispatchSizeChange(nextSize);
  }

  private setCollapsed(collapsed: boolean) {
    if (!this.collapsible || collapsed === this.collapsed) return;

    if (collapsed) {
      this.lastExpandedSize = this.clampSize(this.size);
      this.collapsed = true;
    } else {
      this.collapsed = false;
      this.size = this.clampSize(this.lastExpandedSize);
    }

    this.dispatchCollapseChange();
    this.dispatchSizeChange();
  }

  private toggleCollapsed() {
    this.setCollapsed(!this.collapsed);
  }

  private adjustSize(delta: number) {
    if (this.collapsed) {
      this.setCollapsed(false);
      return;
    }
    this.setPanelSize(this.currentSize() + delta);
  }

  private handleKeyDown(event: KeyboardEvent) {
    const isVertical = this.stacked;
    const positiveKey = isVertical
      ? this.sidebarPosition === "start"
        ? "ArrowDown"
        : "ArrowUp"
      : this.sidebarPosition === "start"
        ? "ArrowRight"
        : "ArrowLeft";
    const negativeKey = isVertical
      ? this.sidebarPosition === "start"
        ? "ArrowUp"
        : "ArrowDown"
      : this.sidebarPosition === "start"
        ? "ArrowLeft"
        : "ArrowRight";

    if (event.key === positiveKey) {
      event.preventDefault();
      this.adjustSize(this.step);
    } else if (event.key === negativeKey) {
      event.preventDefault();
      this.adjustSize(-this.step);
    } else if (event.key === "Home") {
      event.preventDefault();
      this.setPanelSize(this.minSize);
    } else if (event.key === "End") {
      event.preventDefault();
      this.setPanelSize(this.maxSize);
    } else if (this.collapsible && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      this.toggleCollapsed();
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (this.collapsed) return;

    const coordinate = this.stacked ? event.clientY : event.clientX;
    this.pointerStart = { coordinate, size: this.currentSize(), pointerId: event.pointerId };
    this.dividerElement?.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  private handlePointerMove(event: PointerEvent) {
    if (!this.pointerStart || event.pointerId !== this.pointerStart.pointerId) return;

    const coordinate = this.stacked ? event.clientY : event.clientX;
    const direction = this.sidebarPosition === "start" ? 1 : -1;
    this.setLivePanelSize(
      this.pointerStart.size + (coordinate - this.pointerStart.coordinate) * direction,
    );
  }

  private handlePointerEnd(event: PointerEvent) {
    if (event.pointerId !== this.pointerStart?.pointerId) return;
    this.pointerStart = undefined;
    this.commitLivePanelSize();
  }

  private handleSlotChange() {
    this.syncSidebarSize();
  }

  override render() {
    const sidebar = html`<slot name="sidebar" @slotchange=${this.handleSlotChange}></slot>`;
    const content = html`<slot></slot>`;
    const divider = html`
      <div
        class="divider"
        role="separator"
        tabindex="0"
        aria-orientation=${this.stacked ? "horizontal" : "vertical"}
        aria-valuemin=${this.minSize}
        aria-valuemax=${this.maxSize}
        aria-valuenow=${this.effectiveSize()}
        aria-expanded=${this.collapsible ? String(!this.collapsed) : "true"}
        aria-label="Resize panel"
        @keydown=${this.handleKeyDown}
        @pointerdown=${this.handlePointerDown}
        @pointermove=${this.handlePointerMove}
        @pointerup=${this.handlePointerEnd}
        @pointercancel=${this.handlePointerEnd}
        @dblclick=${this.toggleCollapsed}
      ></div>
    `;

    return html`
      <div class="layout">
        ${this.sidebarPosition === "start" ? sidebar : content} ${divider}
        ${this.sidebarPosition === "start" ? content : sidebar}
      </div>
    `;
  }
}

if (!customElements.get("sandustry-resizable-panel")) {
  customElements.define("sandustry-resizable-panel", SandustryResizablePanel);
}
