interface SandustryStructureData {
  elementId?: string | null;
  elementType?: number | null;
  [key: string]: unknown;
}

interface SandustryStructure {
  x: number;
  y: number;
  trapped?: boolean;
  data?: SandustryStructureData;
}

interface SandustryElementDefinition {
  id?: string;
  nameKey?: string;
  hidden?: boolean;
  metaColor?: number;
  matterType?: number;
}

interface SandustryElementInfo {
  type?: number;
}

interface SandustryItemDefinition {
  id?: string | number;
  itemType?: number;
  nameKey?: string;
  descriptionKey?: string;
  categoryKey?: string;
  handleAction?: (state: SandustryEngineState, action?: unknown) => unknown;
  afterRender?: (state: SandustryEngineState) => unknown;
  [key: string]: unknown;
}

interface SandustryUpgradeDefinition {
  itemId: string;
  itemNameKey?: string;
  categoryId?: string;
  upgrade: {
    id: string;
    nameKey?: string;
    descriptionKey?: string;
    maxLevel: number;
    costs: number[];
    oneOff?: boolean;
  };
}

interface SandustryFocusable {
  focused: boolean;
  ref: (element: HTMLElement | null) => void;
  focus: () => void;
}

interface SandustryNavigation {
  useFocusable(options: Record<string, unknown>): SandustryFocusable;
  useFocusScope(options: Record<string, unknown>): void;
  controllerFocusClass(focused: boolean): string;
}

interface SandustryUiOverlays {
  register(slot: string, overlayId: string, render: () => unknown): void;
  unregister(slot: string, overlayId: string): void;
  update(slot: string): void;
}

interface SandustryEvents {
  on(event: string, callback: (...args: unknown[]) => void): void;
}

interface SandustrySettings {
  get<T = unknown>(key: string, secondaryKey?: string): T;
  getAll(): Record<string, unknown>;
  onChange(modIdOrCallback: string | (() => void), callback?: () => void): void;
}

interface SandustryStructureBuildMode {
  type: string;
  directions?: string[];
}

interface SandustryStructureVariant {
  id: string | number;
  angles: number[];
}

interface SandustryStructureRender {
  imageName?: string;
  size?: { width: number; height: number };
  offset?: { x: number; y: number };
}

interface SandustryStructureDefinition {
  id: string;
  nameKey?: string;
  descriptionKey?: string;
  categoryKey?: string;
  order?: number;
  buildModes?: SandustryStructureBuildMode[];
  shape?: number[][];
  variants?: SandustryStructureVariant[];
  render?: SandustryStructureRender;
}

interface SandustryInputBindingHandlers {
  down?: () => void;
  up?: () => void;
}

interface SandustryInputBindingDefinition {
  displayName: string;
  category: string;
  handlers: SandustryInputBindingHandlers;
}

interface SandustryBlueprintRecord {
  type: string | number;
  x: number;
  y: number;
  filter?: Record<string, unknown>;
  data?: unknown;
}

interface SandustryPlayerAction {
  type: number;
  id: string | number;
}

interface SandustryHotbarSlot {
  id: string | number;
  type: number;
  [key: string]: unknown;
}

interface SandustryHotbarState {
  activeSlotIndex: number | null;
  hotbarIndex: number;
  bars: Array<Array<SandustryHotbarSlot | null>>;
  [key: string]: unknown;
}

interface SandustryInventoryItem {
  id: string | number;
  itemType: number;
  [key: string]: unknown;
}

interface SandustryPlayerState {
  inventory: SandustryInventoryItem[];
  action: SandustryPlayerAction | null;
  hotbar: SandustryHotbarState;
  [key: string]: unknown;
}

interface SandustrySessionAction {
  point: { x: number; y: number };
  state: Record<string, boolean>;
  customData: unknown;
  [key: string]: unknown;
}

interface SandustrySavedBlueprint {
  id: string;
  name: string;
  timestamp?: number;
  data: SandustryBlueprintRecord[];
  signalLinks?: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    on: boolean;
  }> | null;
}

/**
 * Observed on the running bundle through sandkit.engine.api. This is not part
 * of the public mod API surface and may change between game builds.
 */
interface SandustryInternalBlueprintApi {
  save(...args: unknown[]): unknown;
  load(id: string): SandustrySavedBlueprint | null;
  delete(id: string): unknown;
  getAll(): SandustrySavedBlueprint[];
  exportString(id: string): string;
  importString(value: string): unknown;
  exportAllString(): string;
}

/** Observed on the running bundle; not a supported public mod API. */
interface SandustryInternalClipboardApi {
  get(): unknown;
  getSignalLinks(): unknown;
  set(...args: unknown[]): unknown;
  clear(): unknown;
  getHistory(): unknown[];
  selectFromHistory(...args: unknown[]): unknown;
  activate(...args: unknown[]): unknown;
}

/** Observed on the running bundle; not a supported public mod API. */
interface SandustryInternalPrefabulatorApi {
  serializeBlueprintStructures(structures: SandustryBlueprintRecord[]): unknown;
  localizeBlueprintStructures(structures: SandustryBlueprintRecord[]): SandustryBlueprintRecord[];
}

interface SandustryEngineApi {
  [namespace: string]: unknown;
  blueprints?: SandustryInternalBlueprintApi;
  clipboard?: SandustryInternalClipboardApi;
  prefabulator?: SandustryInternalPrefabulatorApi;
}

interface SandustryPropagationOptions {
  propagateToWorkers?: boolean;
}

interface SandustryApi {
  elements: {
    getDefinitionByType(type: number | null | undefined): SandustryElementDefinition | null;
    getRegisteredTypes(): number[];
    getTypeFromId(id: string | null | undefined): number | null;
    createAtCellWhenIdle(x: number, y: number, type: number): void;
    getInfoAtCell(x: number, y: number): SandustryElementInfo | null;
    getResolvedTypeAtCell(x: number, y: number): number | null;
    removeAtCellWhenIdle(x: number, y: number): void;
  };
  effects: {
    createLaserAtWorld(
      startWorldX: number,
      startWorldY: number,
      endWorldX: number,
      endWorldY: number,
      options?: Record<string, unknown>,
    ): unknown;
    createLightAtWorld(
      worldX: number,
      worldY: number,
      options?: Record<string, unknown>,
    ): { index: number | null };
    createParticlesAtWorld(worldX: number, worldY: number, options?: Record<string, unknown>): void;
  };
  energy: { consume(amount: number, options?: { allOrNothing?: boolean }): number };
  authorization: { canUseTool(player: SandustryPlayerState, isFlamethrower?: boolean): boolean };
  patterns: {
    createCircle(size: number): number[][];
    excavateAtCell(
      cellX: number,
      cellY: number,
      pattern: number[][],
      outVelocity: { x: number; y: number },
      power: number,
      options?: Record<string, unknown>,
    ): void;
  };
  excavation: {
    registerProfile(
      id: string,
      definition: { pattern: number[][]; power: number; options?: Record<string, unknown> },
    ): void;
  };
  events: SandustryEvents;
  hooks: {
    modify(
      hookId: string,
      callback: (...args: any[]) => any,
      options?: Record<string, unknown>,
    ): () => void;
    intercept?(
      hookId: string,
      callback: (...args: any[]) => any,
      options?: Record<string, unknown>,
    ): () => void;
  };
  grid: {
    forEachCellInRect(
      x: number,
      y: number,
      width: number,
      height: number,
      callback: (cellX: number, cellY: number) => void,
    ): void;
  };
  i18n: {
    register(locale: string, translations: Record<string, string>): void;
    getName(definition: SandustryElementDefinition): string;
  };
  items: {
    register(definition: SandustryItemDefinition): void;
    updateDefinition(id: string | number, partial: Record<string, unknown>): void;
    getDefinitionById(id: string | number): SandustryItemDefinition | null;
    createFromId(id: string | number): unknown;
    getActive(): unknown;
    isActiveById(id: string | number, item?: unknown): boolean;
  };
  player: {
    getWorldPosition(): { x: number; y: number };
    setWorldPosition(x: number, y: number): void;
    setVelocity(x: number, y: number): void;
    setMovementSpeedMultiplier(multiplier: number): void;
    setMovementMode(mode: unknown): void;
    isOnGround(): boolean;
    teleportToGround(): void;
    isCollidingWithCell(cellX: number, cellY: number): boolean;
    isWithinRadiusOfCell(cellX: number, cellY: number, radius: number): boolean;
    isWorldPositionClear(worldX: number, worldY: number): boolean;
    inventory: { addFromId(id: string | number): void };
    buildings: { unlockByType(id: string): void };
  };
  raycast: {
    castFromWorld(
      startWorldX: number,
      startWorldY: number,
      angle: number,
      maxDistance: number,
    ): { x: number; y: number; distance: number } | null;
  };
  settings: SandustrySettings;
  assets: { getUrl(relativePath: string): string };
  sprites: { loadFromMod(id: string, path: string): Promise<unknown> };
  storage: { local: { get(key: string): unknown; set(key: string, value: string): void } };
  structures: {
    forEachOfType(id: string, callback: (structure: SandustryStructure) => void): void;
    register(definition: SandustryStructureDefinition): void;
    buildAtCellWhenIdle?(
      x: number,
      y: number,
      type: string,
      options?: Record<string, unknown>,
    ): void;
    setSpritesheetIndex(structure: SandustryStructure, index: number): void;
    update(structure: SandustryStructure, options?: SandustryPropagationOptions): void;
    setData(
      structure: SandustryStructure,
      data: SandustryStructureData,
      options?: SandustryPropagationOptions,
    ): void;
    getTypeFromId?(id: number | string): string | null;
    getUnlockedTypes?(): string[];
    getDefinitionByType?(type: string | number): SandustryStructureDefinition | null;
    updateDefinition?(type: string | number, partial: Record<string, unknown>): void;
  };
  terrains: {
    getTypeFromId(id: string): number | null;
    getTypeAtCell(x: number, y: number): number | null;
    isCellIdTerrain(cellId: number): boolean;
    isTypeAtCell(x: number, y: number, type: string): boolean;
    createAtCellWhenIdle(x: number, y: number, type: string): void;
    removeAtCellWhenIdle(x: number, y: number, options?: SandustryPropagationOptions): void;
  };
  triggers: { register(id: string, definition: { interval: number; callback: () => void }): void };
  upgrades: {
    register(definition: SandustryUpgradeDefinition): void;
    getLevelById(itemId: string, upgradeId: string): number;
  };
  ui: {
    update(componentId: number | string, options?: Record<string, unknown>): void;
    openPauseMenu(): void;
    showTooltip(data: unknown): void;
    toast(message: string, options?: Record<string, unknown>): void;
    alert(message: unknown, title?: unknown): Promise<void>;
    confirm(message: unknown, title?: unknown): Promise<boolean>;
    inject(id: string, component: () => unknown): () => void;
    overlays: SandustryUiOverlays;
    navigation: SandustryNavigation;
    prompt(
      message: unknown,
      defaultValue?: string,
      placeholder?: unknown,
      title?: unknown,
      allowCopy?: boolean,
    ): Promise<string | null>;
  };
  rendering: {
    getGridMetrics(): { cellSize: number; snapGridCellSize: number };
  };
  world: {
    isCellEmptyAtCell(x: number, y: number): boolean;
    revealFogAtCell(x: number, y: number): void;
    redrawAroundCellWhenIdle(x: number, y: number, radius: number): void;
    excavateAtCell(
      x: number,
      y: number,
      outVelocity: { x: number; y: number },
      damage: number,
      options?: Record<string, unknown>,
    ): void;
  };
  sound?: { play(soundId: string, options?: Record<string, unknown>): unknown };
  action?: {
    getActive(): unknown;
    getSelected(): { id?: string | number } | null;
    setCustomData(data: unknown): void;
  };
  input: {
    registerBinding(
      bindingId: string,
      defaultKeys: string[],
      definition: SandustryInputBindingDefinition,
    ): string;
    getMouseCellPosition(): { x: number; y: number };
    getBoundKeys(bindingId: string): string[];
    getDisplayKey(bindingId: string, fallback?: string): string;
    triggerBinding(bindingId: string): void;
    pressBinding(bindingId: string): void;
    releaseBinding(bindingId: string): void;
    resetMouseState(): void;
    isCtrlHeld(): boolean;
    isAltHeld(): boolean;
  };
}

interface SandustryEngineState {
  session: {
    action: SandustrySessionAction;
    cinematic?: unknown;
    settings: { videoZoom: number };
    windows: {
      menu: { open: boolean };
      options: { open: boolean };
    };
    [key: string]: unknown;
  };
  store: {
    player: SandustryPlayerState;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface SandustryEngine {
  api: SandustryEngineApi;
  state: SandustryEngineState;
}

declare const sandkit: {
  api: SandustryApi;
  engine: SandustryEngine;
  react: typeof import("react") & { Fragment?: unknown };
};

declare const React: typeof import("react");

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}
