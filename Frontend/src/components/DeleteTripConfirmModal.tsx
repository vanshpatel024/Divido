import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useToast } from "./Toast";
import type { Trip } from "../types";

interface DeleteTripConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  onConfirm?: (tripId: string) => void;
}

export default function DeleteTripConfirmModal({
  isOpen,
  onClose,
  trip,
  onConfirm,
}: DeleteTripConfirmModalProps) {
  const { showToast } = useToast();

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !trip) return null;

  const handleDelete = () => {
    console.log("delete trip", trip.id);
    if (onConfirm) {
      onConfirm(trip.id);
    }
    showToast(`Trip "${trip.name}" deleted`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-xs cursor-pointer"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#EFECE6] rounded-2xl w-full max-w-sm p-6 shadow-xl relative z-10 font-sans"
      >
        <div className="flex items-center gap-3 mb-4 select-none">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle size={20} />
          </div>
          <h3 className="font-display text-xl font-bold text-[#2B2A4C]">
            Delete Trip?
          </h3>
        </div>

        <p className="text-sm text-[#8B8A9B] leading-relaxed mb-6">
          This will permanently delete <span className="font-semibold text-[#2B2A4C]">{trip.name}</span> and all its stops and transactions. This cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-2.5 select-none">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#2B2A4C] px-5 py-2 text-xs font-bold text-[#2B2A4C] hover:scale-[1.02] transition-transform duration-200 cursor-pointer bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full bg-red-500 hover:bg-red-600 text-white px-5 py-2 text-xs font-bold hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}
