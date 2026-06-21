import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { Trip } from "../types";

interface DeleteTripConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  onConfirm?: (tripId: string) => void;
  isDeleting?: boolean;
}

export default function DeleteTripConfirmModal({
  isOpen,
  onClose,
  trip,
  onConfirm,
  isDeleting = false,
}: DeleteTripConfirmModalProps) {

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen || !trip) return null;

  const isDeletable = trip.end_date && trip.balance.kind === 'settled';

  const handleDelete = () => {
    if (!isDeletable || isDeleting) return;
    if (onConfirm) {
      onConfirm(trip.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          if (!isDeleting) onClose();
        }}
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
          This will permanently remove you from <span className="font-semibold text-[#2B2A4C]">{trip.name}</span>. If you are the last participant, the trip will be completely deleted.
        </p>

        {!isDeletable && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
            {!trip.end_date ? (
              <p>You cannot delete or leave this trip because it hasn't ended yet.</p>
            ) : trip.balance.kind !== 'settled' ? (
              <p>You cannot delete or leave this trip because your balance is not settled.</p>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 select-none">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className={`rounded-full border border-[#2B2A4C] px-5 py-2 text-xs font-bold text-[#2B2A4C] transition-colors duration-200 bg-white ${
              isDeleting ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F5F0E8] cursor-pointer"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isDeletable || isDeleting}
            className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-bold transition-colors duration-200 min-w-20 ${
              isDeleting
                ? "bg-red-300 text-white cursor-not-allowed"
                : isDeletable 
                ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer" 
                : "bg-red-200 text-white cursor-not-allowed"
            }`}
          >
            {isDeleting ? (
              <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
