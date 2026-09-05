import { type ReactNode } from "react";
import { Button, Keycap, MetadataRow, Panel, TextArea, Toast } from "@sandustry/ui";
import { type Blueprint } from "../utils/blueprint";
import { primaryModifierKey } from "../utils/platform";

export type BlueprintSummary = {
  format: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  types: number;
  numericTypes: number;
  stringTypes: number;
  filters: number;
  dataRecords: number;
  links: number;
};

type BlueprintSubmissionPanelProps = {
  encoded: string;
  message: string;
  rememberHeader: ReactNode;
  onEncodedChange: (value: string) => void;
  onClear: () => void;
  onInspect: () => void;
  summary: BlueprintSummary | null;
  blueprint: Blueprint | null;
};

export function BlueprintSubmissionPanel({
  encoded,
  message,
  rememberHeader,
  onEncodedChange,
  onClear,
  onInspect,
  summary,
  blueprint,
}: BlueprintSubmissionPanelProps) {
  const modKey = primaryModifierKey();

  return (
    <Panel title="Blueprint string" header={rememberHeader}>
      <div className="space-y-4 p-4">
        <label htmlFor="blueprint-submission-input" className="sr-only">
          Blueprint string
        </label>
        <TextArea
          id="blueprint-submission-input"
          aria-label="Blueprint string"
          aria-describedby={message ? "blueprint-submission-message" : undefined}
          value={encoded}
          onChange={(event) => onEncodedChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              onInspect();
            }
          }}
          placeholder="SAND:BP:v2:..."
          spellCheck={false}
          className="min-h-48 placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-yellow-400/80"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Button variant="solid" onClick={onInspect}>
              Inspect blueprint
            </Button>
            <span className="hidden items-center gap-1 font-mono text-[11px] text-slate-500 sm:inline-flex">
              <Keycap>{modKey}</Keycap>+<Keycap>Enter</Keycap>
            </span>
          </div>
          <Button variant="danger" onClick={onClear}>
            Clear input
          </Button>
        </div>
        {message ? (
          <Toast id="blueprint-submission-message" variant="hint" message={message} />
        ) : null}
        {blueprint && summary ? (
          <div className="space-y-3 border-t border-slate-800 pt-4 text-xs text-slate-300">
            <p className="font-mono font-medium text-yellow-200">
              {blueprint.name} · {summary.format}
            </p>
            <MetadataRow
              items={[
                { label: "Structures", value: blueprint.data.length, tone: "accent" },
                {
                  label: "Types",
                  value: `${summary.types} (${summary.numericTypes} native / ${summary.stringTypes} string)`,
                },
                {
                  label: "Bounds",
                  value: `${summary.minX},${summary.minY} → ${summary.maxX},${summary.maxY}`,
                },
                {
                  label: "Details",
                  value: `${summary.links} links · ${summary.filters} filters · ${summary.dataRecords} data`,
                  tone: "muted",
                },
              ]}
            />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
