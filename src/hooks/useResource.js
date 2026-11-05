"use client";
import { useCallback, useEffect, useState } from "react";
import { get, apiError } from "@/services/api/client";

/**
 * GET a resource with loading/error/reload. Keeps old data visible while refetching.
 * `refreshKey`: refetch whenever it changes (e.g. the live auction state version).
 */
export function useResource(url, params, refreshKey) {
  const key = url ? `${url}?${new URLSearchParams(params || {}).toString()}` : null;
  const [tick, setTick] = useState(0);
  const [res, setRes] = useState({ key: null, tick: -1, data: null, error: null });

  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    get(key).then(
      (data) => alive && setRes({ key, tick, data, error: null }),
      (e) => alive && setRes((r) => ({ key, tick, data: r.data, error: apiError(e) })),
    );
    return () => { alive = false; };
  }, [key, tick, refreshKey]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const loading = !!key && (res.key !== key || res.tick !== tick);
  return { data: res.data, error: res.error, loading, reload };
}

/** Wraps a mutation: pending flag, toast on success/failure, prevents double submit. */
export function useAction(toast) {
  const [pending, setPending] = useState(null);
  const run = useCallback(async (name, fn, successMsg) => {
    if (pending) return { ok: false };
    setPending(name);
    try {
      const data = await fn();
      if (successMsg) toast.success(typeof successMsg === "function" ? successMsg(data) : successMsg);
      return { ok: true, data };
    } catch (e) {
      const error = apiError(e);
      toast.error(error.message);
      return { ok: false, error };
    } finally { setPending(null); }
  }, [pending, toast]);
  return { pending, run };
}
