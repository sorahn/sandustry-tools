import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button, Dialog, StatusIndicator } from "@sandustry/ui";
import {
  deleteSavedGame,
  estimateStoredBytes,
  listSavedGames,
  readActiveSaveId,
  setActiveSaveId,
  type StoredSaveSummary,
} from "../utils/save-db";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SaveManager() {
  const [open, setOpen] = useState(false);
  const [saves, setSaves] = useState<StoredSaveSummary[]>([]);
  const [usage, setUsage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const managerButtonRef = useRef<HTMLButtonElement>(null);

  const refresh = async () => {
    setError(null);
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
  }, [open]);

  const activeSave = saves.find((save) => save.id === readActiveSaveId()) ?? saves[0];

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
    <>
      <button
        type="button"
        ref={managerButtonRef}
        aria-label={
          activeSave ? `Open save manager, active save ${activeSave.fileName}` : "Open save manager"
        }
        className="rounded border border-slate-700 px-2 py-1 text-left text-[10px] text-slate-400 transition-colors hover:border-yellow-300/60 hover:text-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300"
        onClick={() => setOpen(true)}
      >
        <span className="block text-[9px] uppercase tracking-wider text-slate-500">
          Saved saves
        </span>
        <span className="block max-w-32 truncate">{activeSave ? activeSave.fileName : "None"}</span>
      </button>
      <Dialog
        open={open}
        title="Save manager"
        onClose={() => {
          setOpen(false);
          managerButtonRef.current?.focus();
        }}
        className="max-w-2xl"
      >
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span>
              {saves.length} stored save{saves.length === 1 ? "" : "s"}
            </span>
            <span>
              {usage === null ? "Storage estimate unavailable" : `${formatBytes(usage)} used`}
            </span>
          </div>
          {error ? <StatusIndicator tone="danger">{error}</StatusIndicator> : null}
          {saves.length === 0 && !error ? (
            <p className="py-6 text-center text-sm text-slate-500">No remembered saves yet.</p>
          ) : (
            <div className="space-y-2" aria-label="Stored saves">
              {saves.map((save) => (
                <div key={save.id} className="rounded border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-slate-100">{save.fileName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {save.worldName ?? "Unknown world"} · {save.blueprintCount} blueprint
                        {save.blueprintCount === 1 ? "" : "s"} · {formatBytes(save.byteLength)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        as={Link}
                        to="/explorer"
                        variant="accent"
                        className="compact"
                        onClick={() => setActiveSaveId(save.id)}
                      >
                        Use in Explorer
                      </Button>
                      {pendingDelete === save.id ? (
                        <>
                          <Button
                            variant="danger"
                            className="compact"
                            onClick={() => void confirmDelete(save)}
                          >
                            Confirm delete
                          </Button>
                          <Button
                            variant="quiet"
                            className="compact"
                            onClick={() => setPendingDelete(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="danger"
                          className="compact"
                          onClick={() => setPendingDelete(save.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}

export function Header() {
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 border-b border-slate-800/80 bg-black/85 shadow-lg backdrop-blur-sm"
    >
      <div className="site-shell mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link to="/" className="font-mono text-sm font-bold tracking-[0.2em] text-yellow-300">
          SANDUSTRY / TOOLS
        </Link>
        <div className="flex min-w-0 items-center gap-4">
          <nav className="flex flex-wrap justify-end gap-x-4 gap-y-1 font-mono text-xs text-slate-400">
            <Link to="/" activeProps={{ className: "text-yellow-300" }}>
              Home
            </Link>
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
          <SaveManager />
        </div>
      </div>
    </header>
  );
}
