import { useEffect, useState } from "react";
import { createDragDepthTracker } from "@sandustry/ui";

export type GlobalFileDropOverlayProps = {
  onFileDrop: (file: File) => void;
  accept?: string;
  label?: string;
};

export function GlobalFileDropOverlay({
  onFileDrop,
  label = "Drop a Sandustry .save file here",
}: GlobalFileDropOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const tracker = createDragDepthTracker(() => setIsDragging);

    const handleDragEnter = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes("Files")) {
        tracker.enter(event);
      }
    };

    const handleDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes("Files")) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDragLeave = (event: DragEvent) => {
      tracker.leave(event);
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      tracker.drop(event);
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        onFileDrop(files[0]);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
      tracker.reset();
    };
  }, [onFileDrop]);

  if (!isDragging) return null;

  return (
    <div
      role="presentation"
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8 backdrop-blur-sm transition-opacity duration-150 animate-in fade-in"
    >
      <div className="flex max-w-lg flex-col items-center justify-center gap-4 rounded-xl border-4 border-dashed border-[var(--sd-color-primary,#ffe700)] bg-[var(--sd-color-surface-elevated,#262d37)]/90 p-12 text-center shadow-2xl">
        <div className="text-5xl animate-bounce">💾</div>
        <div className="text-lg font-bold tracking-wide text-[var(--sd-color-primary,#ffe700)]">
          {label}
        </div>
        <p className="text-xs text-[var(--sd-color-text-muted,#b6bcc1)]">
          Release to automatically parse and load
        </p>
      </div>
    </div>
  );
}
