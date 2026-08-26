export const BLUEPRINT_RENDERER_NAMESPACE = "sandustry:blueprint-renderer" as const;
export const BLUEPRINT_RENDERER_PROTOCOL_VERSION = 1 as const;

export type BlueprintRendererMode = "thumbnail" | "inspector";

export type RendererRequest = {
  namespace: typeof BLUEPRINT_RENDERER_NAMESPACE;
  type: "set-blueprint";
  requestId: string;
  blueprint: string;
};

export type RendererReadyEvent = {
  namespace: typeof BLUEPRINT_RENDERER_NAMESPACE;
  type: "ready";
  protocolVersion: typeof BLUEPRINT_RENDERER_PROTOCOL_VERSION;
  modes: BlueprintRendererMode[];
};

export type RendererEvent = RendererReadyEvent;

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export function isRendererRequest(value: unknown): value is RendererRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<RendererRequest>;
  return (
    request.namespace === BLUEPRINT_RENDERER_NAMESPACE &&
    request.type === "set-blueprint" &&
    typeof request.requestId === "string" &&
    REQUEST_ID_PATTERN.test(request.requestId) &&
    typeof request.blueprint === "string"
  );
}

export function configuredParentOrigins(): string[] {
  const environment = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env;
  const configured = environment?.VITE_BLUEPRINT_PARENT_ORIGINS;
  if (typeof configured !== "string" || !configured.trim()) {
    return typeof window === "undefined" ? [] : [window.location.origin];
  }
  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => {
      try {
        return new URL(origin).origin === origin;
      } catch {
        return false;
      }
    });
}

export function isAllowedParentOrigin(origin: string, allowedOrigins = configuredParentOrigins()) {
  return allowedOrigins.includes(origin);
}

export function parentOrigin(allowedOrigins = configuredParentOrigins()): string | undefined {
  if (typeof window === "undefined" || window.parent === window) return undefined;
  try {
    const referrerOrigin = document.referrer ? new URL(document.referrer).origin : undefined;
    if (referrerOrigin && isAllowedParentOrigin(referrerOrigin, allowedOrigins)) {
      return referrerOrigin;
    }
  } catch {
    // Fall through to the configured development/deployment origin.
  }
  return allowedOrigins.length === 1 ? allowedOrigins[0] : undefined;
}

export function rendererReadyEvent(modes: BlueprintRendererMode[]): RendererReadyEvent {
  return {
    namespace: BLUEPRINT_RENDERER_NAMESPACE,
    type: "ready",
    protocolVersion: BLUEPRINT_RENDERER_PROTOCOL_VERSION,
    modes,
  };
}
