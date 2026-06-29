import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

type ToastType = "success" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToasts((prev) => {
      // Deduplicate: skip if an identical message is already visible
      if (prev.some((t) => t.message === message)) return prev;
      const id = Math.random().toString(36).substring(2, 9);
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 2500);
      return [...prev, { id, message, type }];
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-auto sm:right-6 sm:w-96 z-50 flex flex-col gap-3 pointer-events-none select-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-center gap-3 rounded-2xl p-4 bg-card/90 backdrop-blur-xl border border-border shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              {t.type === "success" ? (
                <CheckCircle2 size={20} className="shrink-0 text-status-getback-text" />
              ) : (
                <AlertCircle size={20} className="shrink-0 text-destructive" />
              )}
              <span className="text-[13px] font-medium text-foreground font-sans leading-tight">
                {t.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
