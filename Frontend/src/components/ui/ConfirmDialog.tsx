import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  /** Optional block rendered between the message and the buttons (e.g. a warning notice) */
  extraContent?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  /** Icon element rendered in a coloured circle above the title */
  iconNode?: React.ReactNode;
  iconVariant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  /** Disables the confirm button independently of loading state */
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  extraContent,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  iconNode,
  iconVariant = "danger",
  isLoading = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useBodyScrollLock(isOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape" && !isLoading) onCancel();
      if (e.key === "Enter" && !isLoading && !confirmDisabled) onConfirm();
    },
    [isOpen, isLoading, confirmDisabled, onConfirm, onCancel],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const iconBgClass =
    iconVariant === "danger"
      ? "bg-destructive/10 text-destructive"
      : iconVariant === "warning"
        ? "bg-amber-500/10 text-amber-500"
        : "bg-primary/10 text-primary";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={isLoading ? undefined : onCancel}
            aria-hidden="true"
          />

          {/* ── Dialog card ── */}
          <motion.div
            key="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="pointer-events-auto w-full max-w-sm bg-card/95 backdrop-blur-xl border border-border/40 p-6 flex flex-col gap-5 rounded-2xl shadow-2xl text-foreground font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon + Title + Message */}
              <div className="flex flex-col gap-2">
                {iconNode && (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 shrink-0 ${iconBgClass}`}
                  >
                    {iconNode}
                  </div>
                )}
                <h2
                  id="confirm-dialog-title"
                  className={`font-display text-xl font-bold leading-snug ${
                    variant === "danger"
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  {title}
                </h2>
                <p
                  id="confirm-dialog-message"
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {message}
                </p>
              </div>

              {/* Optional extra block */}
              {extraContent}

              {/* Actions — right-aligned pill buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                <Button
                  id="confirm-dialog-cancel"
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  variant="dark-outline"
                  shape="pill"
                  size="sm"
                  className="w-auto"
                >
                  {cancelLabel}
                </Button>
                <Button
                  id="confirm-dialog-confirm"
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading || confirmDisabled}
                  isLoading={isLoading}
                  variant={variant === "danger" ? "danger" : "dark"}
                  shape="pill"
                  size="sm"
                  className="w-auto min-w-[5rem]"
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
