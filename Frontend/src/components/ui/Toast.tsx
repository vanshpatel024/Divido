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
      <div className="fixed top-6 right-6 z-55 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-md border ${
                t.type === "success"
                  ? "bg-[#AAD9BB] border-[#8bc79f] text-[#1A5C3A]"
                  : "bg-red-50 border-red-100 text-red-700"
              }`}
            >
              {t.type === "success" ? (
                <CheckCircle2 size={18} className="shrink-0 text-[#1A5C3A]" />
              ) : (
                <AlertCircle size={18} className="shrink-0 text-red-600" />
              )}
              <span className="text-xs font-semibold tracking-wide font-sans">
                {t.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
