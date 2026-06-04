import { useState, useCallback } from "react";
import type { ApiState } from "@/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(async (endpoint: string, options?: RequestInit) => {
    setState({ data: null, loading: true, error: null });
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setState({ data, loading: false, error: null });
      return data as T;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setState({ data: null, loading: false, error: msg });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, request, reset };
}

export function useFileUpload<T>() {
  const [state, setState] = useState<ApiState<T> & { progress: number }>({
    data: null, loading: false, error: null, progress: 0,
  });

  const upload = useCallback(async (endpoint: string, file: File) => {
    setState({ data: null, loading: true, error: null, progress: 0 });
    try {
      const formData = new FormData();
      // ✅ Fixed: field name must be "resume" to match Flask backend
      formData.append("resume", file);

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
      const data = await res.json();
      setState({ data, loading: false, error: null, progress: 100 });
      return data as T;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setState({ data: null, loading: false, error: msg, progress: 0 });
      throw err;
    }
  }, []);

  return { ...state, upload };
}