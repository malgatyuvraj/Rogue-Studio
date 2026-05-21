import { useState, useCallback } from "react";
import { isExternalProvider } from "@/lib/aiGate";

export function useAirGap() {
  const [airGapped, setAirGapped] = useState(false);

  const toggle = useCallback(() => setAirGapped(v => !v), []);

  // Call this before every fetch to /api/chat
  const getHeaders = useCallback((): Record<string, string> => ({
    "x-air-gap-mode": airGapped ? "true" : "false"
  }), [airGapped]);

  // Guard: if airGapped and external provider selected, return false
  const canRoute = useCallback((provider: string) => {
    if (airGapped && isExternalProvider(provider)) return false;
    return true;
  }, [airGapped]);

  return { airGapped, toggle, getHeaders, canRoute };
}
