import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Badge,
  Button,
  CurrencyRow,
  Divider,
  Keycap,
  Panel,
  ResourceAmount,
  SaveSlotCard,
  StatusIndicator,
  TextAction,
  Toast,
  ToastContainer,
} from "../index";

describe("@sandustry/ui component suite", () => {
  test("Button renders variants and polymorphic element", () => {
    const defaultHtml = renderToStaticMarkup(<Button>Click me</Button>);
    expect(defaultHtml).toContain("<button");
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
    expect(buttonAction).toContain("<button");
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
});
