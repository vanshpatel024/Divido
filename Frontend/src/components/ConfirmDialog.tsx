import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Keyboard: Escape → cancel, Enter → confirm
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && !isLoading) onConfirm();
    },
    [isOpen, isLoading, onConfirm, onCancel]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const confirmBtnClass =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600 text-white"
      : "bg-[#2B2A4C] hover:bg-[#1f1e36] text-white";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={isLoading ? undefined : onCancel}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#E8E3D9] p-6 flex flex-col gap-4">
              {/* Icon + Title */}
              <div className="flex flex-col gap-1.5">
                {variant === "danger" && (
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-1">
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                )}
                <h2
                  id="confirm-dialog-title"
                  className="font-display text-lg font-bold text-[#2B2A4C] leading-snug"
                >
                  {title}
                </h2>
                <p
                  id="confirm-dialog-message"
                  className="text-sm text-[#6B6A7E] leading-relaxed font-sans"
                >
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  id="confirm-dialog-cancel"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-[#E8E3D9] bg-white text-sm font-semibold text-[#2B2A4C] py-2.5 px-4 hover:bg-[#F5F0E8] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {cancelLabel}
                </button>
                <button
                  id="confirm-dialog-confirm"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 rounded-xl text-sm font-semibold py-2.5 px-4 transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 ${confirmBtnClass}`}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    confirmLabel
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
