import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Badge, Button, IconButton, Popover, SaveSlotCard, StatusIndicator } from "@sandustry/ui";
import {
  deleteSavedGame,
  estimateStoredBytes,
  extractCurrencies,
  formatPlaytime,
  getSaveTag,
  listSavedGames,
  readActiveSaveId,
  setActiveSaveId,
  subscribeToSaveDatabase,
  type StoredSaveSummary,
} from "../utils/save-db";

import { ThemeToggle } from "./ThemeToggle";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    setSaves(
      listed.value.sort((a, b) => {
        const timeB = new Date(b.storedAt || b.saveTimestamp || 0).getTime();
        const timeA = new Date(a.storedAt || a.saveTimestamp || 0).getTime();
        return timeB - timeA;
      }),
    );
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
      className="w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-[var(--sd-color-border,#2a323d)] bg-[var(--sd-color-surface-elevated,#262d37)]/95 p-0 shadow-2xl backdrop-blur-md text-[var(--sd-color-text,#e8eef5)]"
      content={
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col text-xs"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--sd-color-border,#2a323d)] bg-[var(--sd-color-surface,#1c2127)]/80 px-3 py-2">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--sd-color-text,#e8eef5)]">
              <span>Stored saves</span>
              <Badge tone="default" className="px-1 py-0 text-[10px]">
                {saves.length}
              </Badge>
            </div>
            <span className="font-mono text-[10px] text-[var(--sd-color-text-muted,#b6bcc1)]">
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
            <div className="px-4 py-8 text-center text-[var(--sd-color-text-muted,#b6bcc1)]">
              <p className="font-medium text-[var(--sd-color-text,#e8eef5)]">
                No remembered saves yet
              </p>
              <p className="mt-1 text-[11px]">
                Drop a{" "}
                <code className="font-mono text-[var(--sd-color-primary,#ffe700)]">.save</code> file
                in Save Explorer or Inspector.
              </p>
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto p-2.5">
              {saves.map((save) => {
                const isActive = save.id === activeSave?.id;
                const currencies = extractCurrencies(save.resources);
                return (
                  <SaveSlotCard
                    key={save.id}
                    title={save.worldName || save.fileName}
                    tag={getSaveTag(save.fileName, save.saveName)}
                    timestamp={save.saveTimestamp ? save.saveTimestamp.slice(0, 10) : undefined}
                    level={save.factoryLevel}
                    structures={save.structureCount}
                    productionPoints={save.productionPoints}
                    playtime={formatPlaytime(save.playTime)}
                    currencies={currencies}
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
                          size="small"
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
                              size="small"
                              onClick={() => void confirmDelete(save)}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="quiet"
                              size="small"
                              onClick={() => setPendingDelete(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <IconButton
                            size="small"
                            label="Delete save"
                            className="h-5 w-5 p-0.5 text-slate-500 hover:text-red-400"
                            onClick={() => setPendingDelete(save.id)}
                          >
                            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
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
          <div className="border-t border-[var(--sd-color-border,#2a323d)] bg-[var(--sd-color-surface,#1c2127)]/40 p-2">
            <Button
              as={Link}
              to="/explorer"
              variant="quiet"
              size="small"
              className="w-full justify-center text-xs text-[var(--sd-color-text-muted,#b6bcc1)] hover:text-[var(--sd-color-primary,#ffe700)]"
              onClick={() => setOpen(false)}
            >
              Open in Save Explorer →
            </Button>
          </div>
        </motion.div>
      }
    >
      <button
        type="button"
        aria-label={activeSave ? `Saved saves, active save ${activeSave.fileName}` : "Saved saves"}
        className={`flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sd-color-primary,#ffe700)] ${
          open
            ? "border-[var(--sd-color-primary,#ffe700)] bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.1))] text-[var(--sd-color-primary,#ffe700)]"
            : activeSave
              ? "border-[var(--sd-color-border,#2a323d)] bg-[var(--sd-color-surface,#1c2127)]/60 text-[var(--sd-color-text,#e8eef5)] hover:border-[var(--sd-color-primary,#ffe700)]/50 hover:text-[var(--sd-color-primary,#ffe700)]"
              : "border-[var(--sd-color-border-subtle,#20262d)] bg-[var(--sd-color-surface-muted,#141414)]/40 text-[var(--sd-color-text-muted,#b6bcc1)] hover:border-[var(--sd-color-border,#2a323d)] hover:text-[var(--sd-color-text,#e8eef5)]"
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-[12px] leading-none">💾</span>
        <span className="max-w-28 truncate font-medium">
          {activeSave ? activeSave.worldName || activeSave.fileName : "Saves"}
        </span>
        {saves.length > 0 ? (
          <span className="rounded bg-[var(--sd-color-surface-elevated,#262d37)] px-1 py-0.2 font-mono text-[10px] tabular-nums text-[var(--sd-color-text-muted,#b6bcc1)]">
            {saves.length}
          </span>
        ) : null}
        <span className="text-[9px] text-[var(--sd-color-text-subtle,#808080)]">▾</span>
      </button>
    </Popover>
  );
}

export function Header() {
  const location = useLocation();

  return (
    <header
      data-site-header
      className="sticky top-0 z-40 border-b border-[var(--sd-color-border,#2a323d)]/80 bg-[var(--sd-color-bg,#181c20)]/85 shadow-lg backdrop-blur-sm transition-colors duration-200"
    >
      <div className="site-shell mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="shrink-0 font-mono text-sm font-bold tracking-[0.2em] text-[var(--sd-color-primary,#ffe700)]"
          >
            SANDUSTRY / TOOLS
          </Link>
          <SaveManager />
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex flex-wrap items-center justify-end gap-1 font-mono text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
            {[
              { to: "/inspect", label: "Blueprint Inspector" },
              { to: "/explorer", label: "Save Explorer" },
              { to: "/codec", label: "Encoder / Decoder" },
              ...(import.meta.env.DEV ? [{ to: "/components", label: "Components" }] : []),
            ].map((link) => {
              const isInspectActive =
                link.to === "/inspect" &&
                (location.pathname.startsWith("/inspect") ||
                  location.pathname.startsWith("/save/"));

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="relative rounded px-2.5 py-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sd-color-primary,#ffe700)]"
                >
                  {({ isActive }) => {
                    const active = isActive || isInspectActive;
                    return (
                      <>
                        {active && (
                          <motion.div
                            layoutId="active-site-nav-indicator"
                            className="pointer-events-none absolute inset-0 rounded border border-[var(--sd-color-primary,#ffe700)]/30 bg-[var(--sd-color-primary-soft,rgba(255,231,0,0.12))] shadow-sm"
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          />
                        )}
                        <span
                          className={`relative z-10 transition-colors ${
                            active
                              ? "font-semibold text-[var(--sd-color-primary,#ffe700)]"
                              : "text-[var(--sd-color-text-muted,#b6bcc1)] hover:text-[var(--sd-color-primary,#ffe700)]"
                          }`}
                        >
                          {link.label}
                        </span>
                      </>
                    );
                  }}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
