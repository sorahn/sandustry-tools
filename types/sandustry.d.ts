interface SandustryStructureData {
  elementId?: string | null;
  elementType?: number | null;
  [key: string]: unknown;
}

interface SandustryStructure {
  type: string | number;
  x: number;
  y: number;
  queued?: boolean;
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
  id?: string;
  velocity?: { x: number; y: number };
  [key: string]: unknown;
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

interface SandustryBlueprintApi {
  serializeStructures(structures: SandustryBlueprintRecord[]): SandustryBlueprintRecord[];
  localizeStructures(structures: SandustryBlueprintRecord[]): SandustryBlueprintRecord[];
}

interface SandustryUiRegions {
  mount(id: string, render: () => unknown, options?: Record<string, unknown>): unknown;
  setVisible(id: string, visible: boolean): void;
}

interface SandustryUiComponents {
  ActionSlot(props: Record<string, unknown>): unknown;
  Panel(props: Record<string, unknown>): unknown;
  Button(props: Record<string, unknown>): unknown;
}

interface SandustryUiHotbar {
  createBankSource(options?: Record<string, unknown>): unknown;
  selectAction(action: unknown): void;
  getBankCount(): number;
  getActiveBankIndex(): number;
  getActiveSlotIndex(): number | null;
  getSlotKeyLabel(slotIndex: number): string;
  useHotbar(): unknown;
}

interface SandustryUiOverrides {
  register(id: string, override: (...args: unknown[]) => unknown): () => void;
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

interface SandustryHeatTransferApi {
  ensureTemperature(structure: SandustryStructure): number;
  addTemperature(state: SandustryEngineState, structure: SandustryStructure, delta: number): number;
  consumeTemperatureNear?: (...args: unknown[]) => boolean;
  absorbAdjacentElements?: (...args: unknown[]) => number;
  equalizeConnected?: (
    state: SandustryEngineState,
    structures: SandustryStructure[],
    options: {
      structureTypeId: string | number;
      diffusionRate?: number;
      magnitudeFraction?: number;
    },
  ) => void;
  computeEqualizedTemperature?: (...args: unknown[]) => number;
  computeDiffusedTemperatures?: (...args: unknown[]) => number[];
}

interface SandustryStructureRender {
  imageName?: string;
  size?: { width: number; height: number };
  offset?: { x: number; y: number };
  ui?: Record<string, unknown>;
}

interface SandustryStructureDefinition {
  id: string;
  blockGridType?: string | number;
  nameKey?: string;
  descriptionKey?: string;
  categoryKey?: string;
  order?: number;
  alwaysUnlocked?: boolean;
  unlockedBy?: string | number;
  rejectWhenBlocked?: boolean;
  buildModes?: SandustryStructureBuildMode[];
  shape?: number[][];
  variants?: SandustryStructureVariant[];
  copyData?: boolean;
  useRawShape?: boolean;
  render?: SandustryStructureRender;
  defaultData?: SandustryStructureData;
  draw?: (...args: unknown[]) => unknown;
  tooltipHover?: Record<string, unknown>;
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
  /** Observed engine escape hatch used by the native debug brush path. */
  world?: SandustryInternalWorldApi;
  /** Observed engine escape hatch used by the native debug brush path. */
  elements?: SandustryInternalElementsApi;
  /** Observed engine escape hatch used by the native thermal relay. */
  heatTransfer?: SandustryHeatTransferApi;
  blueprints?: SandustryInternalBlueprintApi;
  clipboard?: SandustryInternalClipboardApi;
  prefabulator?: SandustryInternalPrefabulatorApi;
}

/** Observed on the running bundle; not a supported public mod API. */
interface SandustryInternalWorldApi {
  runWhenSimulationIdle(state: SandustryEngineState, callback: () => void): void;
}

/** Observed on the running bundle; not a supported public mod API. */
interface SandustryInternalElementsApi {
  createAt(
    state: SandustryEngineState,
    x: number,
    y: number,
    type: number,
    options?: Record<string, unknown>,
  ): void;
}

interface SandustryRandom {
  int(min: number, max: number): number;
  float(min: number, max: number): number;
}

interface SandustryStructureProcessor {
  getElementTypeAtCell(x: number, y: number): number | null;
  isCellEmpty(x: number, y: number): boolean;
  commit(mutations: Array<Record<string, unknown>>): boolean;
}

interface SandustryPropagationOptions {
  propagateToWorkers?: boolean;
}

interface SandustryApi {
  random: SandustryRandom;
  blueprints: SandustryBlueprintApi;
  elements: {
    getTypeById(id: string | number): number | null;
    getDefinitionByType(type: number | null | undefined): SandustryElementDefinition | null;
    getRegisteredTypes(): number[];
    getTypeFromId(id: string | null | undefined): number | null;
    getIdByType(type: number): string | null;
    getNameByType(type: number): string;
    createAtCellWhenIdle(x: number, y: number, type: number): void;
    createAtCell(x: number, y: number, type: number, options?: Record<string, unknown>): void;
    replaceAtCell(x: number, y: number, type: number, options?: Record<string, unknown>): void;
    replaceAtCellWhenIdle(
      x: number,
      y: number,
      type: number,
      options?: Record<string, unknown>,
    ): void;
    getInfoAtCell(x: number, y: number): SandustryElementInfo | null;
    getTypeAtCell(x: number, y: number): number | null;
    getResolvedTypeAtCell(x: number, y: number): number | null;
    getMatterTypeAtCell(x: number, y: number): number | null;
    removeAtCell(x: number, y: number, options?: Record<string, unknown>): void;
    removeAtCellWhenIdle(x: number, y: number): void;
    teleportBetweenCells(fromX: number, fromY: number, toX: number, toY: number): void;
    teleportBetweenCellsWhenIdle(fromX: number, fromY: number, toX: number, toY: number): void;
    getVelocityAtCell(x: number, y: number): { x: number; y: number } | null;
    setVelocityAtCell(x: number, y: number, velocity: { x: number; y: number }): void;
    setVelocityAtCellWhenIdle(x: number, y: number, velocity: { x: number; y: number }): void;
    addParticleVelocityAtCell(x: number, y: number, velocityX: number, velocityY: number): void;
    addParticleVelocityAtCellWhenIdle(
      x: number,
      y: number,
      velocityX: number,
      velocityY: number,
    ): void;
    getDataFieldAtCell(x: number, y: number, field: string): unknown;
    setDataFieldAtCell(x: number, y: number, field: string, value: unknown): void;
    setDataFieldAtCellWhenIdle(x: number, y: number, field: string, value: unknown): void;
    refreshColorAtCell(x: number, y: number): void;
    refreshColorAtCellWhenIdle(x: number, y: number): void;
    setPhysicsAtCell(x: number, y: number, physics: unknown): void;
    setPhysicsAtCellWhenIdle(x: number, y: number, physics: unknown): void;
    setDurationAtCell(
      x: number,
      y: number,
      duration: number,
      options?: Record<string, unknown>,
    ): void;
    setDurationAtCellWhenIdle(
      x: number,
      y: number,
      duration: number,
      options?: Record<string, unknown>,
    ): void;
  };
  resources: {
    refresh(options?: Record<string, unknown>): void;
    adjustEnergy(amount: number, options?: Record<string, unknown>): void;
    updateEnergy(amount: number, options?: { deferUi?: boolean }): void;
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
  energy: {
    registerType(
      structureType: string,
      type: "storage" | "source" | "consumer",
      options?: Record<string, unknown>,
    ): void;
    consume(amount: number, options?: { allOrNothing?: boolean }): number;
  };
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
    forEachCellInRectangle(
      x: number,
      y: number,
      width: number,
      height: number,
      callback: (cellX: number, cellY: number) => void,
    ): void;
    getDimensions(): { width: number; height: number };
    getCellIdAtCell(x: number, y: number): number;
    isCellEmptyAtCell(x: number, y: number): boolean;
    isTerrainAtCell(x: number, y: number): boolean;
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
    addVariant(
      baseStructureTypeOrId: string | number,
      variant: SandustryStructureVariant,
      options?: { addBuildMode?: SandustryStructureBuildMode },
    ): void;
    addProcessor(
      structureId: string | number,
      definition: {
        intervalMs: number;
        process: (structure: SandustryStructure, processor: SandustryStructureProcessor) => void;
      },
    ): void;
    getAtCell(x: number, y: number): SandustryStructure | null;
    getAvailableTypes(): Array<string | number>;
    getTypeById(id: string | number): string | number | null;
    isLockedByType(type: string | number): boolean;
    isUnlockedByType(type: string | number): boolean;
    updateData(
      structure: SandustryStructure,
      data: SandustryStructureData,
      options?: SandustryPropagationOptions,
    ): void;
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
    buildAtCell(
      x: number,
      y: number,
      type: string | number,
      options?: Record<string, unknown>,
    ): void;
    getTypeFromId?(id: number | string): string | null;
    getUnlockedTypes?(): string[];
    getDefinitionByType?(type: string | number): SandustryStructureDefinition | null;
    updateDefinition?(type: string | number, partial: Record<string, unknown>): void;
    removeAtCell?(x: number, y: number, options?: Record<string, unknown>): void;
    removeAtCellWhenIdle?(x: number, y: number, options?: Record<string, unknown>): void;
    removeBetweenCells?(
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      options?: Record<string, unknown>,
    ): void;
    removeBetweenCellsWhenIdle?(
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      options?: Record<string, unknown>,
    ): void;
    removeAtCells?(cells: Array<{ x: number; y: number }>, options?: Record<string, unknown>): void;
    removeAtCellsWhenIdle?(
      cells: Array<{ x: number; y: number }>,
      options?: Record<string, unknown>,
    ): void;
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
    regions: SandustryUiRegions;
    components: SandustryUiComponents;
    useRefresh(callback?: () => void): (() => void) | void;
    useScale(): number;
    useGameEvent(event: string, callback: (...args: unknown[]) => void): void;
    overrides: SandustryUiOverrides;
    hotbar: SandustryUiHotbar;
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
    getDimensions(): { width: number; height: number };
    getCellIdAtCell(x: number, y: number): number;
    isCellEmptyAtCell(x: number, y: number): boolean;
    isTerrainAtCell(x: number, y: number): boolean;
    runWhenSimulationIdle(callback: () => void): void;
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
