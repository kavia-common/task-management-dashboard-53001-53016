import React, { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  /** Provides toast notifications (success/info/warn/error). */
  const [toasts, setToasts] = useState([]);

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // PUBLIC_INTERFACE
  const push = ({ title, message, variant = "info", timeoutMs = 5000 }) => {
    /** Push a toast message to the stack. */
    const id = makeId();
    setToasts((prev) => [{ id, title, message, variant }, ...prev].slice(0, 5));
    if (timeoutMs > 0) setTimeout(() => remove(id), timeoutMs);
    return id;
  };

  const value = useMemo(() => ({ toasts, push, remove }), [toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toastStack" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className="toast" role="status" aria-live="polite">
            <div className="toastIcon" aria-hidden="true">
              {t.variant === "error"
                ? "!"
                : t.variant === "success"
                  ? "✓"
                  : t.variant === "warn"
                    ? "•"
                    : "i"}
            </div>
            <div className="toastContent">
              <p className="toastTitle">{t.title || "Update"}</p>
              <p className="toastMsg">{t.message}</p>
            </div>
            <button className="toastClose" onClick={() => remove(t.id)} aria-label="Close notification">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useToast() {
  /** Hook to access toast actions. */
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
