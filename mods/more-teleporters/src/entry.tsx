/* Placeable player teleporter stations with a shared destination picker. */

"use strict";

const api = sandkit.api;
const UIReact = sandkit.react ?? null;
const MOD_ID = "sorahn.more-teleporters";
const STATION_ID = "sorahnPlayerTeleporterStation";
const PICKER_ID = `${MOD_ID}:destination-picker`;
const CHECK_MS = 250;

const TEXT = {
  "structures|playerTeleporterStation|name": "Player Teleporter",
  "structures|playerTeleporterStation|description":
    "Opens the planetary teleporter network when reached.",
};

type Station = SandustryStructure;
type Destination = {
  id: string;
  name: string;
  cellX: number;
  cellY: number;
  custom: boolean;
};
type NativeRuntime = {
  teleportZones?: {
    teleportPlayerTo?: (
      state: any,
      cellX: number,
      cellY: number,
      options?: Record<string, unknown>,
    ) => void;
  };
  portals?: { getMarkers?: (state: any) => Array<{ name: string; x: number; y: number }> };
};

const state = (sandkit as any).state;
let pickerOpen = false;
let repaint: (() => void) | null = null;
let overlayReady = false;

const resolveNativeRuntime = (): NativeRuntime | null => {
  try {
    const chunks = (globalThis as any).webpackChunksand_v1;
    if (!chunks?.push) return null;
    let runtime: any = null;
    chunks.push([
      [Date.now()],
      {},
      (requireFn: any) => {
        runtime = requireFn;
      },
    ]);
    const exports = runtime?.("46781");
    if (exports?.FH?.teleportZones?.teleportPlayerTo) return exports.FH;
  } catch {
    // The custom picker remains unavailable on runtimes without the bridge.
  }
  return null;
};

const stations = () => {
  const result: Station[] = [];
  api.structures.forEachOfType(STATION_ID, (station) => result.push(station));
  return result;
};

const destinations = (): Destination[] => {
  const runtime = resolveNativeRuntime();
  const result: Destination[] = [];
  const markers = runtime?.portals?.getMarkers?.(state) ?? [];
  markers.forEach((marker, index) => {
    result.push({
      id: `native:${index}:${marker.x}:${marker.y}`,
      name: marker.name,
      cellX: Math.floor(marker.x / 4) - 1,
      cellY: Math.floor(marker.y / 4) - 1,
      custom: false,
    });
  });
  stations().forEach((station, index) => {
    result.push({
      id: `station:${station.x},${station.y}`,
      name: `Player Teleporter ${index + 1}`,
      cellX: station.x + 1,
      cellY: station.y + 1,
      custom: true,
    });
  });
  return result;
};

const playerNearStation = () => {
  const player = api.player.getWorldPosition();
  const x = player.x / 4;
  const y = player.y / 4;
  return stations().some(
    (station) =>
      x >= station.x - 1 && x <= station.x + 5 && y >= station.y - 1 && y <= station.y + 5,
  );
};

const closePicker = () => {
  pickerOpen = false;
  if (repaint) repaint();
};

const chooseDestination = (destination: Destination) => {
  const runtime = resolveNativeRuntime();
  const teleport = runtime?.teleportZones?.teleportPlayerTo;
  if (!teleport) {
    api.ui.toast("The native teleporter network is unavailable.");
    return;
  }
  closePicker();
  teleport(state, destination.cellX, destination.cellY, {
    teleportMapLerpMs: 1650,
  });
};

const DestinationPicker = () => {
  if (!UIReact) return null;
  const [, setVersion] = UIReact.useState(0);
  UIReact.useEffect(() => {
    repaint = () => setVersion((version: number) => version + 1);
    return () => {
      repaint = null;
    };
  }, []);
  if (!pickerOpen) return null;
  const entries = destinations();
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10002,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.38)",
        fontFamily: "system-ui, sans-serif",
      }}
      onClick={(event: any) => {
        if (event.target === event.currentTarget) closePicker();
      }}
    >
      <div
        style={{
          width: 430,
          maxWidth: "calc(100vw - 32px)",
          padding: 16,
          border: "1px solid rgba(0, 255, 255, 0.65)",
          borderRadius: 8,
          background: "rgba(8, 30, 45, 0.96)",
          color: "#e5ffff",
          boxShadow: "0 0 28px rgba(0, 255, 255, 0.22)",
        }}
      >
        <div style={{ fontSize: 18, marginBottom: 12 }}>Teleporter Network</div>
        <div style={{ display: "grid", gap: 8 }}>
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => chooseDestination(entry)}
              style={{
                padding: "10px 12px",
                textAlign: "left",
                border: "1px solid rgba(120, 230, 240, 0.45)",
                borderRadius: 5,
                background: entry.custom ? "rgba(0, 130, 145, 0.34)" : "rgba(35, 75, 95, 0.58)",
                color: "#e5ffff",
                cursor: "pointer",
              }}
            >
              {entry.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={closePicker}
          style={{ marginTop: 12, color: "#a9c5ca", background: "transparent", border: 0 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const registerPicker = () => {
  if (overlayReady || !UIReact) return overlayReady;
  try {
    const dispose = api.ui.inject(PICKER_ID, DestinationPicker);
    overlayReady = typeof dispose === "function";
    return overlayReady;
  } catch {
    return false;
  }
};

const checkForStation = () => {
  if (!registerPicker() || pickerOpen || !playerNearStation()) return;
  pickerOpen = true;
  if (repaint) repaint();
};

api.i18n.register("en", TEXT);
api.structures.register({
  id: STATION_ID,
  nameKey: "structures|playerTeleporterStation|name",
  descriptionKey: "structures|playerTeleporterStation|description",
  categoryKey: "misc",
  order: 92,
  buildModes: [{ type: "single" }],
  shape: [
    [15, 15, 15, 15],
    [15, 15, 15, 15],
    [15, 15, 15, 15],
    [15, 15, 15, 15],
  ],
  variants: [{ id: STATION_ID, angles: [0, 90, 180, 270] }],
  render: {
    imageName: "quantumPortal",
    size: { width: 18, height: 18 },
    offset: { x: -1, y: -1 },
  },
});
api.player.buildings.unlockByType(STATION_ID);
registerPicker();
api.events.on("player:moved", checkForStation);
api.triggers.register(`${MOD_ID}:check`, {
  interval: CHECK_MS,
  callback: checkForStation,
});
