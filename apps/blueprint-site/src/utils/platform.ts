export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  if (nav.userAgentData?.platform) {
    return /^mac/i.test(nav.userAgentData.platform);
  }
  return /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent);
}

export function primaryModifierKey(): "Cmd" | "Ctrl" {
  return isMacPlatform() ? "Cmd" : "Ctrl";
}
