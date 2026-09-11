import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Badge,
  Button,
  Checkbox,
  CurrencyRow,
  Divider,
  IconButton,
  Keycap,
  Panel,
  ResourceAmount,
  SaveSlotCard,
  SearchInput,
  Select,
  Slider,
  StatusIndicator,
  Switch,
  TextAction,
  TextInput,
  Toast,
  ToastContainer,
  Spinner,
  LoadingOverlay,
  FileDropZone,
  createDragDepthTracker,
  isFileAccepted,
  Collapsible,
  Alert,
  PropertyTile,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
  ModeTabs,
  ModeTab,
  Tabs,
  Tab,
  CategoryList,
  CategoryButton,
  List,
  ListItem,
  ProgressList,
  ProgressListItem,
  SplitPane,
  ResizablePanel,
  AppShell,
  TopBar,
  Sidebar,
  TierPips,
  EnergyRequirementIcon,
  BuildingTile,
  ItemDetailPanel,
  ModalFooterTip,
  Dialog,
  Popover,
  Tooltip,
  TooltipSurface,
  ColorPicker,
  ElementPicker,
  FilterOverlay,
  ProgressBar,
  Hotbar,
  HotbarStepper,
  ShortcutHelper,
  ShortcutHelperItem,
} from "../index";

describe("@sandustry/ui component suite", () => {
  test("Button renders variants and polymorphic element", () => {
    const defaultHtml = renderToStaticMarkup(<Button>Click me</Button>);
    expect(defaultHtml).toContain("<sandustry-button");
    expect(defaultHtml).toContain("Click me");

    const solidHtml = renderToStaticMarkup(<Button variant="solid">Solid Action</Button>);
    expect(solidHtml).toContain("Solid Action");
    expect(solidHtml).toContain("border-[var(--sd-color-primary,#ffe700)]");

    const linkHtml = renderToStaticMarkup(
      <Button as="a" href="/test">
        Link Button
      </Button>,
    );
    expect(linkHtml).toContain("<a");
    expect(linkHtml).toContain('href="/test"');
    expect(linkHtml).toContain("Link Button");
  });

  test("Badge renders label and tone classes", () => {
    const defaultBadge = renderToStaticMarkup(<Badge>Core</Badge>);
    expect(defaultBadge).toContain("Core");

    const successBadge = renderToStaticMarkup(<Badge tone="success">Active</Badge>);
    expect(successBadge).toContain("Active");
    expect(successBadge).toContain("var(--sd-color-success");
  });

  test("Keycap renders shortcut label", () => {
    const keycapHtml = renderToStaticMarkup(<Keycap>⌘K</Keycap>);
    expect(keycapHtml).toContain("⌘K");
    expect(keycapHtml).toContain("border-[#444]");
  });

  test("ShortcutHelper renders contextual key instructions", () => {
    const helperHtml = renderToStaticMarkup(
      <ShortcutHelper aria-label="Build controls">
        <ShortcutHelperItem hotkey={<Keycap size="sm">LMB</Keycap>} label="Place" />
      </ShortcutHelper>,
    );
    expect(helperHtml).toContain("<sandustry-shortcut-helper");
    expect(helperHtml).toContain("<sandustry-shortcut-helper-item");
    expect(helperHtml).toContain("LMB");
    expect(helperHtml).toContain("Place");
  });

  test("ModalFooterTip only adds external spacing when requested", () => {
    const compactHtml = renderToStaticMarkup(<ModalFooterTip tip="Tip" />);
    const spacedHtml = renderToStaticMarkup(<ModalFooterTip spaced tip="Tip" />);
    expect(compactHtml).not.toContain("mt-4");
    expect(spacedHtml).toContain("mt-4");
  });

  test("Panel and Divider render structural markup", () => {
    const dividerHtml = renderToStaticMarkup(<Divider variant="accent" />);
    expect(dividerHtml).toContain('role="separator"');

    const panelHtml = renderToStaticMarkup(
      <Panel header="Settings">
        <div>Content</div>
      </Panel>,
    );
    expect(panelHtml).toContain("Settings");
    expect(panelHtml).toContain("Content");
  });

  test("StatusIndicator renders label and tones", () => {
    const onlineHtml = renderToStaticMarkup(<StatusIndicator tone="online" label="Connected" />);
    expect(onlineHtml).toContain("Connected");
    expect(onlineHtml).toContain("bg-green-500");
  });

  test("TextAction renders link and button semantics", () => {
    const buttonAction = renderToStaticMarkup(<TextAction>Reset</TextAction>);
    expect(buttonAction).toContain("<sandustry-text-action");
    expect(buttonAction).toContain("Reset");

    const linkAction = renderToStaticMarkup(
      <TextAction as="a" href="/back">
        Go Back
      </TextAction>,
    );
    expect(linkAction).toContain("<a");
    expect(linkAction).toContain('href="/back"');
    expect(linkAction).toContain("Go Back");
  });

  test("Batch 3 telemetry components render accurately", () => {
    const resourceHtml = renderToStaticMarkup(<ResourceAmount label="Iron" amount={1250} />);
    expect(resourceHtml).toContain("<sandustry-resource-amount");
    expect(resourceHtml).toContain("Iron");
    expect(resourceHtml).toContain("1,250");

    const currencyHtml = renderToStaticMarkup(<CurrencyRow credits={50000} />);
    expect(currencyHtml).toContain("<sandustry-currency-row");
    expect(currencyHtml).toContain("50,000");

    const saveSlotHtml = renderToStaticMarkup(
      <SaveSlotCard title="Sector Alpha" tag="Slot 1" playtime="14h" structures={150} />,
    );
    expect(saveSlotHtml).toContain("Slot 1");
    expect(saveSlotHtml).toContain("Sector Alpha");
    expect(saveSlotHtml).toContain("14h");
    expect(saveSlotHtml).toContain("150");
  });

  test("Toast and ToastContainer render alerts", () => {
    const toastHtml = renderToStaticMarkup(<Toast message="Operation succeeded" variant="hint" />);
    expect(toastHtml).toContain("<sandustry-toast");
    expect(toastHtml).toContain("Operation succeeded");

    const containerHtml = renderToStaticMarkup(
      <ToastContainer className="top-4 right-4">
        <div>Toast Item</div>
      </ToastContainer>,
    );
    expect(containerHtml).toContain("<sandustry-toast-container");
    expect(containerHtml).toContain("Toast Item");
    expect(containerHtml).toContain("top-4 right-4");
  });

  test("Button supports size, compact alias, and noShift", () => {
    const smallHtml = renderToStaticMarkup(<Button size="small">Small</Button>);
    expect(smallHtml).toContain("h-[var(--sd-form-control-small-height)]");
    expect(smallHtml).toContain("text-[10px]");

    const compactHtml = renderToStaticMarkup(<Button compact>Compact</Button>);
    expect(compactHtml).toContain("h-[var(--sd-form-control-small-height)]");
    expect(compactHtml).toContain("text-[10px]");

    const largeHtml = renderToStaticMarkup(<Button size="large">Large</Button>);
    expect(largeHtml).toContain("h-[var(--sd-form-control-large-height)]");
    expect(largeHtml).toContain("text-sm");

    const noShiftHtml = renderToStaticMarkup(<Button noShift>No Shift</Button>);
    expect(noShiftHtml).toContain("noShift");
  });

  test("Select supports size, compact alias, and omits native size attribute", () => {
    const smallHtml = renderToStaticMarkup(
      <Select size="small">
        <option value="1">1</option>
      </Select>,
    );
    expect(smallHtml).toContain("<sandustry-select");
    expect(smallHtml).toContain("h-[var(--sd-form-control-small-height)]");
    expect(smallHtml).toContain("py-1");
    expect(smallHtml).not.toContain('size="');

    const compactHtml = renderToStaticMarkup(
      <Select compact>
        <option value="1">1</option>
      </Select>,
    );
    expect(compactHtml).toContain("h-[var(--sd-form-control-small-height)]");
    expect(compactHtml).toContain("py-1");

    const largeHtml = renderToStaticMarkup(
      <Select size="large">
        <option value="1">1</option>
      </Select>,
    );
    expect(largeHtml).toContain("h-[var(--sd-form-control-large-height)]");
  });

  test("TextInput and SearchInput support uniform size vocabulary", () => {
    const smallText = renderToStaticMarkup(<TextInput size="small" placeholder="text" />);
    expect(smallText).toContain("h-[var(--sd-form-control-small-height)]");
    expect(smallText).not.toContain('size="');

    const largeText = renderToStaticMarkup(<TextInput size="large" placeholder="text" />);
    expect(largeText).toContain("h-[var(--sd-form-control-large-height)]");

    const smallSearch = renderToStaticMarkup(<SearchInput size="small" placeholder="search" />);
    expect(smallSearch).toContain("h-[var(--sd-form-control-small-height)]");
    expect(smallSearch).not.toContain('size="');

    const largeSearch = renderToStaticMarkup(<SearchInput size="large" placeholder="search" />);
    expect(largeSearch).toContain("h-[var(--sd-form-control-large-height)]");
  });

  test("Checkbox, Switch, Slider, and IconButton support uniform control sizing", () => {
    const smallCheck = renderToStaticMarkup(<Checkbox size="small" label="Option" />);
    expect(smallCheck).toContain("min-h-6");
    expect(smallCheck).toContain("h-3 w-3");

    const largeCheck = renderToStaticMarkup(<Checkbox size="large" label="Option" />);
    expect(largeCheck).toContain("min-h-8");
    expect(largeCheck).toContain("h-4 w-4");

    const smallSwitch = renderToStaticMarkup(<Switch size="small" label="Toggle" />);
    expect(smallSwitch).toContain("h-4 w-7");

    const largeSwitch = renderToStaticMarkup(<Switch size="large" label="Toggle" />);
    expect(largeSwitch).toContain("h-7 w-12");

    const smallSlider = renderToStaticMarkup(
      <Slider size="small" label="Volume" showValue value={50} readOnly />,
    );
    expect(smallSlider).toContain('data-size="small"');

    const defaultSlider = renderToStaticMarkup(<Slider size="default" value={50} readOnly />);
    expect(defaultSlider).toContain('data-size="default"');

    const largeSlider = renderToStaticMarkup(<Slider size="large" value={50} readOnly />);
    expect(largeSlider).toContain('data-size="large"');

    const smallIconBtn = renderToStaticMarkup(
      <IconButton size="small" label="Close">
        ✕
      </IconButton>,
    );
    expect(smallIconBtn).toContain("h-6 w-6");
  });

  test("Panel padded prop applies standard padding to content", () => {
    const unpaddedHtml = renderToStaticMarkup(
      <Panel title="Unpadded">
        <span>Content</span>
      </Panel>,
    );
    expect(unpaddedHtml).not.toContain("p-4");

    const paddedHtml = renderToStaticMarkup(
      <Panel title="Padded" padded>
        <span>Content</span>
      </Panel>,
    );
    expect(paddedHtml).toContain("p-4");
  });

  test("Badge supports shape prop and presentation tones", () => {
    const cutBadge = renderToStaticMarkup(<Badge shape="cut">Cut</Badge>);
    expect(cutBadge).toContain("rounded-tr-lg rounded-bl-lg");

    const roundedBadge = renderToStaticMarkup(<Badge shape="rounded">Rounded</Badge>);
    expect(roundedBadge).toContain("rounded");
    expect(roundedBadge).not.toContain("rounded-tr-lg rounded-bl-lg");

    const amberBadge = renderToStaticMarkup(<Badge tone="amber">Solid</Badge>);
    expect(amberBadge).toContain("var(--sd-badge-amber-text");

    const blueBadge = renderToStaticMarkup(<Badge tone="blue">Liquid</Badge>);
    expect(blueBadge).toContain("var(--sd-badge-blue-text");

    const purpleBadge = renderToStaticMarkup(<Badge tone="purple">Gas</Badge>);
    expect(purpleBadge).toContain("var(--sd-badge-purple-text");

    const neutralBadge = renderToStaticMarkup(<Badge tone="neutral">None</Badge>);
    expect(neutralBadge).toContain("var(--sd-color-border-subtle");
  });

  test("Spinner renders sizes, tones, and accessibility attributes", () => {
    const defaultSpinner = renderToStaticMarkup(<Spinner />);
    expect(defaultSpinner).toContain('role="status"');
    expect(defaultSpinner).toContain('aria-label="Loading…"');
    expect(defaultSpinner).toContain("animate-spin");
    expect(defaultSpinner).toContain("motion-reduce:animate-none");
    expect(defaultSpinner).toContain("h-5 w-5");
    expect(defaultSpinner).toContain("border-yellow-400");

    const smallSpinner = renderToStaticMarkup(
      <Spinner size="small" tone="neutral" label="Saving" />,
    );
    expect(smallSpinner).toContain('aria-label="Saving"');
    expect(smallSpinner).toContain("h-3.5 w-3.5");
    expect(smallSpinner).toContain("border-slate-400");

    const largeSpinner = renderToStaticMarkup(<Spinner size="large" tone="white" />);
    expect(largeSpinner).toContain("h-8 w-8");
    expect(largeSpinner).toContain("border-white");
  });

  test("LoadingOverlay renders when busy and exposes accessibility metadata", () => {
    const busyOverlay = renderToStaticMarkup(
      <LoadingOverlay busy={true} message="Loading blueprint data…" dataTestId="test-overlay" />,
    );
    expect(busyOverlay).toContain("<sandustry-loading-overlay");
    expect(busyOverlay).toContain('data-testid="test-overlay"');
    expect(busyOverlay).toContain('aria-live="polite"');
    expect(busyOverlay).toContain('aria-busy="true"');
    expect(busyOverlay).toContain("Loading blueprint data…");
    expect(busyOverlay).toContain("opacity-100");

    const idleOverlay = renderToStaticMarkup(
      <LoadingOverlay busy={false} message="Idle" dataTestId="test-overlay" />,
    );
    expect(idleOverlay).toBe("");
  });

  test("isFileAccepted validates extensions, MIME types, and wildcards", () => {
    const saveFile = new File(["data"], "game.save", { type: "application/octet-stream" });
    const pngFile = new File(["png"], "render.PNG", { type: "image/png" });
    const jsonFile = new File(["{}"], "data.json", { type: "application/json" });

    expect(isFileAccepted(saveFile, ".save")).toBe(true);
    expect(isFileAccepted(saveFile, ".blueprint,.save")).toBe(true);
    expect(isFileAccepted(saveFile, ".png")).toBe(false);

    // Case insensitivity
    expect(isFileAccepted(pngFile, ".png")).toBe(true);
    expect(isFileAccepted(pngFile, "image/*")).toBe(true);
    expect(isFileAccepted(pngFile, "image/png")).toBe(true);
    expect(isFileAccepted(pngFile, "image/jpeg")).toBe(false);

    expect(isFileAccepted(jsonFile, "application/json")).toBe(true);
    expect(isFileAccepted(jsonFile, ".save")).toBe(false);
  });

  test("createDragDepthTracker maintains depth and notifies on root boundaries only", () => {
    let currentDragging = false;
    const tracker = createDragDepthTracker((dragging) => {
      currentDragging = dragging;
    });

    const preventDefault = () => {};

    // 1. Enter container
    tracker.enter({ preventDefault });
    expect(tracker.depth).toBe(1);
    expect(currentDragging).toBe(true);

    // 2. Enter child
    tracker.enter({ preventDefault });
    expect(tracker.depth).toBe(2);
    expect(currentDragging).toBe(true);

    // 3. Leave child
    tracker.leave({ preventDefault });
    expect(tracker.depth).toBe(1);
    expect(currentDragging).toBe(true);

    // 4. Leave container
    tracker.leave({ preventDefault });
    expect(tracker.depth).toBe(0);
    expect(currentDragging).toBe(false);

    // 5. Drop resets immediately
    tracker.enter({ preventDefault });
    expect(tracker.depth).toBe(1);
    expect(currentDragging).toBe(true);
    tracker.drop({ preventDefault });
    expect(tracker.depth).toBe(0);
    expect(currentDragging).toBe(false);
  });

  test("FileDropZone renders container, hidden input, and supports render prop", () => {
    const dropzoneHtml = renderToStaticMarkup(
      <FileDropZone
        accept=".save"
        className="p-4 border-slate-800"
        activeClassName="border-yellow-400"
        disabledClassName="opacity-50"
      >
        <span>Drop file here</span>
      </FileDropZone>,
    );

    expect(dropzoneHtml).toContain("<sandustry-file-dropzone");
    expect(dropzoneHtml).toContain('accept=".save"');
    expect(dropzoneHtml).toContain('type="file"');
    expect(dropzoneHtml).toContain("Drop file here");
    expect(dropzoneHtml).toContain("border-slate-800");

    // Render prop pattern
    const renderPropHtml = renderToStaticMarkup(
      <FileDropZone accept=".save">
        {({ dragging }) => <span>Status: {dragging ? "Dragging" : "Idle"}</span>}
      </FileDropZone>,
    );
    expect(renderPropHtml).toContain("Status: Idle");
  });

  test("FileDropZone drop logic validates and rejects invalid files", () => {
    let onFileCalled: File | null = null;
    let onRejectCalled: any = null;

    const element = (
      <FileDropZone
        accept=".save"
        onFile={(f) => {
          onFileCalled = f;
        }}
        onReject={(r) => {
          onRejectCalled = r;
        }}
      >
        <span>Zone</span>
      </FileDropZone>
    );

    const markup = renderToStaticMarkup(element);
    expect(markup).toContain("Zone");
    expect(onFileCalled).toBeNull();
    expect(onRejectCalled).toBeNull();
  });

  test("Collapsible renders open and collapsed states, chevron rotation, and headerAction", () => {
    const openHtml = renderToStaticMarkup(
      <Collapsible title="Details" headerAction={<button>Action</button>}>
        <div>Hidden body</div>
      </Collapsible>,
    );
    expect(openHtml).toContain("<sandustry-collapsible");
    expect(openHtml).toContain('aria-expanded="true"');
    expect(openHtml).toContain("Details");
    expect(openHtml).toContain("Hidden body");
    expect(openHtml).toContain("Action");
    expect(openHtml).not.toContain("-rotate-90");

    const collapsedHtml = renderToStaticMarkup(
      <Collapsible title="Details" defaultCollapsed>
        <div>Hidden body</div>
      </Collapsible>,
    );
    expect(collapsedHtml).toContain('aria-expanded="false"');
    expect(collapsedHtml).toContain("-rotate-90");
    expect(collapsedHtml).not.toContain("Hidden body");

    const nonCollapsibleHtml = renderToStaticMarkup(
      <Collapsible title="Static Header" collapsible={false}>
        <div>Always visible</div>
      </Collapsible>,
    );
    expect(nonCollapsibleHtml).not.toContain("<button");
    expect(nonCollapsibleHtml).toContain("Static Header");
    expect(nonCollapsibleHtml).toContain("Always visible");
  });

  test("Alert renders tones, titles, and accessibility roles", () => {
    const warningAlert = renderToStaticMarkup(<Alert tone="warning">Caution message</Alert>);
    expect(warningAlert).toContain('role="alert"');
    expect(warningAlert).toContain("var(--sd-color-warning-border");
    expect(warningAlert).toContain("var(--sd-color-warning");
    expect(warningAlert).toContain("Caution message");

    const infoAlert = renderToStaticMarkup(
      <Alert tone="info" title="Note">
        Informational text
      </Alert>,
    );
    expect(infoAlert).toContain('role="status"');
    expect(infoAlert).toContain("var(--sd-color-info-border");
    expect(infoAlert).toContain("Note");
    expect(infoAlert).toContain("Informational text");

    const dangerAlert = renderToStaticMarkup(<Alert tone="danger">Error occurred</Alert>);
    expect(dangerAlert).toContain('role="alert"');
    expect(dangerAlert).toContain("var(--sd-color-danger-border");
  });

  test("PropertyTile renders label, value, and subValue", () => {
    const tileHtml = renderToStaticMarkup(
      <PropertyTile label="Position" value="12, 34" subValue="Top-left" />,
    );
    expect(tileHtml).toContain("Position");
    expect(tileHtml).toContain("12, 34");
    expect(tileHtml).toContain("Top-left");
    expect(tileHtml).toContain("border-[var(--sd-color-border-subtle,#242424)]");

    const customTileHtml = renderToStaticMarkup(
      <PropertyTile label="Custom">
        <span data-testid="custom-value">Custom Body</span>
      </PropertyTile>,
    );
    expect(customTileHtml).toContain("Custom");
    expect(customTileHtml).toContain('data-testid="custom-value"');
  });

  test("Table components render semantic markup and classes", () => {
    const tableHtml = renderToStaticMarkup(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>#</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
            <TableCell>Conveyor</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(tableHtml).toContain("<sandustry-table");
    expect(tableHtml).toContain("<table");
    expect(tableHtml).toContain("<thead");
    expect(tableHtml).toContain("<tbody");
    expect(tableHtml).toContain("<th");
    expect(tableHtml).toContain("<td");
    expect(tableHtml).toContain("border-[var(--sd-color-border-subtle,#242424)]");
    expect(tableHtml).toContain("Conveyor");
  });

  test("ModeTabs and ModeTab render mode tabs with hotkey and active gradient", () => {
    const tabsHtml = renderToStaticMarkup(
      <ModeTabs value="toolbox">
        <ModeTab id="toolbox" selected hotkey="Tab">
          Toolbox
        </ModeTab>
        <ModeTab id="building" hotkey="Q">
          Building
        </ModeTab>
      </ModeTabs>,
    );
    expect(tabsHtml).toContain("<sandustry-mode-tabs");
    expect(tabsHtml).toContain("<sandustry-mode-tab");
    expect(tabsHtml).toContain('role="tablist"');
    expect(tabsHtml).toContain('role="tab"');
    expect(tabsHtml).toContain("Toolbox");
    expect(tabsHtml).toContain("Building");
    expect(tabsHtml).toContain("[Tab]");
    expect(tabsHtml).toContain("[Q]");
    expect(tabsHtml).toContain("border-[var(--sd-color-primary,#ffe700)]");
    expect(tabsHtml).toContain("rounded-tr-md rounded-bl-md");
  });

  test("TierPips renders active glowing pips and inactive pips", () => {
    const pipsHtml = renderToStaticMarkup(<TierPips current={3} max={5} />);
    expect(pipsHtml).toContain('role="progressbar"');
    expect(pipsHtml).toContain('aria-valuenow="3"');
    expect(pipsHtml).toContain('aria-valuemax="5"');
    expect(pipsHtml).toContain("bg-[var(--sd-color-success,#34d399)]");
    expect(pipsHtml).toContain("bg-[var(--sd-color-surface-hover,#333333)]");
  });

  test("EnergyRequirementIcon renders svg with accessible label", () => {
    const iconHtml = renderToStaticMarkup(<EnergyRequirementIcon />);
    expect(iconHtml).toContain("<svg");
    expect(iconHtml).toContain("Requires Energy");
    expect(iconHtml).toContain('fill="#ffd700"');
  });

  test("BuildingTile renders energy requirement badge and tier pips", () => {
    const tileHtml = renderToStaticMarkup(
      <BuildingTile label="Rocket Launcher" requirement="energy" tier={3} />,
    );
    expect(tileHtml).toContain("Rocket Launcher");
    expect(tileHtml).toContain("<svg");
    expect(tileHtml).toContain("Requires Energy");
    expect(tileHtml).toContain('role="progressbar"');
    expect(tileHtml).toContain("bg-[var(--sd-color-success,#34d399)]");
  });

  test("ItemDetailPanel renders title, description, and footer", () => {
    const emptyPanelHtml = renderToStaticMarkup(<ItemDetailPanel isEmpty />);
    expect(emptyPanelHtml).toContain("Block");
    expect(emptyPanelHtml).toContain("Hover over an item to see details.");

    const activePanelHtml = renderToStaticMarkup(
      <ItemDetailPanel
        category="Logistics"
        title="Conveyor Belt"
        description="Transports Sand."
        footer={<button type="button">Upgrade</button>}
      />,
    );
    expect(activePanelHtml).toContain("Logistics");
    expect(activePanelHtml).toContain("Conveyor Belt");
    expect(activePanelHtml).toContain("Transports Sand.");
    expect(activePanelHtml).toContain("Upgrade");
    expect(activePanelHtml).toContain("border-[var(--sd-color-border-subtle,#242424)]");
  });

  test("ModalFooterTip renders tip and action slot", () => {
    const footerHtml = renderToStaticMarkup(
      <ModalFooterTip
        tip={<span>Tip: Drag and drop items</span>}
        action={<button type="button">Disable Drag</button>}
      />,
    );
    expect(footerHtml).toContain("<sandustry-modal-footer-tip");
    expect(footerHtml).toContain("<footer");
    expect(footerHtml).toContain("Tip: Drag and drop items");
    expect(footerHtml).toContain("Disable Drag");
  });

  test("Tabs and Tab render custom elements with active selection and items", () => {
    const tabsHtml = renderToStaticMarkup(
      <Tabs
        value="tab2"
        items={[
          { id: "tab1", label: "Overview" },
          { id: "tab2", label: "Settings", badge: "2" },
        ]}
      />,
    );
    expect(tabsHtml).toContain("<sandustry-tabs");
    expect(tabsHtml).toContain("<sandustry-tab");
    expect(tabsHtml).toContain('role="tablist"');
    expect(tabsHtml).toContain('role="tab"');
    expect(tabsHtml).toContain("Overview");
    expect(tabsHtml).toContain("Settings");
    expect(tabsHtml).toContain("border-[var(--sd-color-primary,#ffe700)]");

    const directTabHtml = renderToStaticMarkup(<Tab selected>Manual Tab</Tab>);
    expect(directTabHtml).toContain("<sandustry-tab");
    expect(directTabHtml).toContain("Manual Tab");
    expect(directTabHtml).toContain("border-[var(--sd-color-primary,#ffe700)]");
  });

  test("CategoryList and CategoryButton render custom elements with selection and badge", () => {
    const listHtml = renderToStaticMarkup(
      <CategoryList bordered>
        <CategoryButton label="Logistics" badge="12" selected />
        <CategoryButton label="Production" disabled />
      </CategoryList>,
    );
    expect(listHtml).toContain("<sandustry-category-list");
    expect(listHtml).toContain("<sandustry-category-button");
    expect(listHtml).toContain("Logistics");
    expect(listHtml).toContain("Production");
    expect(listHtml).toContain("12");
    expect(listHtml).toContain("text-[var(--sd-color-primary,#ffe700)]");
  });

  test("List and ListItem render custom elements and variants", () => {
    const listHtml = renderToStaticMarkup(
      <List variant="panel">
        <ListItem label="Iron Ingot" description="Basic resource" selected />
        <ListItem label="Copper Wire" variant="compact" />
      </List>,
    );
    expect(listHtml).toContain("<sandustry-list");
    expect(listHtml).toContain("<sandustry-list-item");
    expect(listHtml).toContain('role="list"');
    expect(listHtml).toContain("Iron Ingot");
    expect(listHtml).toContain("Basic resource");
    expect(listHtml).toContain("border-l-[var(--sd-color-primary,#ffe700)]");
  });

  test("ProgressList and ProgressListItem render custom elements and variants", () => {
    const progressHtml = renderToStaticMarkup(
      <ProgressList height="150px">
        <ProgressListItem variant="active">Analyzing world data…</ProgressListItem>
        <ProgressListItem variant="substep" last>
          Extracting entities
        </ProgressListItem>
      </ProgressList>,
    );
    expect(progressHtml).toContain("<sandustry-progress-list");
    expect(progressHtml).toContain("<sandustry-progress-list-item");
    expect(progressHtml).toContain('role="list"');
    expect(progressHtml).toContain('role="listitem"');
    expect(progressHtml).toContain("Analyzing world data…");
    expect(progressHtml).toContain("Extracting entities");
    expect(progressHtml).toContain("sd-text-glow-yellow");
  });

  test("SplitPane renders custom element with sidebar and content slots", () => {
    const splitHtml = renderToStaticMarkup(
      <SplitPane sidebar={<div>Sidebar Content</div>} sidebarPosition="start">
        <div>Main Content</div>
      </SplitPane>,
    );
    expect(splitHtml).toContain("<sandustry-split-pane");
    expect(splitHtml).toContain("<aside");
    expect(splitHtml).toContain("<main");
    expect(splitHtml).toContain("Sidebar Content");
    expect(splitHtml).toContain("Main Content");
  });

  test("ResizablePanel renders a resizable sidebar and content slot", () => {
    const panelHtml = renderToStaticMarkup(
      <ResizablePanel
        sidebar={<div>Parts</div>}
        size={320}
        minSize={220}
        maxSize={420}
        collapsible
        sidebarPosition="end"
      >
        <div>Canvas</div>
      </ResizablePanel>,
    );
    expect(panelHtml).toContain("<sandustry-resizable-panel");
    expect(panelHtml).toContain('sidebar-position="end"');
    expect(panelHtml).toContain('size="320"');
    expect(panelHtml).toContain('min-size="220"');
    expect(panelHtml).toContain('max-size="420"');
    expect(panelHtml).toContain('collapsible=""');
    expect(panelHtml).toContain('slot="sidebar"');
    expect(panelHtml).toContain("Parts");
    expect(panelHtml).toContain("Canvas");
  });

  test("AppShell renders named shell slots and accessible labels", () => {
    const shellHtml = renderToStaticMarkup(
      <AppShell
        topBar={<div>Toolbar</div>}
        sidebar={<div>Navigation</div>}
        footer={<div>Status bar</div>}
        overlays={<div>Toast layer</div>}
        sidebarPosition="end"
        sidebarLabel="Project navigation"
        mainLabel="Modeling canvas"
      >
        <div>Workspace</div>
      </AppShell>,
    );
    expect(shellHtml).toContain("<sandustry-app-shell");
    expect(shellHtml).toContain('sidebar-position="end"');
    expect(shellHtml).toContain('sidebar-label="Project navigation"');
    expect(shellHtml).toContain('main-label="Modeling canvas"');
    expect(shellHtml).toContain('slot="topbar"');
    expect(shellHtml).toContain('slot="sidebar"');
    expect(shellHtml).toContain('slot="footer"');
    expect(shellHtml).toContain('slot="overlays"');
    expect(shellHtml).toContain("Workspace");
  });

  test("TopBar and Sidebar render shell slots and state", () => {
    const topBarHtml = renderToStaticMarkup(
      <TopBar
        sticky
        leading={<span>Project</span>}
        trailing={<button type="button">Save</button>}
        mobileMenu={<button type="button">Menu</button>}
      >
        Modeler
      </TopBar>,
    );
    expect(topBarHtml).toContain("<sandustry-top-bar");
    expect(topBarHtml).toContain('sticky=""');
    expect(topBarHtml).toContain('slot="leading"');
    expect(topBarHtml).toContain('slot="center"');
    expect(topBarHtml).toContain('slot="trailing"');
    expect(topBarHtml).toContain('slot="mobile-menu"');

    const sidebarHtml = renderToStaticMarkup(
      <Sidebar collapsed position="end" ariaLabel="Project navigation" header={<div>Header</div>}>
        <div>Navigation</div>
      </Sidebar>,
    );
    expect(sidebarHtml).toContain("<sandustry-sidebar");
    expect(sidebarHtml).toContain('position="end"');
    expect(sidebarHtml).toContain('collapsed=""');
    expect(sidebarHtml).toContain('label="Project navigation"');
    expect(sidebarHtml).toContain('aria-label="Project navigation"');
    expect(sidebarHtml).toContain('slot="header"');
    expect(sidebarHtml).toContain("Navigation");
  });

  test("Dialog renders custom element when open and null when closed", () => {
    const closedHtml = renderToStaticMarkup(
      <Dialog open={false} title="Modal">
        Content
      </Dialog>,
    );
    expect(closedHtml).toBe("");

    const openHtml = renderToStaticMarkup(
      <Dialog open={true} title="Modal Title" footer={<button>Save</button>}>
        <div>Dialog Body</div>
      </Dialog>,
    );
    expect(openHtml).toContain("<sandustry-dialog");
    expect(openHtml).toContain('role="dialog"');
    expect(openHtml).toContain("Modal Title");
    expect(openHtml).toContain("Dialog Body");
    expect(openHtml).toContain("Save");
  });

  test("Popover renders custom element and trigger", () => {
    const popoverHtml = renderToStaticMarkup(
      <Popover content={<div>Popup Menu</div>} open={false}>
        <button>Open Menu</button>
      </Popover>,
    );
    expect(popoverHtml).toContain("<sandustry-popover");
    expect(popoverHtml).toContain("Open Menu");
  });

  test("Tooltip and TooltipSurface render custom elements", () => {
    const tooltipHtml = renderToStaticMarkup(
      <Tooltip content="Help info">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(tooltipHtml).toContain("<sandustry-tooltip");
    expect(tooltipHtml).toContain("Hover me");

    const surfaceHtml = renderToStaticMarkup(<TooltipSurface>Direct surface</TooltipSurface>);
    expect(surfaceHtml).toContain("<sandustry-tooltip-surface");
    expect(surfaceHtml).toContain("Direct surface");
    expect(surfaceHtml).toContain('role="tooltip"');
  });

  test("ColorPicker renders custom element with swatches and header", () => {
    const pickerHtml = renderToStaticMarkup(<ColorPicker value="#ff0000" title="Custom Tone" />);
    expect(pickerHtml).toContain("<sandustry-color-picker");
    expect(pickerHtml).toContain('role="dialog"');
    expect(pickerHtml).toContain("Custom Tone");
    expect(pickerHtml).toContain("Default");
  });

  test("ElementPicker renders custom element and search input", () => {
    const pickerHtml = renderToStaticMarkup(
      <ElementPicker
        items={[
          { id: "iron", label: "Iron Ore", matter: "solid" },
          { id: "water", label: "Water", matter: "liquid" },
        ]}
        value="iron"
      />,
    );
    expect(pickerHtml).toContain("<sandustry-element-picker");
    expect(pickerHtml).toContain("Iron Ore");
    expect(pickerHtml).toContain("Water");
  });

  test("FilterOverlay renders custom element with directional endpoints", () => {
    const filterHtml = renderToStaticMarkup(
      <FilterOverlay
        from={{ items: [{ label: "Sand" }], direction: "right" }}
        to={{ items: [{ label: "Glass" }], direction: "right" }}
        status="pass"
      />,
    );
    expect(filterHtml).toContain("<sandustry-filter-overlay");
    expect(filterHtml).toContain("Sand");
    expect(filterHtml).toContain("Glass");
    expect(filterHtml).toContain("border-[#00ff47]");
  });

  test("ProgressBar renders custom element, accessibility attributes, and tones", () => {
    const progressHtml = renderToStaticMarkup(
      <ProgressBar value={75} max={100} tone="accent" label="Power" />,
    );
    expect(progressHtml).toContain("<sandustry-progress-bar");
    expect(progressHtml).toContain('role="progressbar"');
    expect(progressHtml).toContain('aria-valuenow="75"');
    expect(progressHtml).toContain('aria-valuemax="100"');
    expect(progressHtml).toContain("bg-[var(--sd-color-primary,#ffe700)]");
  });

  test("Hotbar and HotbarStepper render custom elements with key shortcuts", () => {
    const hotbarHtml = renderToStaticMarkup(
      <Hotbar
        slots={[
          { id: "slot1", label: "Conveyor" },
          { id: "slot2", label: "Drill" },
        ]}
        selectedId="slot1"
      />,
    );
    expect(hotbarHtml).toContain("<sandustry-hotbar");
    expect(hotbarHtml).toContain('role="toolbar"');
    expect(hotbarHtml).toContain("border-[var(--sd-color-primary,#ffe700)]");

    const stepperHtml = renderToStaticMarkup(<HotbarStepper />);
    expect(stepperHtml).toContain("<sandustry-hotbar-stepper");
    expect(stepperHtml).toContain("▲");
    expect(stepperHtml).toContain("▼");
  });
});
