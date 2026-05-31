import { useState, useCallback, useRef } from "react";

interface OllamaModel {
  name: string;
  size: number;
  modified: string;
}

interface ModelsState {
  available: boolean;
  models: OllamaModel[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to auto-detect available Ollama models on the local machine.
 * Probes /api/models on mount and exposes a refresh function.
 */
export function useModels() {
  const [state, setState] = useState<ModelsState>({
    available: false,
    models: [],
    loading: true,
    error: null,
  });
  const didFetch = useRef<boolean | null>(null);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      setState({
        available: data.available,
        models: data.models || [],
        loading: false,
        error: data.available ? null : data.error,
      });
    } catch (err: unknown) {
      setState({
        available: false,
        models: [],
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch models",
      });
    }
  }, []);

  // Auto-fetch once on first render
  if (didFetch.current == null) {
    didFetch.current = true;
    queueMicrotask(() => refresh());
  }

  return { ...state, refresh };
}
