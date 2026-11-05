"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);
const ICON = { success: CheckCircle2, error: AlertTriangle, info: Info };
const TONE = { success: "border-success/50", error: "border-danger/60", info: "border-info/50" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), type === "error" ? 7000 : 4000);
  }, [dismiss]);
  const api = useMemo(() => ({
    success: (m) => push("success", m), error: (m) => push("error", m), info: (m) => push("info", m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICON[t.type];
          return (
            <div key={t.id} className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border bg-surface-2 p-3 text-sm shadow-lg ${TONE[t.type]}`}>
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p className="flex-1">{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-muted hover:text-fg"><X className="size-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
