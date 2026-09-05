import { useState } from "react";
import {
  ActionBar,
  Badge,
  BuildingTile,
  Button,
  CategoryButton,
  CategoryList,
  Checkbox,
  ColorPicker,
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
  SearchInput,
  SegmentedControl,
  Select,
  Slider,
  SplitPane,
  StatusIndicator,
  Switch,
  Tabs,
  TextArea,
  TextInput,
  TextAction,
  Tooltip,
  TooltipSurface,
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
  { id: "light", label: "Light", icon: <span className="text-xl text-yellow-300">✦</span> },
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

const navSections = [
  { id: "hero", label: "Hero" },
  { id: "actions", label: "Actions & Status" },
  { id: "tabs", label: "Tabs" },
  { id: "forms", label: "Form Controls" },
  { id: "tools", label: "Game Tools" },
  { id: "panels", label: "Panels & States" },
  { id: "data", label: "Lists & Metadata" },
  { id: "overlays", label: "Overlays" },
  { id: "hud", label: "Game HUD" },
  { id: "palette", label: "Colors" },
];

function ShowcaseSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-12 space-y-5">
      <div className="flex flex-col gap-1.5 border-b border-slate-800/80 pb-3">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300/90">
          {title}
        </h2>
        {description ? <p className="text-xs text-slate-400">{description}</p> : null}
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
        <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
          {title}
        </h3>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function TerrainTooltipContent() {
  return (
    <>
      <div>Grass</div>
      <div className="mt-1 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="shrink-0 text-gray-400">Destroyed by:</span>
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
        <div className="text-xs text-green-400">HP: 4 / 4</div>
      </div>
    </>
  );
}

export function ComponentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [checkboxA, setCheckboxA] = useState(true);
  const [checkboxB, setCheckboxB] = useState(false);
  const [selectValue, setSelectValue] = useState("normal");
  const [searchDemo, setSearchDemo] = useState("");
  const [mode, setMode] = useState<(typeof modeOptions)[number]["value"]>("overview");
  const [selectedItem, setSelectedItem] = useState("sand");
  const [activeTab, setActiveTab] = useState("blueprints");
  const [activeBuildTab, setActiveBuildTab] = useState("structures");
  const [sliderVolume, setSliderVolume] = useState(75);
  const [sliderFov, setSliderFov] = useState(90);
  const [query, setQuery] = useState("");
  const [matter, setMatter] = useState("all");
  const [activeCategory, setActiveCategory] = useState("logistics");
  const [selectedBuilding, setSelectedBuilding] = useState("conveyor");
  const [pickedColor, setPickedColor] = useState<string | null>("#ff8000");

  if (!import.meta.env.DEV) {
    return (
      <Panel className="mx-auto max-w-xl p-8">
        The Components page is available in development builds only.
      </Panel>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-20 pb-24">
      <header className="border-b border-slate-800 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-yellow-300/80">
            Development only
          </p>
          <span className="rounded border border-yellow-300/30 bg-yellow-300/10 px-2 py-0.5 font-mono text-[10px] text-yellow-300">
            @sandustry/ui
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-white">Component showcase</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
          Interactive states and reference styling for the browser UI kit. This route is
          intentionally not linked from the public site navigation.
        </p>
        <nav className="mt-5 flex flex-wrap items-center gap-1.5" aria-label="Component sections">
          {navSections.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="rounded border border-slate-800 bg-slate-900/60 px-2.5 py-1 font-mono text-[11px] text-slate-400 transition hover:border-yellow-300/40 hover:text-yellow-300"
            >
              {sec.label}
            </a>
          ))}
        </nav>
      </header>

      <ShowcaseSection
        id="hero"
        title="Hero panel and text actions"
        description="High-attention announcement banner for welcome context, milestones, and primary community actions."
      >
        <Panel variant="hero" className="p-6 text-center">
          <h2 className="text-2xl font-bold tracking-wider text-[#ffe700]">
            This library is still in development.
          </h2>
          <Divider variant="accent" className="my-3" />
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/90">
            A high-attention surface for welcome messages, release notes, or important product
            context.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <StatusIndicator tone="online" label="online" value="4,736" />
            <StatusIndicator tone="neutral" label="members" value="14,902" />
            <StatusIndicator tone="warning" label="maintenance" />
          </div>
          <Divider className="my-4" />
          <div className="flex flex-wrap items-center justify-center gap-4">
            <TextAction as="a" href="https://example.com" target="_blank" rel="noreferrer">
              Community
            </TextAction>
            <TextAction icon={<span aria-hidden="true">◌</span>}>Send feedback</TextAction>
            <TextAction>Credits</TextAction>
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
              <IconButton
                label="Regenerate"
                className="h-9 w-9 rounded border border-slate-700 bg-black/60 hover:border-yellow-300 hover:text-yellow-300"
              >
                ↻
              </IconButton>
              <IconButton
                label="Settings"
                className="h-9 w-9 rounded border border-slate-700 bg-black/60 hover:border-yellow-300 hover:text-yellow-300"
              >
                ⚙
              </IconButton>
            </div>
          </ShowcaseSubgroup>

          <Divider className="py-4" />

          <ShowcaseSubgroup
            title="Badges & Status Tags"
            description="Pill tags for counts, tags, states, and mod versions."
          >
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Badge>Default</Badge>
              <Badge tone="accent">Selected</Badge>
              <Badge tone="success">Ready</Badge>
              <Badge tone="warning">Warning</Badge>
              <Badge tone="danger">Error</Badge>
              <Badge tone="info">Info</Badge>
            </div>
          </ShowcaseSubgroup>

          <Divider className="py-4" />

          <ShowcaseSubgroup
            title="Progress Bar Tones"
            description="Segmented-ready linear progress indicators for meters, durability, and thresholds."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 pt-1">
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Accent</span>
                  <span>75%</span>
                </div>
                <ProgressBar value={75} tone="accent" label="Accent progress" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Success</span>
                  <span>100%</span>
                </div>
                <ProgressBar value={100} tone="success" label="Success progress" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Info</span>
                  <span>50%</span>
                </div>
                <ProgressBar value={50} tone="info" label="Info progress" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Warning</span>
                  <span>60%</span>
                </div>
                <ProgressBar value={60} tone="warning" label="Warning progress" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
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
        id="tabs"
        title="Navigation tabs"
        description="Native underline tab bar matching game category and modal navigation."
      >
        <Panel className="p-7 space-y-6">
          <Tabs
            value={activeBuildTab}
            onChange={setActiveBuildTab}
            items={[
              { id: "structures", label: "Structures" },
              { id: "blueprints", label: "Blueprints", badge: <Badge tone="accent">v2</Badge> },
              { id: "settings", label: "Settings" },
              { id: "mods", label: "Mods", disabled: true },
            ]}
          />
          <div className="rounded border border-slate-800 bg-slate-950/60 p-5 font-mono text-xs text-slate-400">
            Active tab panel:{" "}
            <span className="font-semibold text-yellow-300">{activeBuildTab}</span>
            <p className="mt-2 text-[11px] text-slate-500">
              Tabs feature a high-contrast yellow active underline (#ffe700), subtle base border
              line, and keyboard focus states.
            </p>
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
                        className="h-[38px] w-[38px] rounded-sm border border-slate-600 bg-black/60 hover:border-[#ffe700] hover:text-[#ffe700]"
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
                        className="h-[38px] w-[38px] rounded-sm border border-slate-600 bg-black/60 hover:border-[#ffe700] hover:text-[#ffe700]"
                      >
                        ↻
                      </IconButton>
                    </InputGroup>
                  </FormField>

                  <FormField label="Search filter">
                    <SearchInput
                      placeholder="Search resources, tags, blueprints..."
                      value={searchDemo}
                      onChange={(e) => setSearchDemo(e.target.value)}
                    />
                  </FormField>

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
                      <div className="flex items-center justify-between rounded border border-slate-800 bg-black/30 px-3 py-2">
                        <span className="text-xs text-slate-300">Show blueprint grid</span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={switchOn}
                            onChange={(e) => setSwitchOn(e.target.checked)}
                            label="Show grid"
                          />
                          <span className="font-mono text-[10px] text-slate-500">
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
                    <div className="space-y-4 rounded border border-slate-800 bg-black/30 p-3">
                      <Slider
                        label="Master volume"
                        showValue
                        min={0}
                        max={100}
                        value={sliderVolume}
                        onChange={(e) => setSliderVolume(Number(e.target.value))}
                        valueFormat={(v) => `${v}%`}
                      />
                      <Slider
                        label="Field of view"
                        showValue
                        min={60}
                        max={120}
                        value={sliderFov}
                        onChange={(e) => setSliderFov(Number(e.target.value))}
                        valueFormat={(v) => `${v}°`}
                      />
                    </div>
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
        </Panel>
      </ShowcaseSection>

      <ShowcaseSection
        id="tools"
        title="Game tools and building menu"
        description="Structure slots, category navigation with hover nudge, the floating color picker, and 3D hotkey badges."
      >
        <div className="space-y-6">
          {/* Building Menu / Category split */}
          <Panel className="p-6">
            <ShowcaseSubgroup
              title="Building Menu Layout (Category List & Structure Slots)"
              description="Native building menu sidebar featuring hover-nudge animation paired with 64x64 structure slots."
            >
              <div className="flex flex-col gap-6 pt-2 md:flex-row">
                <div className="w-full shrink-0 md:w-36">
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
                  <div className="border-b border-slate-800 pb-1 font-mono text-xs text-slate-400">
                    Category: <span className="capitalize text-yellow-300">{activeCategory}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <BuildingTile
                      label="Conveyor Belt"
                      hotkey="1"
                      selected={selectedBuilding === "conveyor"}
                      onClick={() => setSelectedBuilding("conveyor")}
                      icon={<span className="text-sm font-bold text-yellow-300">→</span>}
                    />
                    <BuildingTile
                      label="Conveyor Mk.2"
                      hotkey="2"
                      badge="mk2"
                      selected={selectedBuilding === "conveyor-mk2"}
                      onClick={() => setSelectedBuilding("conveyor-mk2")}
                      icon={<span className="text-sm font-bold text-yellow-300">⇉</span>}
                    />
                    <BuildingTile
                      label="Launcher"
                      hotkey="3"
                      selected={selectedBuilding === "launcher"}
                      onClick={() => setSelectedBuilding("launcher")}
                      icon={<span className="text-sm font-bold text-yellow-300">▲</span>}
                    />
                    <BuildingTile
                      label="Sorter"
                      hotkey="4"
                      selected={selectedBuilding === "sorter"}
                      onClick={() => setSelectedBuilding("sorter")}
                      icon={<span className="text-sm font-bold text-yellow-300">⇄</span>}
                    />
                    <BuildingTile
                      label="Storage Bin"
                      hotkey="5"
                      selected={selectedBuilding === "storage"}
                      onClick={() => setSelectedBuilding("storage")}
                      icon={<span className="text-sm font-bold text-yellow-300">▤</span>}
                    />
                    <BuildingTile
                      label="Kinetic Press"
                      disabled
                      badge="lock"
                      icon={<span className="text-sm font-bold text-slate-500">⚙</span>}
                    />
                  </div>
                </div>
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
                  <div className="flex flex-col items-center pt-2 sm:items-start">
                    <ColorPicker value={pickedColor} onChange={setPickedColor} />
                    <div className="mt-3 flex items-center gap-2 font-mono text-xs text-slate-400">
                      <span>Selected color:</span>
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-sm border border-white/20"
                        style={{ backgroundColor: pickedColor ?? "transparent" }}
                      />
                      <span className="text-yellow-300">{pickedColor ?? "Default"}</span>
                    </div>
                  </div>
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
                      <span className="text-slate-600">|</span>
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
        id="panels"
        title="Panels and containers"
        description="Card containers, collapsible panels, and locked feature states."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Collapsible panel" collapsible contentClassName="p-4">
            <div className="space-y-2">
              <p className="text-sm leading-6 text-slate-300">
                Panel content can be collapsed without leaving the surrounding layout. Click the
                header toggle arrow to expand or collapse.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Badge tone="accent">Feature preview</Badge>
                <span className="text-xs text-slate-500">Smooth state toggle</span>
              </div>
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
                  <ListItem label="Compact item" description="Reduced spacing" variant="compact" />
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
                  className="h-[360px] overflow-hidden rounded border border-slate-800 bg-black/50"
                  sidebarClassName="w-48 bg-slate-950/80"
                  sidebar={
                    <div className="flex flex-col">
                      <div className="border-b border-slate-800 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
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
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                        <span className="font-mono text-xs text-yellow-300">Active Selection</span>
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
                    <ActionBar className="justify-end gap-2 bg-slate-950/40">
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
      </ShowcaseSection>

      <ShowcaseSection
        id="overlays"
        title="Dialogs and floating overlays"
        description="Modal dialogs, popovers, and rich content tooltips."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel className="space-y-4 p-5">
            <ShowcaseSubgroup title="Interactive Triggers">
              <p className="text-xs text-slate-400">
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
                    <div className="space-y-2 p-1 text-xs text-slate-300">
                      <div className="font-bold text-white">Quick actions</div>
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
              <p className="text-xs text-slate-400">
                Direct rendering of the game's terrain inspector card over a blueprint canvas grid.
              </p>
              <div className="flex items-center justify-center rounded border border-slate-800 bg-sd-950 p-6 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
                <TooltipSurface>
                  <TerrainTooltipContent />
                </TooltipSurface>
              </div>
            </ShowcaseSubgroup>
          </Panel>
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
                  <span className="font-mono text-xs text-slate-400">
                    Active slot: <span className="text-yellow-300">{selectedItem}</span>
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
            <div className="max-w-md">
              <ElementPicker
                items={pickerItems}
                value={selectedItem}
                query={query}
                matter={matter}
                matterOptions={matterOptions}
                onQueryChange={setQuery}
                onMatterChange={setMatter}
                onSelect={(item) => setSelectedItem(item.id)}
              />
            </div>
          </ShowcaseSubgroup>
        </div>
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
                className="flex flex-col overflow-hidden rounded border border-slate-800 bg-black/40"
              >
                <div className="border-b border-slate-800/80 bg-slate-950/50 px-3 py-2">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-white">
                    {group.name}
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{group.description}</p>
                </div>
                <div className="flex-1 divide-y divide-slate-800/60">
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
                        <div className="truncate text-xs font-medium text-slate-200">
                          {color.name}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">{color.value}</div>
                      </div>
                      <span className="shrink-0 rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-400">
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
        <div className="space-y-4 p-5 text-sm text-slate-300">
          <p>
            This exercises the modal shell, scrollable body, close action, and footer action bar.
          </p>
          <TextInput defaultValue="Dialog input" />
        </div>
      </Dialog>
    </div>
  );
}
