import React, { useEffect } from "react";

// PUBLIC_INTERFACE
export default function Modal({ title, children, footer, onClose }) {
  /** Accessible modal dialog. Closes on Escape and overlay click.
   * @param {string} title Modal title
   * @param {React.ReactNode} children Body content
   * @param {React.ReactNode} footer Footer content (buttons)
   * @param {()=>void} onClose Close handler
   */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modalOverlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="modal">
        <div className="modalHeader">
          <strong>{title}</strong>
          <button className="btn btnSm" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className="modalBody">{children}</div>
        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}
