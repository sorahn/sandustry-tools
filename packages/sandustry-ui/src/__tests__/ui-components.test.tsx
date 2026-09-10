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
  TierPips,
  EnergyRequirementIcon,
  BuildingTile,
  ItemDetailPanel,
  ModalFooterTip,
} from "../index";

describe("@sandustry/ui component suite", () => {
  test("Button renders variants and polymorphic element", () => {
    const defaultHtml = renderToStaticMarkup(<Button>Click me</Button>);
    expect(defaultHtml).toContain("<sandustry-button");
    expect(defaultHtml).toContain("Click me");

    const solidHtml = renderToStaticMarkup(<Button variant="solid">Solid Action</Button>);
    expect(solidHtml).toContain("Solid Action");
    expect(solidHtml).toContain("border-[#ffe700]");

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
    expect(successBadge).toContain("emerald");
  });

  test("Keycap renders shortcut label", () => {
    const keycapHtml = renderToStaticMarkup(<Keycap>⌘K</Keycap>);
    expect(keycapHtml).toContain("⌘K");
    expect(keycapHtml).toContain("border-[#444]");
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
    expect(resourceHtml).toContain("Iron");
    expect(resourceHtml).toContain("1,250");

    const currencyHtml = renderToStaticMarkup(<CurrencyRow credits={50000} />);
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
    expect(toastHtml).toContain("Operation succeeded");

    const containerHtml = renderToStaticMarkup(
      <ToastContainer className="top-4 right-4">
        <div>Toast Item</div>
      </ToastContainer>,
    );
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
    expect(amberBadge).toContain("amber-300");

    const blueBadge = renderToStaticMarkup(<Badge tone="blue">Liquid</Badge>);
    expect(blueBadge).toContain("blue-300");

    const purpleBadge = renderToStaticMarkup(<Badge tone="purple">Gas</Badge>);
    expect(purpleBadge).toContain("purple-300");

    const neutralBadge = renderToStaticMarkup(<Badge tone="neutral">None</Badge>);
    expect(neutralBadge).toContain("border-slate-800 bg-slate-900 text-slate-400");
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
    expect(warningAlert).toContain("border-amber-700/60");
    expect(warningAlert).toContain("text-amber-200");
    expect(warningAlert).toContain("Caution message");

    const infoAlert = renderToStaticMarkup(
      <Alert tone="info" title="Note">
        Informational text
      </Alert>,
    );
    expect(infoAlert).toContain('role="status"');
    expect(infoAlert).toContain("border-blue-700/60");
    expect(infoAlert).toContain("Note");
    expect(infoAlert).toContain("Informational text");

    const dangerAlert = renderToStaticMarkup(<Alert tone="danger">Error occurred</Alert>);
    expect(dangerAlert).toContain('role="alert"');
    expect(dangerAlert).toContain("border-red-700/60");
  });

  test("PropertyTile renders label, value, and subValue", () => {
    const tileHtml = renderToStaticMarkup(
      <PropertyTile label="Position" value="12, 34" subValue="Top-left" />,
    );
    expect(tileHtml).toContain("Position");
    expect(tileHtml).toContain("12, 34");
    expect(tileHtml).toContain("Top-left");
    expect(tileHtml).toContain("bg-slate-950/50");

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
    expect(tableHtml).toContain("<table");
    expect(tableHtml).toContain("<thead");
    expect(tableHtml).toContain("<tbody");
    expect(tableHtml).toContain("<th");
    expect(tableHtml).toContain("<td");
    expect(tableHtml).toContain("border-slate-800");
    expect(tableHtml).toContain("border-slate-900");
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
    expect(tabsHtml).toContain('role="tablist"');
    expect(tabsHtml).toContain('role="tab"');
    expect(tabsHtml).toContain("Toolbox");
    expect(tabsHtml).toContain("Building");
    expect(tabsHtml).toContain("[Tab]");
    expect(tabsHtml).toContain("[Q]");
    expect(tabsHtml).toContain("border-[#ffe700]");
    expect(tabsHtml).toContain("rounded-tr-md rounded-bl-md");
  });

  test("TierPips renders active glowing pips and inactive pips", () => {
    const pipsHtml = renderToStaticMarkup(<TierPips current={3} max={5} />);
    expect(pipsHtml).toContain('role="progressbar"');
    expect(pipsHtml).toContain('aria-valuenow="3"');
    expect(pipsHtml).toContain('aria-valuemax="5"');
    expect(pipsHtml).toContain("bg-green-400");
    expect(pipsHtml).toContain("bg-gray-700");
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
    expect(tileHtml).toContain("bg-green-400");
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
    expect(activePanelHtml).toContain("border-slate-800");
  });

  test("ModalFooterTip renders tip and action slot", () => {
    const footerHtml = renderToStaticMarkup(
      <ModalFooterTip
        tip={<span>Tip: Drag and drop items</span>}
        action={<button type="button">Disable Drag</button>}
      />,
    );
    expect(footerHtml).toContain("<footer");
    expect(footerHtml).toContain("Tip: Drag and drop items");
    expect(footerHtml).toContain("Disable Drag");
  });
});
