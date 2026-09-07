import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import cx from "clsx";

export type FileRejection = {
  file?: File;
  reason: "accept" | "disabled" | "multiple";
};

export type FileDropZoneRenderState = {
  dragging: boolean;
  disabled: boolean;
  openFileDialog: () => void;
};

export type FileDropZoneProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "onDrop"> & {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  dragging?: boolean;
  clickable?: boolean;
  activeClassName?: string;
  disabledClassName?: string;
  inputRef?: Ref<HTMLInputElement>;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  onDraggingChange?: (dragging: boolean) => void;
  onFile?: (file: File) => void;
  onFiles?: (files: File[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  children?: ReactNode | ((state: FileDropZoneRenderState) => ReactNode);
};

export function createDragDepthTracker(
  callbackOrGetter: ((dragging: boolean) => void) | (() => (dragging: boolean) => void),
) {
  let depth = 0;
  const notify = (dragging: boolean) => {
    const result = (callbackOrGetter as (d?: boolean) => unknown)(dragging);
    if (typeof result === "function") {
      (result as (d: boolean) => void)(dragging);
    }
  };

  return {
    enter(event?: { preventDefault?: () => void }) {
      event?.preventDefault?.();
      depth += 1;
      if (depth === 1) {
        notify(true);
      }
    },
    leave(event?: { preventDefault?: () => void }) {
      event?.preventDefault?.();
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        notify(false);
      }
    },
    drop(event?: { preventDefault?: () => void }) {
      event?.preventDefault?.();
      depth = 0;
      notify(false);
    },
    reset() {
      depth = 0;
    },
    get depth() {
      return depth;
    },
  };
}

export function isFileAccepted(file: File, accept?: string): boolean {
  if (!accept) return true;
  const items = accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (items.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const fileType = (file.type || "").toLowerCase();
  const baseMime = fileType.split(";")[0].trim();

  return items.some((item) => {
    if (item.startsWith(".")) {
      return fileName.endsWith(item);
    }
    if (item.endsWith("/*")) {
      const prefix = item.slice(0, -1);
      return baseMime.startsWith(prefix);
    }
    return baseMime === item || fileType === item;
  });
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
  } else if ("current" in ref) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

export function FileDropZone({
  accept,
  multiple = false,
  disabled = false,
  dragging: controlledDragging,
  clickable = false,
  activeClassName = "",
  disabledClassName = "",
  inputRef,
  inputProps,
  onDraggingChange,
  onFile,
  onFiles,
  onReject,
  className = "",
  tabIndex,
  role,
  children,
  onKeyDown,
  onClick,
  onDragEnter,
  onDragOver,
  onDragLeave,
  ...props
}: FileDropZoneProps) {
  const [uncontrolledDragging, setUncontrolledDragging] = useState(false);
  const isDragging = controlledDragging !== undefined ? controlledDragging : uncontrolledDragging;

  const internalInputRef = useRef<HTMLInputElement | null>(null);

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      internalInputRef.current = node;
      assignRef(inputRef, node);
    },
    [inputRef],
  );

  const onDraggingChangeRef = useRef(onDraggingChange);
  onDraggingChangeRef.current = onDraggingChange;

  const trackerRef = useRef<ReturnType<typeof createDragDepthTracker> | null>(null);
  if (!trackerRef.current) {
    trackerRef.current = createDragDepthTracker((dragging: boolean) => {
      setUncontrolledDragging(dragging);
      onDraggingChangeRef.current?.(dragging);
    });
  }

  useEffect(() => {
    if (!isDragging) {
      trackerRef.current?.reset();
    }
  }, [isDragging]);

  const openFileDialog = useCallback(() => {
    if (disabled) return;
    internalInputRef.current?.click();
  }, [disabled]);

  const handleFiles = useCallback(
    (fileList: FileList | File[] | null | undefined) => {
      if (!fileList || disabled) {
        if (disabled && fileList && fileList.length > 0) {
          onReject?.(Array.from(fileList).map((file) => ({ file, reason: "disabled" })));
        }
        return;
      }

      const files = Array.from(fileList);
      if (files.length === 0) return;

      const accepted: File[] = [];
      const rejected: FileRejection[] = [];

      if (!multiple && files.length > 1) {
        // If multiple is false and more than 1 dropped, first is candidate, rest rejected as multiple
        for (let i = 1; i < files.length; i++) {
          rejected.push({ file: files[i], reason: "multiple" });
        }
      }

      const candidates = multiple ? files : [files[0]];
      for (const candidate of candidates) {
        if (isFileAccepted(candidate, accept)) {
          accepted.push(candidate);
        } else {
          rejected.push({ file: candidate, reason: "accept" });
        }
      }

      if (rejected.length > 0) {
        onReject?.(rejected);
      }

      if (accepted.length > 0) {
        onFiles?.(accepted);
        if (onFile) {
          onFile(accepted[0]);
        }
      }

      // Reset input value so re-selecting same file triggers change
      if (internalInputRef.current) {
        internalInputRef.current.value = "";
      }
    },
    [disabled, multiple, accept, onReject, onFiles, onFile],
  );

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    onDragEnter?.(event);
    if (disabled) return;
    trackerRef.current?.enter(event);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    onDragOver?.(event);
    event.preventDefault();
    if (disabled) {
      event.dataTransfer.dropEffect = "none";
    } else {
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    onDragLeave?.(event);
    if (disabled) return;
    trackerRef.current?.leave(event);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) {
      trackerRef.current?.drop(event);
      onReject?.([{ reason: "disabled" }]);
      return;
    }
    trackerRef.current?.drop(event);
    handleFiles(event.dataTransfer.files);
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || disabled || !clickable) return;

    const target = event.target as HTMLElement | null;
    const isInteractive = target?.closest(
      "button, a, input, select, textarea, [role='button'], [tabindex='0']",
    );
    if (!isInteractive || isInteractive === event.currentTarget) {
      openFileDialog();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled) return;

    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openFileDialog();
    }
  };

  const renderState: FileDropZoneRenderState = {
    dragging: isDragging,
    disabled,
    openFileDialog,
  };

  const effectiveTabIndex = tabIndex !== undefined ? tabIndex : clickable ? 0 : undefined;
  const effectiveRole = role !== undefined ? role : clickable ? "button" : undefined;

  return (
    <div
      {...props}
      role={effectiveRole}
      tabIndex={effectiveTabIndex}
      aria-disabled={disabled || undefined}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cx(
        "relative",
        className,
        isDragging && activeClassName,
        disabled && disabledClassName,
      )}
    >
      <input
        {...inputProps}
        ref={setInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className={cx("sr-only", inputProps?.className)}
        onChange={(event) => {
          inputProps?.onChange?.(event);
          handleFiles(event.target.files);
        }}
      />
      {typeof children === "function" ? children(renderState) : children}
    </div>
  );
}
