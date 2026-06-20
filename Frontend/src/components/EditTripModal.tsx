import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Plus, Utensils, Building2, Car, Plane, Ticket, ShoppingBag } from "lucide-react";
import { useToast } from "./Toast";
import type { Trip, Category } from "../types";

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip | null;
  onSave?: (updatedData: any) => void;
}

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: "food", label: "Food", icon: <Utensils size={14} /> },
  { value: "hotel", label: "Hotel", icon: <Building2 size={14} /> },
  { value: "transport", label: "Transport", icon: <Car size={14} /> },
  { value: "flight", label: "Flight", icon: <Plane size={14} /> },
  { value: "entertainment", label: "Entertainment", icon: <Ticket size={14} /> },
  { value: "shopping", label: "Shopping", icon: <ShoppingBag size={14} /> } as any
];

export default function EditTripModal({ isOpen, onClose, trip, onSave }: EditTripModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [dates, setDates] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  // Initialize fields with trip data
  useEffect(() => {
    if (trip) {
      setName(trip.name);
      setDates(trip.dates);
      setParticipants(trip.participants.map((p) => p.name));
      setSelectedCategories(trip.categories);
    }
  }, [trip, isOpen]);

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

  const handleAddParticipant = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = participantInput.trim();
    if (!trimmed) return;
    if (participants.includes(trimmed)) {
      showToast("Participant already added", "error");
      return;
    }
    setParticipants([...participants, trimmed]);
    setParticipantInput("");
  };

  const handleRemoveParticipant = (pName: string) => {
    setParticipants(participants.filter((p) => p !== pName));
  };

  const handleToggleCategory = (cat: Category) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showToast("Trip name is required", "error");
      return;
    }
    if (participants.length === 0) {
      showToast("At least 1 participant is required", "error");
      return;
    }

    const updatedData = {
      ...trip,
      name,
      dates, // Keep current dates or update
      participants: participants.map((p) => {
        // preserve existing colors if possible, else generate new
        const existing = trip.participants.find((ep) => ep.name === p);
        return {
          name: p,
          color: existing ? existing.color : ["#AAD9BB", "#C9B7E0", "#F7DCB9", "#FBC4AB", "#B7D4E0"][Math.floor(Math.random() * 5)]
        };
      }),
      categories: selectedCategories
    };

    console.log("Edit trip data:", updatedData);
    if (onSave) {
      onSave(updatedData);
    }
    showToast("Changes saved successfully! 🎉", "success");
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

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#EFECE6] rounded-2xl w-full max-w-lg p-6 shadow-xl relative z-10 font-sans max-h-[90vh] overflow-y-auto"
      >
        <h3 className="font-display text-2xl font-bold text-[#2B2A4C] mb-5 select-none">
          Edit Trip
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trip Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1.5 select-none">
              Trip Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Vacation"
              className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground"
            />
          </div>

          {/* Date range text (to keep it pre-filled without forcing individual date components if it's text) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1.5 select-none">
              Dates Range
            </label>
            <input
              type="text"
              required
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              placeholder="e.g. 12 – 17 Mar 2026"
              className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground"
            />
          </div>

          {/* Participants */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1.5 select-none">
              Participants
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                placeholder="Type participant name"
                className="flex-1 rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddParticipant()}
                className="inline-flex items-center gap-1 rounded-xl bg-[#2B2A4C] hover:bg-[#1f1e36] text-white px-4 py-2 text-xs font-bold transition-transform hover:scale-[1.02] cursor-pointer"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {/* Added Participants list */}
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 select-none">
                {participants.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E8] border border-[#EFECE6] pl-3 pr-1.5 py-1 text-xs font-semibold text-[#2B2A4C]"
                  >
                    {p}
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p)}
                      className="flex h-4.5 w-4.5 items-center justify-center rounded-full hover:bg-black/10 transition-colors text-foreground/60 cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-2 select-none">
              Category Tags
            </label>
            <div className="flex flex-wrap gap-2 select-none">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleToggleCategory(cat.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#AAD9BB] border-[#8bc79f] text-[#1A5C3A]"
                        : "bg-[#F5F0E8] border-[#EFECE6] text-[#2B2A4C]"
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F5F0E8] select-none">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#2B2A4C] px-6 py-2.5 text-xs font-bold text-[#2B2A4C] hover:scale-[1.02] transition-transform duration-200 cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#2B2A4C] hover:bg-[#1f1e36] text-white px-6 py-2.5 text-xs font-bold hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
