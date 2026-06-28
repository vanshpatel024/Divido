import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { Trip } from "../../types";
import Button from "../ui/Button";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

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
  const [cachedTrip, setCachedTrip] = useState<Trip | null>(trip);

  useEffect(() => {
    if (trip) {
      setCachedTrip(trip);
    }
  }, [trip]);

  // Apply scroll lock hook
  useBodyScrollLock(isOpen);

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

  if (!cachedTrip) return null;

  const isDeletable = cachedTrip.end_date && cachedTrip.balance.kind === 'settled';

  const handleDelete = () => {
    if (!isDeletable || isDeleting) return;
    if (onConfirm) {
      onConfirm(cachedTrip.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={() => {
          if (!isDeleting) onClose();
        }}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative z-10 font-sans text-foreground"
      >
        <div className="flex items-center gap-3 mb-4 select-none">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle size={20} />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">
            Leave Trip?
          </h3>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          This will permanently remove you from <span className="font-semibold text-foreground">{cachedTrip.name}</span>. If you are the last participant, the trip will be completely deleted.
        </p>

        {!isDeletable && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium">
            {!cachedTrip.end_date ? (
              <p>You cannot leave this trip because it hasn't ended yet.</p>
            ) : cachedTrip.balance.kind !== 'settled' ? (
              <p>You cannot leave this trip because your balance is not settled.</p>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 select-none">
          <Button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            variant="dark-outline"
            shape="pill"
            size="sm"
            className="w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={!isDeletable || isDeleting}
            isLoading={isDeleting}
            variant="danger"
            shape="pill"
            size="sm"
            className="w-auto min-w-20"
          >
            Leave
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
