import cx from "clsx";
import { Button, Checkbox, MetadataRow, SaveSlotCard, StatusIndicator } from "@sandustry/ui";
import type { SaveBlueprintSummary, SaveExplorerClientDocument } from "@sandustry/save-core";

export type SaveExplorerLayers = {
  terrain: boolean;
  settledElements: boolean;
  elements: boolean;
  particles: boolean;
  walls: boolean;
  structures: boolean;
  fog: boolean;
  authorization: boolean;
};

type SaveExplorerSidebarProps = {
  document: SaveExplorerClientDocument | null;
  busy: boolean;
  message: string;
  remember: boolean;
  hasCurrentSave: boolean;
  layers: SaveExplorerLayers;
  customCursor: boolean;
  onRemember: () => void;
  onLayerChange: (layer: keyof SaveExplorerLayers, checked: boolean) => void;
  onCustomCursorChange: (checked: boolean) => void;
  onInspectBlueprint: (blueprintId: string) => void;
  onCopyBlueprint: (blueprintId: string) => void;
  className?: string;
};

function formatPlayTime(seconds?: number) {
  if (seconds === undefined) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toLocaleString()}h ${minutes}m`;
}

function Metadata({ document }: { document: SaveExplorerClientDocument }) {
  return (
    <div className="space-y-3">
      <SaveSlotCard
        title={document.metadata.worldName || "unnamed"}
        tag={document.metadata.gameVersion ? `v${document.metadata.gameVersion}` : undefined}
        playtime={formatPlayTime(document.metadata.playTime)}
        structures={document.structureCount}
      />
      <MetadataRow
        items={[
          { label: "Seed", value: document.metadata.seed || "unknown", tone: "muted" },
          {
            label: "Dimensions",
            value: `${document.world.width} × ${document.world.height}`,
            tone: "muted",
          },
        ]}
      />
    </div>
  );
}

export function SaveExplorerSidebar({
  document,
  busy,
  message,
  remember,
  hasCurrentSave,
  layers,
  customCursor,
  onRemember,
  onLayerChange,
  onCustomCursorChange,
  onInspectBlueprint,
  onCopyBlueprint,
  className = "",
}: SaveExplorerSidebarProps) {
  return (
    <div className={cx("flex flex-col divide-y divide-slate-800/80 text-slate-300", className)}>
      <section className="space-y-3 p-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Save status
        </h3>
        <div className="flex items-center justify-between gap-3 text-sm">
          <StatusIndicator
            tone={document ? "online" : busy ? "warning" : "neutral"}
            label={busy ? "processing" : document ? "decoded" : "waiting"}
          />
          <Button
            type="button"
            onClick={onRemember}
            disabled={!remember && !hasCurrentSave}
            aria-pressed={remember}
          >
            {remember ? "Forget save" : "Remember save"}
          </Button>
        </div>
        <p className="text-xs leading-5 text-slate-500">{message}</p>
      </section>

      {document ? (
        <section className="space-y-3 p-4">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            World metadata
          </h3>
          <Metadata document={document} />
        </section>
      ) : null}

      {document ? (
        <Blueprints document={document} onInspect={onInspectBlueprint} onCopy={onCopyBlueprint} />
      ) : null}

      <section className="space-y-2.5 p-4 text-xs">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Minimap layers
        </h3>
        <div className="space-y-2">
          {(Object.keys(layers) as Array<keyof SaveExplorerLayers>)
            .filter(
              (layer) => (layer !== "fog" && layer !== "authorization") || import.meta.env.DEV,
            )
            .map((layer) => (
              <Checkbox
                key={layer}
                boxed
                size="small"
                label={
                  layer === "settledElements"
                    ? "settled elements"
                    : layer === "particles"
                      ? "particles"
                      : layer === "authorization"
                        ? "authorization zones"
                        : layer
                }
                checked={layers[layer]}
                onChange={(event) => onLayerChange(layer, event.target.checked)}
              />
            ))}
          {import.meta.env.DEV ? (
            <Checkbox
              boxed
              size="small"
              label="custom cursor"
              checked={customCursor}
              onChange={(event) => onCustomCursorChange(event.target.checked)}
            />
          ) : null}
        </div>
      </section>

      <section className="space-y-2 p-4 text-xs leading-5 text-slate-500">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Current scope
        </h3>
        <p>✓ browser save decoding</p>
        <p>✓ 4×4 cell minimap aggregation</p>
        <p>✓ fog masking</p>
        <p>✓ minimap zoom, pan, and layer toggles</p>
        <p>○ cell inspection</p>
      </section>
    </div>
  );
}

function Blueprints({
  document,
  onInspect,
  onCopy,
}: {
  document: SaveExplorerClientDocument;
  onInspect: (blueprintId: string) => void;
  onCopy: (blueprintId: string) => void;
}) {
  return (
    <section className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          Blueprints
        </h3>
        <span className="font-mono text-[10px] text-slate-500">{document.blueprints.length}</span>
      </div>
      {document.blueprints.length ? (
        <div className="space-y-3">
          {document.blueprints.map((blueprint) => (
            <BlueprintEntry
              key={blueprint.id}
              blueprint={blueprint}
              onInspect={onInspect}
              onCopy={onCopy}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs leading-5 text-slate-500">No valid saved blueprints were found.</p>
      )}
    </section>
  );
}

function BlueprintEntry({
  blueprint,
  onInspect,
  onCopy,
}: {
  blueprint: SaveBlueprintSummary;
  onInspect: (blueprintId: string) => void;
  onCopy: (blueprintId: string) => void;
}) {
  return (
    <article className="space-y-2 rounded border border-slate-800 bg-slate-950/40 p-2.5">
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-200" title={blueprint.name}>
          {blueprint.name}
        </p>
        <p className="text-[11px] text-slate-500">
          {blueprint.structureCount} structure{blueprint.structureCount === 1 ? "" : "s"}
          {blueprint.createdAt !== undefined
            ? ` · ${new Date(blueprint.createdAt).toLocaleDateString()}`
            : ""}
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="button" className="text-[11px]" onClick={() => onInspect(blueprint.id)}>
          Inspect
        </Button>
        <Button
          type="button"
          className="text-[11px]"
          variant="quiet"
          onClick={() => onCopy(blueprint.id)}
        >
          Copy string
        </Button>
      </div>
    </article>
  );
}
