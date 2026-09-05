import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge, Button, IconButton, Popover, SaveSlotCard, StatusIndicator } from "@sandustry/ui";
import {
  deleteSavedGame,
  estimateStoredBytes,
  listSavedGames,
  readActiveSaveId,
  setActiveSaveId,
  subscribeToSaveDatabase,
  type StoredSaveSummary,
} from "../utils/save-db";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPlaytime(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function getSaveTag(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("auto")) return "Autosave";
  if (lower.includes("exit")) return "Exit save";
  if (lower.includes("quick")) return "Quicksave";
  return "Save";
}

function SaveManager() {
  const [open, setOpen] = useState(false);
  const [saves, setSaves] = useState<StoredSaveSummary[]>([]);
  const [activeSaveId, setActiveSaveIdState] = useState<string | null>(() => readActiveSaveId());
  const [usage, setUsage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const refresh = async () => {
    setError(null);
    setActiveSaveIdState(readActiveSaveId());
    const listed = await listSavedGames();
    if (!listed.ok) {
      setError(listed.error.message);
      return;
    }
    setSaves(listed.value.sort((a, b) => b.storedAt.localeCompare(a.storedAt)));
    const estimated = await estimateStoredBytes();
    if (estimated.ok) setUsage(estimated.value);
  };

  useEffect(() => {
    void refresh();
    return subscribeToSaveDatabase((event) => {
      if (event.type === "active-save-changed") {
        setActiveSaveIdState(event.saveId);
      }
      void refresh();
    });
  }, []);

  useEffect(() => {
    if (open) void refresh();
  }, [open]);

  const activeSave = activeSaveId ? saves.find((save) => save.id === activeSaveId) : undefined;

  const handleSelectSave = (saveId: string) => {
    setActiveSaveId(saveId);
    void refresh();
  };

  const confirmDelete = async (save: StoredSaveSummary) => {
    setPendingDelete(null);
    const result = await deleteSavedGame(save.id);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await refresh();
  };

  return (
    <Popover
      open={open}
      onClose={() => {
        setOpen(false);
        setPendingDelete(null);
      }}
      side="bottom"
      className="w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-800 bg-slate-950/95 p-0 shadow-2xl backdrop-blur-md"
      content={
        <div className="flex flex-col text-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-3 py-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <span>Stored saves</span>
              <Badge tone="default" className="px-1 py-0 text-[10px]">
                {saves.length}
              </Badge>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              {usage !== null ? `${formatBytes(usage)} used` : ""}
            </span>
          </div>

          {error ? (
            <div className="p-2">
              <StatusIndicator tone="danger">{error}</StatusIndicator>
            </div>
          ) : null}

          {/* Saves List */}
          {saves.length === 0 && !error ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <p className="font-medium text-slate-400">No remembered saves yet</p>
              <p className="mt-1 text-[11px]">
                Drop a <code className="font-mono text-slate-400">.save</code> file in Save Explorer
                or Inspector.
              </p>
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto p-2.5">
              {saves.map((save) => {
                const isActive = save.id === activeSave?.id;
                return (
                  <SaveSlotCard
                    key={save.id}
                    title={save.worldName || save.fileName}
                    tag={getSaveTag(save.fileName)}
                    timestamp={save.saveTimestamp ? save.saveTimestamp.slice(0, 10) : undefined}
                    structures={save.structureCount}
                    playtime={formatPlaytime(save.playTime)}
                    selected={isActive}
                    onClick={() => handleSelectSave(save.id)}
                    className="cursor-pointer"
                    actions={
                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          as={Link}
                          to="/explorer"
                          variant={isActive ? "accent" : "quiet"}
                          className="compact text-[11px]"
                          onClick={() => {
                            setActiveSaveId(save.id);
                            setOpen(false);
                          }}
                        >
                          {isActive ? "Explore" : "Select"}
                        </Button>
                        {pendingDelete === save.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="danger"
                              className="compact text-[11px]"
                              onClick={() => void confirmDelete(save)}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="quiet"
                              className="compact text-[11px]"
                              onClick={() => setPendingDelete(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <IconButton
                            size="small"
                            label="Delete save"
                            className="text-slate-500 hover:text-red-400"
                            onClick={() => setPendingDelete(save.id)}
                          >
                            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                              <path
                                fillRule="evenodd"
                                d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A1.25 1.25 0 0 0 9.75 2h-3.5A1.25 1.25 0 0 0 5 3.25Zm1.5.75h3v-.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25V4Zm-.5 3a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5Zm3.5.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0v-5Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </IconButton>
                        )}
                      </div>
                    }
                  />
                );
              })}
            </div>
          )}

          {/* Footer Link */}
          <div className="border-t border-slate-800 bg-slate-900/40 p-2">
            <Button
              as={Link}
              to="/explorer"
              variant="quiet"
              className="compact w-full justify-center text-xs text-slate-400 hover:text-yellow-300"
              onClick={() => setOpen(false)}
            >
              Open in Save Explorer →
            </Button>
          </div>
        </div>
      }
    >
      <button
        type="button"
        aria-label={activeSave ? `Saved saves, active save ${activeSave.fileName}` : "Saved saves"}
        className={`flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300 ${
          open
            ? "border-yellow-400/80 bg-yellow-400/10 text-yellow-300"
            : activeSave
              ? "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-yellow-400/50 hover:text-yellow-300"
              : "border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700 hover:text-slate-300"
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-[12px] leading-none">💾</span>
        <span className="max-w-28 truncate font-medium">
          {activeSave ? activeSave.worldName || activeSave.fileName : "Saves"}
        </span>
        {saves.length > 0 ? (
          <span className="rounded bg-slate-800 px-1 py-0.2 font-mono text-[10px] tabular-nums text-slate-400">
            {saves.length}
          </span>
        ) : null}
        <span className="text-[9px] text-slate-500">▾</span>
      </button>
    </Popover>
  );
}

export function Header() {
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 border-b border-slate-800/80 bg-black/85 shadow-lg backdrop-blur-sm"
    >
      <div className="site-shell mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="shrink-0 font-mono text-sm font-bold tracking-[0.2em] text-yellow-300"
          >
            SANDUSTRY / TOOLS
          </Link>
          <SaveManager />
        </div>
        <nav className="flex flex-wrap justify-end gap-x-4 gap-y-1 font-mono text-xs text-slate-400">
          <Link to="/inspect" activeProps={{ className: "text-yellow-300" }}>
            Blueprint Inspector
          </Link>
          <Link to="/explorer" activeProps={{ className: "text-yellow-300" }}>
            Save Explorer
          </Link>
          <Link to="/codec" activeProps={{ className: "text-yellow-300" }}>
            Encoder / Decoder
          </Link>
          {import.meta.env.DEV ? (
            <>
              <Link to="/components" activeProps={{ className: "text-yellow-300" }}>
                Components
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
