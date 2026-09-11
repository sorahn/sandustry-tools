import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion } from "motion/react";
import { useTheme, THEME_OPTIONS } from "../utils/theme";
import {
  ActionBar,
  AppShell,
  Badge,
  BuildingTile,
  Button,
  CategoryButton,
  CategoryList,
  Checkbox,
  ColorPicker,
  CurrencyRow,
  Dialog,
  Divider,
  ElementPicker,
  FilterOverlay,
  FormField,
  Hotbar,
  HotbarStepper,
  IconButton,
  InputGroup,
  ItemCard,
  Keycap,
  List,
  ListItem,
  LockedState,
  MetadataRow,
  Panel,
  Popover,
  ProgressBar,
  ProgressList,
  ProgressListItem,
  ResizablePanel,
  ResourceAmount,
  SaveSlotCard,
  SearchInput,
  Sidebar,
  SegmentedControl,
  Select,
  Slider,
  SplitPane,
  Switch,
  Tabs,
  TextArea,
  TextInput,
  Alert,
  Collapsible,
  FileDropZone,
  LoadingOverlay,
  PropertyTile,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Toast,
  ToastContainer,
  Tooltip,
  TooltipSurface,
  TopBar,
  ModeTabs,
  ModeTab,
  TierPips,
  ItemDetailPanel,
  ModalFooterTip,
} from "@sandustry/ui";

const modeOptions = [
  { value: "overview", label: "Overview" },
  { value: "details", label: "Details" },
] as const;

const matterOptions = [
  { value: "all", label: "All" },
  { value: "solid", label: "Solid" },
  { value: "liquid", label: "Liquid" },
] as const;

const pickerItems = [
  {
    id: "sand",
    label: "Sand",
    matter: "solid",
    icon: <span className="h-3 w-3 rounded-sm bg-amber-200" />,
  },
  {
    id: "water",
    label: "Water",
    matter: "liquid",
    icon: <span className="h-3 w-3 rounded-sm bg-cyan-300" />,
  },
  {
    id: "stone",
    label: "Stone",
    matter: "solid",
    icon: <span className="h-3 w-3 rounded-sm bg-slate-400" />,
  },
  {
    id: "steam",
    label: "Steam",
    matter: "liquid",
    icon: <span className="h-3 w-3 rounded-sm bg-white" />,
  },
];

const hotbarSlots = [
  { id: "select", label: "Select", icon: <span className="text-xl">⌁</span> },
  { id: "filter", label: "Filter", icon: <span className="text-xl">◇</span> },
  {
    id: "light",
    label: "Light",
    icon: <span className="text-xl text-[var(--sd-color-primary,#ffe700)]">✦</span>,
  },
];

type ColorEntry = { name: string; value: string; use: string };
type ColorGroup = { name: string; description: string; colors: ColorEntry[] };

const colorGroups: ColorGroup[] = [
  {
    name: "Black",
    description: "Bedrock, dark rock, and deep UI surfaces",
    colors: [
      { name: "Bedrock", value: "#222222", use: "terrain" },
      { name: "BG Dark", value: "#1a1a2e", use: "UI" },
      { name: "Oil", value: "#1a1410", use: "element" },
      { name: "Blackrock", value: "#141414", use: "terrain" },
    ],
  },
  {
    name: "Red",
    description: "Lava, fire, danger, and red soil",
    colors: [
      { name: "Danger", value: "#ef4444", use: "status" },
      { name: "Lava", value: "#ff3300", use: "element" },
      { name: "Lava Fog", value: "#b22222", use: "terrain" },
      { name: "Sandium Soil", value: "#8b0000", use: "terrain" },
    ],
  },
  {
    name: "Green",
    description: "Grass, moss, plants, and success states",
    colors: [
      { name: "Success", value: "#4ade80", use: "tutorial" },
      { name: "Primary", value: "#22c55e", use: "status" },
      { name: "Grass", value: "#228b22", use: "terrain" },
      { name: "Moss", value: "#1dae1d", use: "terrain" },
    ],
  },
  {
    name: "Yellow",
    description: "Gold, sand, warning, and the primary game accent",
    colors: [
      { name: "Game accent", value: "#ffe700", use: "selected/focused" },
      { name: "Dune", value: "#eed975", use: "terrain" },
      { name: "Gold", value: "#ffd700", use: "element/UI" },
      { name: "Warning", value: "#ffaa44", use: "status" },
      { name: "Gold Soil", value: "#daa520", use: "terrain" },
    ],
  },
  {
    name: "Blue",
    description: "Water, ice, coolant, and mineral colors",
    colors: [
      { name: "Ice", value: "#afeeee", use: "terrain" },
      { name: "Water", value: "#1e90ff", use: "element" },
      { name: "Water Fog", value: "#4682b4", use: "terrain" },
      { name: "Pyronol", value: "#3050c8", use: "element" },
      { name: "Coolant", value: "#0033aa", use: "element" },
    ],
  },
  {
    name: "Magenta",
    description: "Petalium, prism, fluxite, and void materials",
    colors: [
      { name: "Prismaline", value: "#ff99cc", use: "element" },
      { name: "Petalium", value: "#cc5cdb", use: "element" },
      { name: "Purple", value: "#9966ff", use: "status" },
      { name: "Void Seeds", value: "#9932cc", use: "element" },
      { name: "Fluxite", value: "#8a2be2", use: "terrain" },
    ],
  },
  {
    name: "Cyan",
    description: "Steam, freezing materials, crystal, and information",
    colors: [
      { name: "Freezing Ice", value: "#e0ffff", use: "element" },
      { name: "Freezing Ice Soil", value: "#add8e6", use: "terrain" },
      { name: "Info", value: "#00ffff", use: "status" },
      { name: "Void Petal", value: "#00ced1", use: "element" },
      { name: "Crystal", value: "#0094b3", use: "terrain" },
    ],
  },
  {
    name: "White",
    description: "Text, steam, residue, and pale material highlights",
    colors: [
      { name: "Text", value: "#ffffff", use: "UI" },
      { name: "Steam", value: "#f7f7f7", use: "element" },
      { name: "Residue", value: "#cccccc", use: "element" },
      { name: "Muted", value: "#888888", use: "UI" },
      { name: "Stone", value: "#808080", use: "terrain" },
    ],
  },
];

const navGroups = [
  {
    label: "Native game surfaces",
    sections: [
      { id: "tools", label: "Game tools" },
      { id: "hud", label: "Game HUD" },
      { id: "tabs", label: "Navigation tabs" },
      { id: "actions", label: "Actions & status" },
      { id: "palette", label: "Color catalog" },
    ],
  },
  {
    label: "Composed browser kit",
    sections: [
      { id: "forms", label: "Form controls" },
      { id: "panels", label: "Panels & states" },
      { id: "data", label: "Lists & layouts" },
      { id: "files", label: "File drop & loading" },
      { id: "display", label: "Display & tables" },
      { id: "overlays", label: "Overlays" },
    ],
  },
];

function ShowcaseSection({
  id,
  title,
  description,
  children,
  deferred = true,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  deferred?: boolean;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-[var(--sd-showcase-header-offset,13rem)] space-y-5 ${
        deferred ? "showcase-section-deferred" : ""
      }`}
    >
      <div className="flex flex-col gap-1.5 border-b border-[var(--sd-color-border,#2a323d)]/80 pb-3">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sd-color-primary,#ffe700)]">
          {title}
        </h2>
        {description ? (
          <p className="text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ShowcaseSubgroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3.5">
      <div>
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--sd-color-text,#ffffff)]">
          {title}
        </h3>
        {description ? (
          <p className="mt-0.5 text-xs text-[var(--sd-color-text-subtle,#8295ab)]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function ShowcaseIntro({
  siteHeaderHeight,
  themeSelectorHeight,
  themeSelectorRef,
}: {
  siteHeaderHeight: number;
  themeSelectorHeight: number;
  themeSelectorRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const asideRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState<string>("tools");
  const isClickScrollingRef = useRef(false);
  const scrollAnimationRef = useRef<{ stop: () => void } | null>(null);

  const allSectionIds = useMemo(
    () => navGroups.flatMap((group) => group.sections.map((s) => s.id)),
    [],
  );

  const smoothScrollToTarget = useCallback((targetY: number) => {
    scrollAnimationRef.current?.stop();

    const startY = window.scrollY;
    const distance = Math.abs(targetY - startY);
    if (distance < 4) {
      window.scrollTo({ top: targetY, behavior: "instant" });
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      window.scrollTo({ top: targetY, behavior: "instant" });
      return;
    }

    // Dynamic duration: snappy for short distances (~0.28s), smooth and rapid for long full-page jumps (~0.62s)
    const duration = Math.min(0.65, Math.max(0.28, 0.22 + (distance / 8000) * 0.4));

    isClickScrollingRef.current = true;

    scrollAnimationRef.current = animate(startY, targetY, {
      duration,
      ease: [0.32, 0, 0.18, 1], // Smooth ease-in-out: starts gently, cruises swiftly, decelerates into place
      onUpdate: (latest) => {
        window.scrollTo({ top: Math.round(latest), behavior: "instant" });
      },
      onComplete: () => {
        isClickScrollingRef.current = false;
        scrollAnimationRef.current = null;
      },
    });
  }, []);

  const handleSectionClick = useCallback(
    (id: string, e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (!el) return;

      setActiveSection(id);

      const currentThemeHeight =
        themeSelectorRef?.current?.getBoundingClientRect().height || themeSelectorHeight;
      const stickyBottom = siteHeaderHeight + 16 + currentThemeHeight;
      const targetOffset = stickyBottom + 32;
      const elTop = el.getBoundingClientRect().top + window.scrollY;
      const targetY = Math.max(0, Math.round(elTop - targetOffset));

      smoothScrollToTarget(targetY);
      history.pushState(null, "", `#${id}`);
    },
    [siteHeaderHeight, themeSelectorHeight, themeSelectorRef, smoothScrollToTarget],
  );

  useEffect(() => {
    const handleUserInterrupt = () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop();
        scrollAnimationRef.current = null;
        isClickScrollingRef.current = false;
      }
    };

    window.addEventListener("wheel", handleUserInterrupt, { passive: true });
    window.addEventListener("touchmove", handleUserInterrupt, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleUserInterrupt);
      window.removeEventListener("touchmove", handleUserInterrupt);
      scrollAnimationRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const scrollToHash = (hashId: string) => {
      const el = document.getElementById(hashId);
      if (!el) return;
      const currentThemeHeight =
        themeSelectorRef?.current?.getBoundingClientRect().height || themeSelectorHeight;
      const stickyBottom = siteHeaderHeight + 16 + currentThemeHeight;
      const targetOffset = stickyBottom + 32;
      const elTop = el.getBoundingClientRect().top + window.scrollY;
      const targetY = Math.max(0, Math.round(elTop - targetOffset));
      smoothScrollToTarget(targetY);
    };

    const hash = window.location.hash.replace(/^#/, "");
    if (hash && allSectionIds.includes(hash)) {
      setActiveSection(hash);
    }

    let rafId = 0;
    const onScroll = () => {
      if (isClickScrollingRef.current) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (window.scrollY < 60) {
          setActiveSection((prev) => (prev !== allSectionIds[0] ? allSectionIds[0] : prev));
          return;
        }
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50) {
          const lastId = allSectionIds[allSectionIds.length - 1];
          setActiveSection((prev) => (prev !== lastId ? lastId : prev));
          return;
        }
        const currentThemeHeight =
          themeSelectorRef?.current?.getBoundingClientRect().height || themeSelectorHeight;
        const stickyBottom = siteHeaderHeight + 16 + currentThemeHeight;
        const threshold = Math.max(
          stickyBottom + 60,
          Math.min(window.innerHeight * 0.45, stickyBottom + 200),
        );
        let current = allSectionIds[0];
        for (const id of allSectionIds) {
          const el = document.getElementById(id);
          if (!el) continue;
          if (el.getBoundingClientRect().top <= threshold) {
            current = id;
          } else {
            break;
          }
        }
        setActiveSection((prev) => (prev !== current ? current : prev));
      });
    };

    const onHashChange = () => {
      const h = window.location.hash.replace(/^#/, "");
      if (h && allSectionIds.includes(h)) {
        setActiveSection(h);
        scrollToHash(h);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHashChange);
    if (hash && allSectionIds.includes(hash)) {
      scrollToHash(hash);
    } else if (window.scrollY >= 60) {
      onScroll();
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHashChange);
      cancelAnimationFrame(rafId);
      scrollAnimationRef.current?.stop();
    };
  }, [
    allSectionIds,
    siteHeaderHeight,
    themeSelectorHeight,
    themeSelectorRef,
    smoothScrollToTarget,
  ]);

  useEffect(() => {
    if (!asideRef.current) return;
    const activeEl = asideRef.current.querySelector<HTMLElement>('[aria-current="true"]');
    if (activeEl) {
      const aside = asideRef.current;
      if (aside.scrollHeight > aside.clientHeight) {
        const activeRect = activeEl.getBoundingClientRect();
        const asideRect = aside.getBoundingClientRect();
        if (activeRect.top < asideRect.top || activeRect.bottom > asideRect.bottom) {
          activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    }
  }, [activeSection]);

  return (
    <aside
      ref={asideRef}
      className="min-w-0 lg:sticky lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2"
      style={{ top: siteHeaderHeight + 16 }}
    >
      <Panel variant="hero" className="space-y-5 p-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--sd-color-primary,#ffe700)]">
            UI kit reference
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--sd-color-text,#e8eef5)]">
            Component showcase
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--sd-color-text-muted,#b6bcc1)]">
            Interactive states and reference styling for the browser UI kit.
          </p>
          <span className="mt-4 inline-flex rounded border border-[var(--sd-color-primary,#ffe700)]/30 bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.1))] px-2 py-0.5 font-mono text-[10px] text-[var(--sd-color-primary,#ffe700)]">
            @sandustry/ui · development
          </span>
        </div>

        <div className="py-2">
          <Divider variant="solid" className="opacity-80" />
        </div>

        <nav aria-label="Component sections" className="space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <h2 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--sd-color-text-subtle,#8295ab)]">
                {group.label}
              </h2>
              <div className="space-y-1">
                {group.sections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={(e) => handleSectionClick(section.id, e)}
                      aria-current={isActive ? "true" : undefined}
                      className={`relative block rounded px-2.5 py-1.5 font-mono text-xs transition-colors ${
                        isActive
                          ? "font-semibold text-[var(--sd-color-primary,#ffe700)]"
                          : "text-[var(--sd-color-text-muted,#b6bcc1)] hover:bg-[var(--sd-color-surface-hover,#1e293b)]/60 hover:text-[var(--sd-color-primary,#ffe700)]"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-showcase-indicator"
                          className="pointer-events-none absolute inset-0 rounded border border-[var(--sd-color-primary,#ffe700)]/30 bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.12))] shadow-sm"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">{section.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </Panel>
    </aside>
  );
}

function TerrainTooltipContent() {
  return (
    <>
      <div>Grass</div>
      <div className="mt-1 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="shrink-0 text-[var(--sd-color-text-muted,#94a3b8)]">Destroyed by:</span>
          <span className="flex flex-wrap items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] ring-1 ring-black ring-inset"
              style={{
                background:
                  "radial-gradient(circle, rgba(100, 100, 100, 0.9) 0%, rgba(0, 0, 0, 0.9) 100%)",
              }}
            >
              ⛏
            </span>
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-4 shrink-0 items-center justify-center"
            >
              +
            </span>
          </span>
        </div>
        <div className="text-xs text-[var(--sd-color-success,#22c55e)]">HP: 4 / 4</div>
      </div>
    </>
  );
}

function SearchInputShowcase() {
  const [value, setValue] = useState("");

  return (
    <FormField label="Search filter">
      <SearchInput
        placeholder="Search resources, tags, blueprints..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </FormField>
  );
}

function SliderShowcase() {
  const [volume, setVolume] = useState(75);
  const [fov, setFov] = useState(90);

  return (
    <div className="space-y-4 rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] p-3">
      <Slider
        label="Master volume"
        showValue
        min={0}
        max={100}
        value={volume}
        onChange={(event) => setVolume(Number(event.target.value))}
        valueFormat={(value) => `${value}%`}
      />
      <Slider
        label="Field of view"
        showValue
        min={60}
        max={120}
        value={fov}
        onChange={(event) => setFov(Number(event.target.value))}
        valueFormat={(value) => `${value}°`}
      />
    </div>
  );
}

function ColorPickerShowcase() {
  const [color, setColor] = useState<string | null>("#ff8000");

  return (
    <div className="flex flex-col items-center pt-2 sm:items-start">
      <ColorPicker value={color} onChange={setColor} />
      <div className="mt-3 flex items-center gap-2 font-mono text-xs text-[var(--sd-color-text-muted,#94a3b8)]">
        <span>Selected color:</span>
        <span
          className="inline-block h-3.5 w-3.5 rounded-sm border border-white/20"
          style={{ backgroundColor: color ?? "transparent" }}
        />
        <span className="text-[var(--sd-color-primary,#ffe700)]">{color ?? "Default"}</span>
      </div>
    </div>
  );
}

function ElementPickerShowcase({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [matter, setMatter] = useState("all");

  return (
    <div className="max-w-md">
      <ElementPicker
        items={pickerItems}
        value={value}
        query={query}
        matter={matter}
        matterOptions={matterOptions}
        onQueryChange={setQuery}
        onMatterChange={setMatter}
        onSelect={(item) => onSelect(item.id)}
      />
    </div>
  );
}

function ShellPrimitivesShowcase() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="sd-shell-stack h-[380px] overflow-hidden rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.5))]">
      <TopBar
        sticky
        leading={<span className="font-semibold">Knex Studio</span>}
        center={
          <span className="font-mono text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
            modeler.knex
          </span>
        }
        trailing={
          <Button
            size="small"
            variant="quiet"
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? "Show navigator" : "Hide navigator"}
          </Button>
        }
        mobileMenu={<IconButton label="Open navigation">☰</IconButton>}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          collapsed={sidebarCollapsed}
          header={
            <div className="sd-shell-cluster justify-between border-b border-[var(--sd-color-border-subtle,#242424)] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--sd-color-text-subtle,#808080)]">
              <span>Navigator</span>
              <span aria-hidden="true">⌘1</span>
            </div>
          }
          footer={
            <div className="px-3 py-2 text-[10px] text-[var(--sd-color-text-subtle,#808080)]">
              3 objects
            </div>
          }
        >
          <div className="sd-scroll-region-y p-2">
            <CategoryList bordered={false} className="pr-0">
              <CategoryButton label="Scene" selected />
              <CategoryButton label="Materials" badge="12" />
              <CategoryButton label="Cameras" badge="2" />
            </CategoryList>
          </div>
        </Sidebar>
        <main className="sd-shell-stack min-w-0 flex-1">
          <div className="sd-shell-cluster shrink-0 border-b border-[var(--sd-color-border-subtle,#242424)] px-3 py-2 text-xs">
            <span className="text-[var(--sd-color-primary,#ffe700)]">Workspace</span>
            <span className="text-[var(--sd-color-text-subtle,#808080)]">/</span>
            <span className="text-[var(--sd-color-text-muted,#b6bcc1)]">Untitled scene</span>
          </div>
          <div className="sd-scroll-region flex-1 p-4">
            <div className="grid min-h-full place-items-center rounded border border-dashed border-[var(--sd-color-border,#334155)] p-6 text-center text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
              Scrollable work area
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const buildingDetails: Record<
  string,
  { title: string; category: string; description: string; tier?: number; requirement?: "energy" }
> = {
  conveyor: {
    title: "Conveyor Belt",
    category: "Logistics",
    description:
      "Transports Sand and other solid elements. Hold Alt to reverse direction when building.",
  },
  "conveyor-mk2": {
    title: "Conveyor Mk.2",
    category: "Logistics",
    description: "High-speed conveyor belt transporting elements at 2x velocity.",
    tier: 2,
  },
  launcher: {
    title: "Launcher",
    category: "Logistics",
    description: "Launches elements across gaps or over obstacles with calibrated trajectory.",
    tier: 3,
  },
  drill: {
    title: "Drill",
    category: "Excavation",
    description: "Automated high-frequency drill head. Consumes electrical energy.",
    requirement: "energy",
    tier: 1,
  },
  rocket: {
    title: "Rocket Launcher",
    category: "Excavation",
    description: "Fires explosive excavation rockets to blast bedrock and extract minerals.",
    requirement: "energy",
    tier: 3,
  },
  synthesizer: {
    title: "Synthesizer",
    category: "Production",
    description: "Fabricates complex structural compounds. Consumes electrical power.",
    requirement: "energy",
    tier: 4,
  },
};

const navSubTabsByMode: Record<
  string,
  Array<{ id: string; label: string; badge?: React.ReactNode }>
> = {
  toolbox: [
    { id: "items", label: "Items" },
    { id: "stratacores", label: "Stratacores" },
  ],
  building: [
    { id: "structures", label: "Structures" },
    { id: "blueprints", label: "Blueprints", badge: <Badge tone="accent">v2</Badge> },
  ],
  research: [
    { id: "technologies", label: "Technologies" },
    { id: "milestones", label: "Milestones" },
  ],
  upgrades: [
    { id: "player", label: "Player" },
    { id: "drones", label: "Drones" },
    { id: "factory", label: "Factory" },
  ],
};

export function ComponentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [checkboxA, setCheckboxA] = useState(true);
  const [checkboxB, setCheckboxB] = useState(false);
  const [selectValue, setSelectValue] = useState("normal");
  const [mode, setMode] = useState<(typeof modeOptions)[number]["value"]>("overview");
  const [selectedItem, setSelectedItem] = useState("sand");
  const [activeTab, setActiveTab] = useState("blueprints");
  const [resizablePanelSize, setResizablePanelSize] = useState(220);
  const [resizablePanelCollapsed, setResizablePanelCollapsed] = useState(false);
  const [activeBuildTab, setActiveBuildTab] = useState("structures");
  const [activeNavMode, setActiveNavMode] = useState("building");
  const [activeNavSubTab, setActiveNavSubTab] = useState("structures");
  const [activeCategory, setActiveCategory] = useState("logistics");
  const [selectedBuilding, setSelectedBuilding] = useState("conveyor");
  const [activeModeTab, setActiveModeTab] = useState("building");
  const [disableDragDrop, setDisableDragDrop] = useState(false);
  const [selectedSave, setSelectedSave] = useState("exit");
  const [loadingOverlayBusy, setLoadingOverlayBusy] = useState(false);
  const [droppedFileName, setDroppedFileName] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{
    message: string;
    variant: "default" | "hint" | "danger";
  } | null>(null);
  const [siteHeaderHeight, setSiteHeaderHeight] = useState(57);
  const [siteTheme, setSiteTheme] = useTheme();
  const [accentTheme, setAccentTheme] = useState<string>("default");
  const themeSelectorRef = useRef<HTMLDivElement>(null);
  const [themeSelectorHeight, setThemeSelectorHeight] = useState(0);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const h = Math.round(entry.contentRect.height);
        if (h > 0) setSiteHeaderHeight((prev) => (prev !== h ? h : prev));
      }
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = themeSelectorRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const h = Math.round(entry.contentRect.height);
        if (h > 0) setThemeSelectorHeight((prev) => (prev !== h ? h : prev));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const accentThemes = [
    { id: "default", label: "Default Accent", className: "" },
    { id: "cyber-cyan", label: "Cyber Cyan", className: "theme-cyber-cyan" },
    { id: "neon-emerald", label: "Neon Emerald", className: "theme-neon-emerald" },
    { id: "solar-amber", label: "Solar Amber", className: "theme-solar-amber" },
  ];

  const currentAccentClass = accentThemes.find((t) => t.id === accentTheme)?.className ?? "";

  return (
    <div className={`showcase-layout w-full pb-24 ${currentAccentClass}`}>
      <ShowcaseIntro
        siteHeaderHeight={siteHeaderHeight}
        themeSelectorHeight={themeSelectorHeight}
        themeSelectorRef={themeSelectorRef}
      />

      <div
        className="showcase-content min-w-0 flex flex-col gap-20"
        style={
          {
            "--sd-showcase-header-offset": `${siteHeaderHeight + 16 + themeSelectorHeight + 32}px`,
          } as React.CSSProperties
        }
      >
        <div
          ref={themeSelectorRef}
          className="sticky z-30 flex min-w-0 flex-col gap-2.5 border-y border-[var(--sd-color-border,#2e2e2e)]/80 bg-[var(--sd-color-bg,#181c20)]/90 px-3 py-3 shadow-lg backdrop-blur-md sm:px-4"
          style={{ top: siteHeaderHeight + 16 }}
        >
          <div
            className="pointer-events-none absolute -top-6 inset-x-0 h-6 bg-[var(--sd-color-bg,#181c20)]"
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
              Full Theme:
            </span>
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSiteTheme(t.id)}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition ${
                  siteTheme === t.id
                    ? "border border-[var(--sd-color-primary,#ffe700)] bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.2))] font-semibold text-[var(--sd-color-primary,#ffe700)]"
                    : "border border-[var(--sd-color-border,#2e2e2e)] bg-[var(--sd-color-surface,#222222)]/60 text-[var(--sd-color-text-muted,#b6bcc1)] hover:text-[var(--sd-color-text,#e8eef5)]"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
              Accent Overrides:
            </span>
            {accentThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setAccentTheme(t.id)}
                className={`rounded px-2.5 py-1 font-mono text-xs transition ${
                  accentTheme === t.id
                    ? "border border-[var(--sd-color-primary,#ffe700)] bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.2))] font-semibold text-[var(--sd-color-primary,#ffe700)]"
                    : "border border-[var(--sd-color-border,#2e2e2e)] bg-[var(--sd-color-surface,#222222)]/60 text-[var(--sd-color-text-muted,#b6bcc1)] hover:text-[var(--sd-color-text,#e8eef5)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <ShowcaseSection
          id="tools"
          deferred={false}
          title="Game tools and building menu"
          description="Structure slots, category navigation with hover nudge, the floating color picker, and 3D hotkey badges."
        >
          <div className="space-y-6">
            {/* Building Menu / Category split */}
            <Panel className="p-6">
              <ShowcaseSubgroup
                title="Building Menu Layout (Mode Tabs, Categories, Slots, Inspector & Footer)"
                description="Full native game toolbox and building layout: major mode tabs, category hover-nudge sidebar, structure slots with energy requirements and tier pips, detail inspector sidebar, and tip footer."
              >
                <div className="space-y-6 pt-2">
                  {/* 1. Mode Tabs */}
                  <div className="overflow-x-auto pb-2">
                    <ModeTabs value={activeModeTab} onChange={setActiveModeTab}>
                      <ModeTab id="toolbox" hotkey="Tab">
                        Toolbox
                      </ModeTab>
                      <ModeTab id="building" hotkey="Q">
                        Building
                      </ModeTab>
                      <ModeTab id="research" hotkey="T">
                        Research
                      </ModeTab>
                      <ModeTab id="upgrades" hotkey="U">
                        Upgrades
                      </ModeTab>
                    </ModeTabs>
                  </div>

                  {/* 2. Three-column body: Category sidebar, Grid of tiles, Detail Inspector */}
                  <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="w-full shrink-0 lg:w-36">
                      <CategoryList>
                        <CategoryButton
                          label="All"
                          badge="32"
                          selected={activeCategory === "all"}
                          onClick={() => setActiveCategory("all")}
                        />
                        <CategoryButton
                          label="Logistics"
                          badge="6"
                          selected={activeCategory === "logistics"}
                          onClick={() => setActiveCategory("logistics")}
                        />
                        <CategoryButton
                          label="Production"
                          badge="12"
                          selected={activeCategory === "production"}
                          onClick={() => setActiveCategory("production")}
                        />
                        <CategoryButton
                          label="Blocks"
                          badge="8"
                          selected={activeCategory === "blocks"}
                          onClick={() => setActiveCategory("blocks")}
                        />
                        <CategoryButton
                          label="Economy"
                          badge="4"
                          selected={activeCategory === "economy"}
                          onClick={() => setActiveCategory("economy")}
                        />
                        <CategoryButton
                          label="Fluids"
                          badge="5"
                          selected={activeCategory === "fluids"}
                          onClick={() => setActiveCategory("fluids")}
                        />
                      </CategoryList>
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="border-b border-[var(--sd-color-border-subtle,#242424)] pb-1 font-mono text-xs text-[var(--sd-color-text-subtle,#808080)]">
                        Category:{" "}
                        <span className="capitalize text-[var(--sd-color-primary,#ffe700)]">
                          {activeCategory}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <BuildingTile
                          label="Conveyor Belt"
                          hotkey="1"
                          selected={selectedBuilding === "conveyor"}
                          onClick={() => setSelectedBuilding("conveyor")}
                          icon={
                            <span className="text-sm font-bold text-[var(--sd-color-primary,#ffe700)]">
                              →
                            </span>
                          }
                        />
                        <BuildingTile
                          label="Conveyor Mk.2"
                          hotkey="2"
                          tier={2}
                          selected={selectedBuilding === "conveyor-mk2"}
                          onClick={() => setSelectedBuilding("conveyor-mk2")}
                          icon={
                            <span className="text-sm font-bold text-[var(--sd-color-primary,#ffe700)]">
                              ⇉
                            </span>
                          }
                        />
                        <BuildingTile
                          label="Launcher"
                          hotkey="3"
                          tier={3}
                          selected={selectedBuilding === "launcher"}
                          onClick={() => setSelectedBuilding("launcher")}
                          icon={
                            <span className="text-sm font-bold text-[var(--sd-color-primary,#ffe700)]">
                              ▲
                            </span>
                          }
                        />
                        <BuildingTile
                          label="Drill"
                          hotkey="4"
                          requirement="energy"
                          tier={1}
                          selected={selectedBuilding === "drill"}
                          onClick={() => setSelectedBuilding("drill")}
                          icon={
                            <span className="text-sm font-bold text-[var(--sd-color-primary,#ffe700)]">
                              ▼
                            </span>
                          }
                        />
                        <BuildingTile
                          label="Rocket Launcher"
                          hotkey="5"
                          requirement="energy"
                          tier={3}
                          selected={selectedBuilding === "rocket"}
                          onClick={() => setSelectedBuilding("rocket")}
                          icon={
                            <span className="text-sm font-bold text-[var(--sd-color-primary,#ffe700)]">
                              🚀
                            </span>
                          }
                        />
                        <BuildingTile
                          label="Synthesizer"
                          hotkey="6"
                          requirement="energy"
                          tier={4}
                          selected={selectedBuilding === "synthesizer"}
                          onClick={() => setSelectedBuilding("synthesizer")}
                          icon={
                            <span className="text-sm font-bold text-[var(--sd-color-primary,#ffe700)]">
                              ⌂
                            </span>
                          }
                        />
                        <BuildingTile
                          label="Kinetic Press"
                          disabled
                          badge="lock"
                          icon={
                            <span className="text-sm font-bold text-[var(--sd-color-text-subtle,#808080)]">
                              ⚙
                            </span>
                          }
                        />
                      </div>
                    </div>

                    {/* 3. Detail Inspector Sidebar */}
                    <ItemDetailPanel
                      title={buildingDetails[selectedBuilding]?.title}
                      category={buildingDetails[selectedBuilding]?.category}
                      description={buildingDetails[selectedBuilding]?.description}
                      footer={
                        <div className="flex items-center justify-between text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
                          <div className="flex items-center gap-2">
                            <span>Tier {buildingDetails[selectedBuilding]?.tier ?? 1}</span>
                            <TierPips
                              current={buildingDetails[selectedBuilding]?.tier ?? 1}
                              max={5}
                            />
                          </div>
                          {buildingDetails[selectedBuilding]?.requirement === "energy" ? (
                            <span className="flex items-center gap-1 text-[var(--sd-color-primary,#ffe700)]">
                              ⚡ Powered
                            </span>
                          ) : (
                            <span>Passive</span>
                          )}
                        </div>
                      }
                    />
                  </div>

                  {/* 4. Modal Footer Tip */}
                  <ModalFooterTip
                    tip={
                      <span>
                        Tip: Drag and drop{" "}
                        <em className="font-medium not-italic text-[var(--sd-color-primary,#ffe700)]">
                          items
                        </em>{" "}
                        or{" "}
                        <em className="font-medium not-italic text-[var(--sd-color-primary,#ffe700)]">
                          blocks
                        </em>{" "}
                        to the hotbar for quick access.
                      </span>
                    }
                    action={
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[var(--sd-color-text-muted,#b6bcc1)]">
                            Disable Drag &amp; Drop
                          </span>
                          <Checkbox
                            checked={disableDragDrop}
                            onChange={(e) => setDisableDragDrop(e.target.checked)}
                          />
                        </div>
                        <div className="mt-1 text-xs text-[var(--sd-color-text-subtle,#808080)]">
                          If the buttons feel{" "}
                          <strong className="text-[var(--sd-color-text,#e8eef5)]">
                            sticky and hard to click
                          </strong>
                          , use this!
                        </div>
                      </div>
                    }
                  />
                </div>
              </ShowcaseSubgroup>
            </Panel>

            {/* Color Picker & Keycaps grid */}
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Panel className="h-full space-y-4 p-6">
                  <ShowcaseSubgroup
                    title="Color Picker (Native 242px)"
                    description="8-column preset palette swatches with default checkerboard and custom color picker."
                  >
                    <ColorPickerShowcase />
                  </ShowcaseSubgroup>
                </Panel>
              </div>

              <div className="lg:col-span-7">
                <Panel className="h-full space-y-6 p-6">
                  <ShowcaseSubgroup
                    title="3D Embossed Hotkey Badges"
                    description="HUD hotkey caps with linear gradient, inset highlight, bottom shadow, and glowing accent glyph."
                  >
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Keycap size="sm">Q</Keycap>
                        <Keycap size="sm">Tab</Keycap>
                        <Keycap size="md">Q</Keycap>
                        <Keycap size="md">Tab</Keycap>
                        <Keycap size="md">Shift</Keycap>
                        <Keycap size="md">Space</Keycap>
                        <Keycap size="lg">E</Keycap>
                        <Keycap size="lg">Enter</Keycap>
                      </div>
                    </div>
                  </ShowcaseSubgroup>

                  <Divider className="py-2" />

                  <ShowcaseSubgroup
                    title="Menu Inline Shortcut Chips"
                    description="Bracketed and outline shortcut indicators matching menu buttons and shortcut bars."
                  >
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <Keycap variant="bracket" size="sm">
                          Q
                        </Keycap>
                        <Keycap variant="bracket" size="md">
                          Tab
                        </Keycap>
                        <Keycap variant="bracket" size="md">
                          1
                        </Keycap>
                        <Keycap variant="bracket" size="lg">
                          Space
                        </Keycap>
                        <span className="text-[var(--sd-color-text-subtle,#8295ab)]">|</span>
                        <Keycap variant="outline" size="sm">
                          1
                        </Keycap>
                        <Keycap variant="outline" size="md">
                          Ctrl
                        </Keycap>
                        <Keycap variant="outline" size="md">
                          Z
                        </Keycap>
                      </div>
                    </div>
                  </ShowcaseSubgroup>
                </Panel>
              </div>
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="hud"
          title="Game HUD and routing visualizers"
          description="Hotbars, steppers, conveyor filter overlays, and the element picker."
        >
          <div className="space-y-6">
            <Panel className="p-5">
              <div className="grid gap-8 lg:grid-cols-2">
                <ShowcaseSubgroup title="Action Hotbar & Stepper">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Hotbar
                        slots={hotbarSlots}
                        selectedId={selectedItem}
                        onSelect={(slot) => setSelectedItem(slot.id)}
                      />
                      <HotbarStepper
                        onChange={(direction) => {
                          const currentIndex = hotbarSlots.findIndex((s) => s.id === selectedItem);
                          const nextIndex =
                            direction === "next"
                              ? (currentIndex + 1) % hotbarSlots.length
                              : (currentIndex - 1 + hotbarSlots.length) % hotbarSlots.length;
                          setSelectedItem(hotbarSlots[nextIndex].id);
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-[var(--sd-color-text-muted,#94a3b8)]">
                      Active slot:{" "}
                      <span className="text-[var(--sd-color-primary,#ffe700)]">{selectedItem}</span>
                    </span>
                  </div>
                </ShowcaseSubgroup>

                <ShowcaseSubgroup title="Conveyor Filter Routing">
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <FilterOverlay
                      status="block"
                      from={{
                        items: [{ label: "Others" }],
                        direction: "down",
                      }}
                      to={{
                        items: [{ label: "Wet Seed", swatchColor: "#66cc66" }],
                        direction: "right",
                        directionTone: "block",
                      }}
                    />
                    <FilterOverlay
                      from={{
                        items: [{ label: "Others" }],
                        direction: "left",
                        directionTone: "block",
                      }}
                      to={{
                        items: [{ label: "Sand", swatchColor: "#e7cd74" }],
                        direction: "right",
                      }}
                    />
                    <FilterOverlay
                      from={{
                        items: [
                          { label: "Voidjuice", swatchColor: "#9b5fcf" },
                          { label: "Voidbloom", swatchColor: "#7a00a8" },
                        ],
                        direction: "right",
                      }}
                      to={{
                        items: [{ label: "Others" }],
                        direction: "left",
                        directionTone: "block",
                      }}
                    />
                  </div>
                </ShowcaseSubgroup>
              </div>
            </Panel>

            <ShowcaseSubgroup title="Element Picker">
              <ElementPickerShowcase value={selectedItem} onSelect={setSelectedItem} />
            </ShowcaseSubgroup>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="tabs"
          title="Navigation tabs"
          description="Multi-tier navigation hierarchy: primary chamfered mode tabs stacked directly above secondary underline view tabs."
        >
          <Panel className="p-7">
            <div className="space-y-6">
              <ShowcaseSubgroup
                title="Multi-Tier Navigation (Mode Tabs + Secondary Underline Tabs)"
                description="Replicates native game dialog headers where 192px chamfered mode tabs control primary system modes, and compact underline tabs switch secondary views directly beneath."
              >
                <div className="space-y-4 pt-2">
                  {/* Tier 1: Primary Mode Tabs */}
                  <div className="overflow-x-auto pb-1">
                    <ModeTabs
                      value={activeNavMode}
                      onChange={(mode) => {
                        setActiveNavMode(mode);
                        const firstSub = navSubTabsByMode[mode]?.[0]?.id;
                        if (firstSub) setActiveNavSubTab(firstSub);
                      }}
                    >
                      <ModeTab id="toolbox" hotkey="Tab">
                        Toolbox
                      </ModeTab>
                      <ModeTab id="building" hotkey="Q">
                        Building
                      </ModeTab>
                      <ModeTab id="research" hotkey="T">
                        Research
                      </ModeTab>
                      <ModeTab id="upgrades" hotkey="U">
                        Upgrades
                      </ModeTab>
                    </ModeTabs>
                  </div>

                  {/* Tier 2: Secondary Underline Tabs */}
                  <div className="overflow-x-auto">
                    <Tabs
                      value={activeNavSubTab}
                      onChange={setActiveNavSubTab}
                      items={navSubTabsByMode[activeNavMode] ?? []}
                    />
                  </div>

                  {/* Breadcrumb & State Info */}
                  <div className="rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] p-5 font-mono text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
                    Active navigation hierarchy:{" "}
                    <span className="font-semibold text-[var(--sd-color-primary,#ffe700)] capitalize">
                      {activeNavMode}
                    </span>
                    <span className="mx-2 text-[var(--sd-color-text-subtle,#808080)]">▸</span>
                    <span className="font-semibold text-[var(--sd-color-primary,#ffe700)] capitalize">
                      {activeNavSubTab}
                    </span>
                    <p className="mt-2 text-[11px] text-[var(--sd-color-text-subtle,#808080)]">
                      Switching primary mode tabs dynamically updates the available secondary view
                      tabs beneath, mirroring the in-game Toolbox and Building modal headers.
                    </p>
                  </div>
                </div>
              </ShowcaseSubgroup>

              <Divider className="my-6" />

              <ShowcaseSubgroup
                title="Standalone Underline Tabs"
                description="Independent underline tab bar with badge support and disabled states."
              >
                <div className="space-y-4 pt-2">
                  <Tabs
                    value={activeBuildTab}
                    onChange={setActiveBuildTab}
                    items={[
                      { id: "structures", label: "Structures" },
                      {
                        id: "blueprints",
                        label: "Blueprints",
                        badge: <Badge tone="accent">v2</Badge>,
                      },
                      { id: "settings", label: "Settings" },
                      { id: "mods", label: "Mods", disabled: true },
                    ]}
                  />
                  <div className="rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] px-4 py-3 font-mono text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
                    Active tab:{" "}
                    <span className="font-semibold text-[var(--sd-color-primary,#ffe700)]">
                      {activeBuildTab}
                    </span>
                  </div>
                </div>
              </ShowcaseSubgroup>
            </div>
          </Panel>
        </ShowcaseSection>

        <ShowcaseSection
          id="actions"
          title="Actions and status"
          description="Interactive button variants, action icons, status badges, and progress indicators."
        >
          <Panel className="p-7 space-y-8">
            <ShowcaseSubgroup
              title="Buttons & Icon Actions"
              description="Variants include default neutral, solid high-contrast confirm (#ffe700), accent outline, quiet flat action, and danger."
            >
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button>Default</Button>
                <Button variant="solid">Solid confirm</Button>
                <Button variant="accent">Accent outline</Button>
                <Button variant="quiet">Quiet action</Button>
                <Button variant="danger">Danger action</Button>
                <Button disabled>Disabled action</Button>
                <Button size="small" variant="accent">
                  Small
                </Button>
                <Button size="large" variant="solid">
                  Large
                </Button>
                <Button size="small" noShift variant="quiet">
                  No-shift action
                </Button>
                <IconButton
                  size="small"
                  label="Regenerate"
                  className="rounded border border-[var(--sd-color-border,#334155)] bg-[var(--sd-color-surface-muted,#0f172a)] hover:border-[var(--sd-color-primary,#ffe700)] hover:text-[var(--sd-color-primary,#ffe700)]"
                >
                  ↻
                </IconButton>
                <IconButton
                  label="Settings"
                  className="h-9 w-9 rounded border border-[var(--sd-color-border,#334155)] bg-[var(--sd-color-surface-muted,#0f172a)] hover:border-[var(--sd-color-primary,#ffe700)] hover:text-[var(--sd-color-primary,#ffe700)]"
                >
                  ⚙
                </IconButton>
              </div>
            </ShowcaseSubgroup>

            <Divider className="py-4" />

            <ShowcaseSubgroup
              title="Badges & Status Tags"
              description="Cut and rounded pill tags across default and generic presentation tones."
            >
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-[var(--sd-color-text-subtle,#8295ab)] font-mono w-24">
                    Cut shape:
                  </span>
                  <Badge shape="cut">Default</Badge>
                  <Badge shape="cut" tone="accent">
                    Selected
                  </Badge>
                  <Badge shape="cut" tone="success">
                    Ready
                  </Badge>
                  <Badge shape="cut" tone="warning">
                    Warning
                  </Badge>
                  <Badge shape="cut" tone="danger">
                    Error
                  </Badge>
                  <Badge shape="cut" tone="info">
                    Info
                  </Badge>
                  <Badge shape="cut" tone="neutral">
                    Neutral
                  </Badge>
                  <Badge shape="cut" tone="amber">
                    Amber
                  </Badge>
                  <Badge shape="cut" tone="blue">
                    Blue
                  </Badge>
                  <Badge shape="cut" tone="purple">
                    Purple
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-[var(--sd-color-text-subtle,#8295ab)] font-mono w-24">
                    Rounded:
                  </span>
                  <Badge shape="rounded">Default</Badge>
                  <Badge shape="rounded" tone="accent">
                    Selected
                  </Badge>
                  <Badge shape="rounded" tone="success">
                    Ready
                  </Badge>
                  <Badge shape="rounded" tone="warning">
                    Warning
                  </Badge>
                  <Badge shape="rounded" tone="danger">
                    Error
                  </Badge>
                  <Badge shape="rounded" tone="info">
                    Info
                  </Badge>
                  <Badge shape="rounded" tone="neutral">
                    Neutral
                  </Badge>
                  <Badge shape="rounded" tone="amber">
                    Amber
                  </Badge>
                  <Badge shape="rounded" tone="blue">
                    Blue
                  </Badge>
                  <Badge shape="rounded" tone="purple">
                    Purple
                  </Badge>
                </div>
              </div>
            </ShowcaseSubgroup>

            <Divider className="py-4" />

            <ShowcaseSubgroup
              title="Progress Bar Tones"
              description="Segmented-ready linear progress indicators for meters, durability, and thresholds."
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 pt-1">
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-[var(--sd-color-text-muted,#94a3b8)]">
                    <span>Accent</span>
                    <span>75%</span>
                  </div>
                  <ProgressBar value={75} tone="accent" label="Accent progress" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-[var(--sd-color-text-muted,#94a3b8)]">
                    <span>Success</span>
                    <span>100%</span>
                  </div>
                  <ProgressBar value={100} tone="success" label="Success progress" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-[var(--sd-color-text-muted,#94a3b8)]">
                    <span>Info</span>
                    <span>50%</span>
                  </div>
                  <ProgressBar value={50} tone="info" label="Info progress" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-[var(--sd-color-text-muted,#94a3b8)]">
                    <span>Warning</span>
                    <span>60%</span>
                  </div>
                  <ProgressBar value={60} tone="warning" label="Warning progress" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-[var(--sd-color-text-muted,#94a3b8)]">
                    <span>Danger</span>
                    <span>25%</span>
                  </div>
                  <ProgressBar value={25} tone="danger" label="Danger progress" />
                </div>
              </div>
            </ShowcaseSubgroup>
          </Panel>
        </ShowcaseSection>

        <ShowcaseSection
          id="palette"
          title="Color catalog"
          description="A compact view of the game catalog, grouped into broad color families. Each swatch keeps its native game-facing hex value and role."
        >
          <Panel className="p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {colorGroups.map((group) => (
                <section
                  key={group.name}
                  className="flex flex-col overflow-hidden rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))]"
                >
                  <div className="border-b border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface,#222222)]/50 px-3 py-2">
                    <h3 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--sd-color-text,#e8eef5)]">
                      {group.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-4 text-[var(--sd-color-text-subtle,#808080)]">
                      {group.description}
                    </p>
                  </div>
                  <div className="flex-1 divide-y divide-[var(--sd-color-border-subtle,#242424)]">
                    {group.colors.map((color) => (
                      <div
                        key={`${group.name}-${color.name}`}
                        className="flex items-center gap-2.5 px-3 py-2 transition hover:bg-white/[0.02]"
                      >
                        <span
                          className="h-5 w-5 shrink-0 rounded-sm border border-white/20 shadow-inner"
                          style={{ backgroundColor: color.value }}
                          title={`${color.name}: ${color.value}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-[var(--sd-color-text,#e8eef5)]">
                            {color.name}
                          </div>
                          <div className="font-mono text-[10px] text-[var(--sd-color-text-subtle,#808080)]">
                            {color.value}
                          </div>
                        </div>
                        <span className="shrink-0 rounded bg-[var(--sd-color-surface-hover,#333333)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--sd-color-text,#ffffff)]">
                          {color.use}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </Panel>
        </ShowcaseSection>

        <ShowcaseSection
          id="forms"
          title="Form controls"
          description="Text inputs, groups, validation states, multiline text, selects, and toggle switches."
        >
          <Panel className="p-6 space-y-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-5">
                <ShowcaseSubgroup title="Text Inputs & Groups">
                  <div className="space-y-4">
                    <FormField label="World name" required>
                      <InputGroup>
                        <TextInput defaultValue="Claybarren" maxLength={64} />
                        <IconButton
                          label="Regenerate name"
                          className="h-[38px] w-[38px] rounded-sm border border-[var(--sd-color-border,#2a323d)] bg-[var(--sd-color-surface,#1c2127)]/60 hover:border-[var(--sd-color-primary,#ffe700)] hover:text-[var(--sd-color-primary,#ffe700)]"
                        >
                          ↻
                        </IconButton>
                      </InputGroup>
                    </FormField>

                    <FormField
                      label="Seed"
                      hint="Use a short stable identifier for repeatable layouts."
                    >
                      <InputGroup>
                        <TextInput defaultValue="llcfshrd" monospace tone="accent" maxLength={32} />
                        <IconButton
                          label="Regenerate seed"
                          className="h-[38px] w-[38px] rounded-sm border border-[var(--sd-color-border,#2a323d)] bg-[var(--sd-color-surface,#1c2127)]/60 hover:border-[var(--sd-color-primary,#ffe700)] hover:text-[var(--sd-color-primary,#ffe700)]"
                        >
                          ↻
                        </IconButton>
                      </InputGroup>
                    </FormField>

                    <SearchInputShowcase />

                    <FormField label="Invalid field" error="This value is required.">
                      <TextInput aria-invalid="true" className="border-red-400" defaultValue="" />
                    </FormField>
                  </div>
                </ShowcaseSubgroup>
              </div>

              <div className="space-y-5">
                <ShowcaseSubgroup title="Selection & Toggles">
                  <div className="space-y-4">
                    <FormField label="Biome preset">
                      <Select
                        value={selectValue}
                        onChange={(e) => setSelectValue(e.target.value)}
                        className="w-full"
                      >
                        <option value="normal">Standard Desert</option>
                        <option value="void">Void Trench</option>
                        <option value="cavern">Deep Caverns</option>
                        <option value="ice">Freezing Tundra</option>
                      </Select>
                    </FormField>

                    <FormField label="View mode">
                      <SegmentedControl options={modeOptions} value={mode} onChange={setMode} />
                    </FormField>

                    <FormField label="Preferences">
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] px-3 py-2">
                          <span className="text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
                            Show blueprint grid
                          </span>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={switchOn}
                              onChange={(e) => setSwitchOn(e.target.checked)}
                              label="Show grid"
                            />
                            <span className="font-mono text-[10px] text-[var(--sd-color-text-subtle,#808080)]">
                              {switchOn ? "ON" : "OFF"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 px-1 pt-1">
                          <Checkbox
                            label="Auto-rotate conveyors"
                            checked={checkboxA}
                            onChange={(e) => setCheckboxA(e.target.checked)}
                          />
                          <Checkbox
                            boxed
                            label="Snap to grid"
                            checked={checkboxB}
                            onChange={(e) => setCheckboxB(e.target.checked)}
                          />
                        </div>
                      </div>
                    </FormField>

                    <FormField label="Settings sliders">
                      <SliderShowcase />
                    </FormField>
                  </div>
                </ShowcaseSubgroup>
              </div>
            </div>

            <Divider className="py-4" />

            <FormField
              label="Notes & Description"
              hint="Multiline blueprint documentation, instructions, or circuit logic notes."
            >
              <TextArea
                rows={3}
                placeholder="Enter blueprint documentation or instructions..."
                className="min-h-24 w-full"
              />
            </FormField>

            <Divider className="py-4" />

            <ShowcaseSubgroup
              title="Uniform Control Sizing (ControlSize)"
              description="Normalized small, default, and large sizing vocabulary across all inputs, selects, switches, checkboxes, sliders, and icon buttons."
            >
              <div className="space-y-6 pt-1">
                <div className="space-y-2">
                  <span className="font-mono text-xs text-[var(--sd-color-primary,#ffe700)]">
                    size=&quot;small&quot;
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <TextInput size="small" defaultValue="Compact input" className="w-48" />
                    <SearchInput size="small" placeholder="Search…" className="w-48" />
                    <Select size="small" defaultValue="a">
                      <option value="a">Option A</option>
                      <option value="b">Option B</option>
                    </Select>
                    <Checkbox size="small" label="Compact" defaultChecked />
                    <Switch size="small" label="Compact switch" defaultChecked />
                    <div className="w-32">
                      <Slider size="small" aria-label="Level" min={0} max={100} defaultValue={40} />
                    </div>
                    <IconButton size="small" label="Small icon">
                      ✕
                    </IconButton>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-xs text-[var(--sd-color-primary,#ffe700)]">
                    size=&quot;default&quot;
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <TextInput size="default" defaultValue="Default input" className="w-48" />
                    <SearchInput size="default" placeholder="Search…" className="w-48" />
                    <Select size="default" defaultValue="a">
                      <option value="a">Option A</option>
                      <option value="b">Option B</option>
                    </Select>
                    <Checkbox size="default" label="Default" defaultChecked />
                    <Switch size="default" label="Default switch" defaultChecked />
                    <div className="w-32">
                      <Slider
                        size="default"
                        aria-label="Level"
                        min={0}
                        max={100}
                        defaultValue={60}
                      />
                    </div>
                    <IconButton size="default" label="Default icon">
                      ✕
                    </IconButton>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-xs text-[var(--sd-color-primary,#ffe700)]">
                    size=&quot;large&quot;
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <TextInput size="large" defaultValue="Large input" className="w-48" />
                    <SearchInput size="large" placeholder="Search…" className="w-48" />
                    <Select size="large" defaultValue="a">
                      <option value="a">Option A</option>
                      <option value="b">Option B</option>
                    </Select>
                    <Checkbox size="large" label="Large" defaultChecked />
                    <Switch size="large" label="Large switch" defaultChecked />
                    <div className="w-32">
                      <Slider size="large" aria-label="Level" min={0} max={100} defaultValue={80} />
                    </div>
                    <IconButton size="large" label="Large icon">
                      ✕
                    </IconButton>
                  </div>
                </div>
              </div>
            </ShowcaseSubgroup>
          </Panel>
        </ShowcaseSection>

        <ShowcaseSection
          id="panels"
          title="Panels and containers"
          description="Card containers, collapsible panels, and locked feature states."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Padded collapsible panel" collapsible padded>
              <div className="space-y-2">
                <p className="text-sm leading-6 text-[var(--sd-color-text,#ffffff)]">
                  Panel content can be collapsed without leaving the surrounding layout. The padded
                  prop applies standard p-4 padding inside the card container.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Badge tone="accent">Feature preview</Badge>
                  <span className="text-xs text-[var(--sd-color-text-subtle,#8295ab)]">
                    Smooth state toggle
                  </span>
                </div>
              </div>
            </Panel>

            <Panel title="Lightweight disclosure (Collapsible)" padded>
              <div className="space-y-4">
                <Collapsible
                  title="Sidebar disclosure section"
                  headerAction={<Badge tone="neutral">Auto</Badge>}
                >
                  <div className="rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] p-3 text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
                    Borderless, lightweight disclosure block with rotating chevron and optional
                    header action slot.
                  </div>
                </Collapsible>
                <Collapsible title="Default collapsed disclosure" defaultCollapsed>
                  <div className="rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] p-3 text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
                    Expanded content when toggled open.
                  </div>
                </Collapsible>
              </div>
            </Panel>

            <LockedState title="World Options" />
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="data"
          title="Lists, items and split-pane layout"
          description="Standard list items, progress step tracking, card items, and two-pane navigation."
        >
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5">
              <Panel className="p-4">
                <ShowcaseSubgroup title="List Density Variants">
                  <List variant="panel">
                    <ListItem label="Default item" description="Standard list density" />
                    <ListItem
                      label="Compact item"
                      description="Reduced spacing"
                      variant="compact"
                    />
                    <ListItem
                      label="Subtle item"
                      description="Muted presentation variant"
                      variant="subtle"
                    />
                    <ListItem label="Selected item" description="Active highlight state" selected />
                  </List>
                </ShowcaseSubgroup>
              </Panel>

              <Panel className="p-4">
                <ShowcaseSubgroup title="Progress List Steps">
                  <ProgressList>
                    <ProgressListItem>Loading sounds</ProgressListItem>
                    <ProgressListItem>Initializing systems</ProgressListItem>
                    <ProgressListItem variant="active" last>
                      Starting game
                    </ProgressListItem>
                    <ProgressListItem variant="substep">Generating cave systems</ProgressListItem>
                    <ProgressListItem variant="substep" last>
                      Generating wall textures
                    </ProgressListItem>
                  </ProgressList>
                </ShowcaseSubgroup>
              </Panel>
            </div>

            <div className="lg:col-span-7">
              <Panel className="h-full p-4">
                <ShowcaseSubgroup title="SplitPane Master-Detail View">
                  <SplitPane
                    className="h-[360px] overflow-hidden rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.5))]"
                    sidebarClassName="w-48 bg-[var(--sd-color-surface,#222222)]/50"
                    sidebar={
                      <div className="flex flex-col">
                        <div className="border-b border-[var(--sd-color-border-subtle,#242424)] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--sd-color-text-subtle,#808080)]">
                          Projects
                        </div>
                        <ListItem
                          label="Blueprints"
                          description="12 items"
                          selected={activeTab === "blueprints"}
                          onClick={() => setActiveTab("blueprints")}
                        />
                        <ListItem
                          label="Maps"
                          description="4 items"
                          trailing={<Badge tone="info">new</Badge>}
                          selected={activeTab === "maps"}
                          onClick={() => setActiveTab("maps")}
                        />
                        <ListItem
                          label="Archives"
                          description="8 items"
                          selected={activeTab === "archives"}
                          onClick={() => setActiveTab("archives")}
                        />
                      </div>
                    }
                  >
                    <div className="flex h-full flex-col">
                      <div className="flex-1 space-y-3 overflow-y-auto p-3.5">
                        <div className="flex items-center justify-between border-b border-[var(--sd-color-border-subtle,#242424)] pb-1.5">
                          <span className="font-mono text-xs text-[var(--sd-color-primary,#ffe700)]">
                            Active Selection
                          </span>
                          <Badge tone="success">Ready</Badge>
                        </div>
                        <ItemCard label="Factory starter" meta="v2" selected />
                        <ItemCard label="Signal test rig" meta="v1" />
                        <ItemCard label="Quantum manifold" meta="draft" />
                        <MetadataRow
                          items={[
                            { label: "Structures", value: "48", tone: "accent" },
                            { label: "Updated", value: "12m ago", tone: "muted" },
                            { label: "Status", value: "Ready", tone: "success" },
                          ]}
                        />
                      </div>
                      <ActionBar className="justify-end gap-2 bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.4))]">
                        <Button className="text-xs">Duplicate</Button>
                        <Button variant="accent" className="text-xs">
                          Inspect
                        </Button>
                      </ActionBar>
                    </div>
                  </SplitPane>
                </ShowcaseSubgroup>
              </Panel>
            </div>
          </div>

          <div className="mt-6">
            <Panel className="p-5">
              <ShowcaseSubgroup title="ResizablePanel Workspace">
                <p className="mb-3 text-xs text-[var(--sd-color-text-subtle,#808080)]">
                  Drag the divider, focus it and use the arrow keys, or double-click it to collapse
                  and restore the navigation pane.
                </p>
                <ResizablePanel
                  className="h-[380px] overflow-hidden rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.5))]"
                  sidebarClassName="bg-[var(--sd-color-surface,#222222)]/60"
                  defaultSize={220}
                  minSize={180}
                  maxSize={420}
                  collapsible
                  onSizeChange={(size, detail) => {
                    if (!detail.collapsed) setResizablePanelSize(size);
                  }}
                  onCollapsedChange={setResizablePanelCollapsed}
                  sidebar={
                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="border-b border-[var(--sd-color-border-subtle,#242424)] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--sd-color-text-subtle,#808080)]">
                        Workspace
                      </div>
                      <ListItem label="Scene" selected />
                      <ListItem label="Materials" description="18 items" />
                      <ListItem label="Settings" />
                    </div>
                  }
                >
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex items-center justify-between border-b border-[var(--sd-color-border-subtle,#242424)] px-3 py-2">
                      <span className="font-mono text-xs text-[var(--sd-color-primary,#ffe700)]">
                        Canvas
                      </span>
                      <Badge tone={resizablePanelCollapsed ? "warning" : "success"}>
                        {resizablePanelCollapsed
                          ? "Pane collapsed"
                          : `${resizablePanelSize}px pane`}
                      </Badge>
                    </div>
                    <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-center text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
                      Full-width dense tool workspace content
                    </div>
                  </div>
                </ResizablePanel>
              </ShowcaseSubgroup>
            </Panel>
          </div>

          <div className="mt-6">
            <Panel className="p-5">
              <ShowcaseSubgroup title="AppShell Slot Contract">
                <p className="mb-3 text-xs text-[var(--sd-color-text-subtle,#808080)]">
                  A landmark-first shell for browser applications. Routing, persistence, and product
                  state stay outside the shell.
                </p>
                <AppShell
                  className="h-[360px] overflow-hidden rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.5))]"
                  topBar={
                    <div className="flex items-center justify-between border-b border-[var(--sd-color-border-subtle,#242424)] px-3 py-2 text-xs">
                      <span className="font-semibold text-[var(--sd-color-text,#e8eef5)]">
                        Sandustry workspace
                      </span>
                      <Badge tone="info">Local</Badge>
                    </div>
                  }
                  sidebar={
                    <div className="flex min-h-0 flex-1 flex-col border-r border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface,#222222)]/50">
                      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--sd-color-text-subtle,#808080)]">
                        Navigation
                      </div>
                      <ListItem label="Overview" selected />
                      <ListItem label="Projects" />
                    </div>
                  }
                  footer={
                    <div className="border-t border-[var(--sd-color-border-subtle,#242424)] px-3 py-1.5 text-[10px] text-[var(--sd-color-text-subtle,#808080)]">
                      Ready
                    </div>
                  }
                  overlays={
                    <div className="pointer-events-none absolute bottom-3 right-3">
                      <Badge tone="success">Overlay layer</Badge>
                    </div>
                  }
                >
                  <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
                    Main content landmark
                  </div>
                </AppShell>
              </ShowcaseSubgroup>
            </Panel>
          </div>

          <div className="mt-6">
            <Panel className="p-5">
              <ShowcaseSubgroup
                title="TopBar + Sidebar Recipes"
                description="Composable application chrome with a sticky bar, collapsible navigation region, nested scroll area, and shell layout utilities."
              >
                <ShellPrimitivesShowcase />
              </ShowcaseSubgroup>
            </Panel>
          </div>

          <div className="mt-6">
            <Panel className="p-5">
              <ShowcaseSubgroup title="Save Slot Cards & Telemetry">
                <p className="mb-4 text-xs text-[var(--sd-color-text-subtle,#8295ab)]">
                  Multi-metric summary cards extracted from the native save game loader with levels,
                  playtimes, structures, and resource breakdown.
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <SaveSlotCard
                    title="Sector 01 - Primary Base"
                    tag="Exit save"
                    timestamp="2026-03-02 22:45"
                    level={12}
                    playtime="18h 42m"
                    structures={1420}
                    productionPoints={296032}
                    currencies={{ credits: 152000, fluxite: 8400 }}
                    selected={selectedSave === "exit"}
                    onClick={() => setSelectedSave("exit")}
                  />
                  <SaveSlotCard
                    title="Sector 02 - Desert Outpost"
                    tag="Auto save"
                    timestamp="2026-03-02 21:10"
                    level={11}
                    playtime="16h 05m"
                    structures={1180}
                    rate="340/s"
                    currencies={{ credits: 94000, fluxite: 5200 }}
                    selected={selectedSave === "auto"}
                    onClick={() => setSelectedSave("auto")}
                  />
                  <SaveSlotCard
                    title="Sandpit Alpha - Experimental"
                    tag="Manual save"
                    timestamp="2026-03-01 19:30"
                    level={10}
                    playtime="12h 18m"
                    structures={890}
                    rate="210/s"
                    currencies={{ credits: 42000, fluxite: 1800, artifact: 2 }}
                    selected={selectedSave === "manual"}
                    onClick={() => setSelectedSave("manual")}
                  />
                </div>

                <Divider className="my-5" />

                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[var(--sd-color-text-muted,#94a3b8)]">
                      Standalone Currency Counters
                    </div>
                    <div className="flex flex-wrap items-center gap-6 pt-1">
                      <ResourceAmount type="credits" amount={152000} size="md" />
                      <ResourceAmount type="fluxite" amount={8400} size="md" />
                      <ResourceAmount type="artifact" amount={2} size="md" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[var(--sd-color-text-muted,#94a3b8)]">
                      Currency Row Layout
                    </div>
                    <div className="pt-1">
                      <CurrencyRow credits={152000} fluxite={8400} artifact={2} />
                    </div>
                  </div>
                </div>
              </ShowcaseSubgroup>
            </Panel>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="files"
          title="File drop zone and loading overlay"
          description="Drag-and-drop file target with depth tracking, keyboard invocation, animated spinner, and backdrop loading overlay."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Interactive FileDropZone" padded className="space-y-4">
              <FileDropZone
                accept=".save,.blueprint,.png"
                clickable
                onFile={(file) => setDroppedFileName(file.name)}
                className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[var(--sd-color-border,#2e2e2e)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] p-6 text-center transition-colors hover:border-[var(--sd-color-primary,#ffe700)]/60"
                activeClassName="border-[var(--sd-color-primary,#ffe700)] bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.1))]"
              >
                {({ dragging }) => (
                  <div className="space-y-2 pointer-events-none">
                    <div className="text-xl">{dragging ? "📥" : "📁"}</div>
                    <div className="text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
                      <span className="font-semibold text-[var(--sd-color-primary,#ffe700)]">
                        Click to browse
                      </span>{" "}
                      or drag a file here
                    </div>
                    <div className="font-mono text-[10px] text-[var(--sd-color-text-subtle,#808080)]">
                      Accepts .save, .blueprint, .png
                    </div>
                  </div>
                )}
              </FileDropZone>
              {droppedFileName ? (
                <div className="flex items-center justify-between rounded border border-[var(--sd-color-border-subtle,#242424)] bg-[var(--sd-color-surface-muted,rgba(0,0,0,0.3))] px-3 py-2 text-xs">
                  <span className="text-[var(--sd-color-text-muted,#b6bcc1)] font-mono">
                    Last selected: {droppedFileName}
                  </span>
                  <Button size="small" variant="quiet" onClick={() => setDroppedFileName(null)}>
                    Clear
                  </Button>
                </div>
              ) : null}
            </Panel>

            <Panel title="Spinner & LoadingOverlay" padded className="relative space-y-5">
              <ShowcaseSubgroup
                title="Standalone Spinner"
                description="Tokenized circular spinners across sizes and tone variants."
              >
                <div className="flex flex-wrap items-center gap-5 pt-1">
                  <div className="flex items-center gap-2">
                    <Spinner size="small" tone="accent" />
                    <span className="text-xs text-[var(--sd-color-text-muted,#94a3b8)]">
                      Small accent
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Spinner size="default" tone="accent" />
                    <span className="text-xs text-[var(--sd-color-text-muted,#94a3b8)]">
                      Default
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Spinner size="large" tone="neutral" />
                    <span className="text-xs text-[var(--sd-color-text-muted,#94a3b8)]">
                      Large neutral
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Spinner size="small" tone="white" />
                    <span className="text-xs text-[var(--sd-color-text-muted,#94a3b8)]">White</span>
                  </div>
                </div>
              </ShowcaseSubgroup>

              <Divider className="py-2" />

              <ShowcaseSubgroup
                title="Backdrop LoadingOverlay Preview"
                description="Backdrop blur overlay with spinner, timer cleanup, and polite screen reader announcements."
              >
                <div className="pt-1">
                  <Button
                    variant="solid"
                    size="small"
                    onClick={() => {
                      setLoadingOverlayBusy(true);
                      setTimeout(() => setLoadingOverlayBusy(false), 2000);
                    }}
                  >
                    {loadingOverlayBusy ? "Loading active (2s)…" : "Trigger 2s loading overlay"}
                  </Button>
                </div>
              </ShowcaseSubgroup>

              <LoadingOverlay
                busy={loadingOverlayBusy}
                message="Processing simulation frames…"
                className="rounded"
              />
            </Panel>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="display"
          title="Display primitives, property tiles and tables"
          description="Static inline alerts, compact property metrics, and semantic monospace table wrappers."
        >
          <div className="space-y-6">
            <Panel title="Inline Alerts" padded>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Alert tone="warning" title="Warning notice">
                  Circuit connection threshold is nearing capacity limit.
                </Alert>
                <Alert tone="info" title="Informational callout">
                  Blueprint contains custom terrain cell foundation definitions.
                </Alert>
                <Alert tone="danger" title="Error state">
                  Failed to parse legacy blueprint version string.
                </Alert>
                <Alert tone="accent" title="Accent announcement">
                  New mod definition catalog entry is active.
                </Alert>
                <Alert tone="neutral" title="Neutral note">
                  Default structure coordinates are aligned to map origin.
                </Alert>
              </div>
            </Panel>

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Panel title="PropertyTile Metric Grid" padded>
                  <div className="grid grid-cols-2 gap-2">
                    <PropertyTile label="Position" value="128, 64" />
                    <PropertyTile label="Footprint" value="4×4 cells" />
                    <PropertyTile
                      label="Bounds"
                      value="X: 128..131, Y: 64..67"
                      valueClassName="text-[11px] text-[var(--sd-color-text-muted,#94a3b8)]"
                    />
                    <PropertyTile
                      label="Asset"
                      value="kinetic_press.png"
                      valueClassName="text-[11px] text-[var(--sd-color-text-muted,#94a3b8)] truncate"
                      subValue="32×32px"
                    />
                  </div>
                </Panel>
              </div>

              <div className="lg:col-span-7">
                <Panel title="Semantic Table" padded>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHead>
                        <tr>
                          <TableHeaderCell>#</TableHeaderCell>
                          <TableHeaderCell>Structure</TableHeaderCell>
                          <TableHeaderCell>Position</TableHeaderCell>
                          <TableHeaderCell>State</TableHeaderCell>
                        </tr>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-[var(--sd-color-text-subtle,#8295ab)]">
                            1
                          </TableCell>
                          <TableCell className="text-[var(--sd-color-primary,#ffe700)]">
                            ConveyorBelt
                          </TableCell>
                          <TableCell>10, 20</TableCell>
                          <TableCell>
                            <Badge tone="success" shape="rounded">
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-[var(--sd-color-text-subtle,#8295ab)]">
                            2
                          </TableCell>
                          <TableCell className="text-[var(--sd-color-primary,#ffe700)]">
                            MatterFilter
                          </TableCell>
                          <TableCell>12, 20</TableCell>
                          <TableCell>
                            <Badge tone="amber" shape="rounded">
                              Solid
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-[var(--sd-color-text-subtle,#8295ab)]">
                            3
                          </TableCell>
                          <TableCell className="text-[var(--sd-color-primary,#ffe700)]">
                            InfiniteSource
                          </TableCell>
                          <TableCell>14, 20</TableCell>
                          <TableCell>
                            <Badge tone="blue" shape="rounded">
                              Liquid
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </Panel>
              </div>
            </div>
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          id="overlays"
          title="Dialogs and floating overlays"
          description="Modal dialogs, popovers, and rich content tooltips."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="space-y-4 p-5">
              <ShowcaseSubgroup title="Interactive Triggers">
                <p className="text-xs text-[var(--sd-color-text-subtle,#8295ab)]">
                  Click or hover below to inspect modal and floating popover behavior.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button variant="accent" onClick={() => setDialogOpen(true)}>
                    Open modal dialog
                  </Button>
                  <Tooltip content={<TerrainTooltipContent />}>
                    <Button>Hover terrain tooltip</Button>
                  </Tooltip>
                  <Popover
                    open={popoverOpen}
                    onClose={() => setPopoverOpen(false)}
                    content={
                      <div className="space-y-2 p-1 text-xs text-[var(--sd-color-text,#ffffff)]">
                        <div className="font-bold text-[var(--sd-color-text,#ffffff)]">
                          Quick actions
                        </div>
                        <div>Configured filter targets for route #4</div>
                        <Button
                          variant="accent"
                          className="w-full text-xs"
                          onClick={() => setPopoverOpen(false)}
                        >
                          Apply filter
                        </Button>
                      </div>
                    }
                  >
                    <Button onClick={() => setPopoverOpen((open) => !open)}>Toggle popover</Button>
                  </Popover>
                </div>
              </ShowcaseSubgroup>
            </Panel>

            <Panel className="space-y-3 p-5">
              <ShowcaseSubgroup title="Tooltip Surface (Static Preview)">
                <p className="text-xs text-[var(--sd-color-text-subtle,#8295ab)]">
                  Direct rendering of the game's terrain inspector card over a blueprint canvas
                  grid.
                </p>
                <div className="flex items-center justify-center rounded border border-[var(--sd-color-border,#334155)] bg-[var(--sd-color-bg,#090b0f)] p-6 bg-[radial-gradient(var(--sd-color-border,#334155)_1px,transparent_1px)] [background-size:16px_16px]">
                  <TooltipSurface>
                    <TerrainTooltipContent />
                  </TooltipSurface>
                </div>
              </ShowcaseSubgroup>
            </Panel>
          </div>

          <Panel className="mt-6 space-y-4 p-5">
            <ShowcaseSubgroup title="HUD Toast Notifications">
              <p className="text-xs text-[var(--sd-color-text-subtle,#8295ab)]">
                HUD notifications extracted from native bundle runtime with asymmetric corners,
                glowing accent borders, and dismiss triggers.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <Toast
                  variant="default"
                  message="Game saved successfully to Slot 1."
                  onClose={() => {}}
                />
                <Toast
                  variant="hint"
                  message="Tip: Press Shift + R to rotate blueprints 90° clockwise."
                  onClose={() => {}}
                />
                <Toast
                  variant="danger"
                  message="Warning: Circuit overload detected in Sector 4!"
                  onClose={() => {}}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="text-xs text-[var(--sd-color-text-muted,#94a3b8)]">
                  Trigger live toast:
                </span>
                <Button
                  variant="quiet"
                  className="text-xs"
                  onClick={() =>
                    setActiveToast({
                      variant: "default",
                      message: "Blueprint 'Refinery Mk2' copied to clipboard.",
                    })
                  }
                >
                  Default toast
                </Button>
                <Button
                  variant="quiet"
                  className="text-xs"
                  onClick={() =>
                    setActiveToast({
                      variant: "hint",
                      message: "Hover over conduits to inspect matter throughput.",
                    })
                  }
                >
                  Hint toast
                </Button>
                <Button
                  variant="quiet"
                  className="text-xs"
                  onClick={() =>
                    setActiveToast({
                      variant: "danger",
                      message: "Power grid disconnected! Backup generators offline.",
                    })
                  }
                >
                  Danger toast
                </Button>
              </div>
            </ShowcaseSubgroup>
          </Panel>
        </ShowcaseSection>

        <Dialog
          open={dialogOpen}
          title="Debug dialog"
          onClose={() => setDialogOpen(false)}
          footer={
            <ActionBar>
              <Button variant="quiet" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="solid" onClick={() => setDialogOpen(false)}>
                Confirm
              </Button>
            </ActionBar>
          }
        >
          <div className="space-y-4 p-5 text-sm text-[var(--sd-color-text,#ffffff)]">
            <p>
              This exercises the modal shell, scrollable body, close action, and footer action bar.
            </p>
            <TextInput defaultValue="Dialog input" />
          </div>
        </Dialog>

        {activeToast && (
          <ToastContainer>
            <Toast
              variant={activeToast.variant}
              message={activeToast.message}
              onClose={() => setActiveToast(null)}
            />
          </ToastContainer>
        )}
      </div>
    </div>
  );
}
