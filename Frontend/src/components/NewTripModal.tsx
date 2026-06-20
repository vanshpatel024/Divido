import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Utensils, Building2, Car, Plane, Ticket, ShoppingBag, Search, User as UserIcon } from "lucide-react";
import { useToast } from "./Toast";
import type { Category } from "../types";
import { useAuth, resolveAvatarUrl } from "../context/AuthContext";

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (tripData: any) => void;
}

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: "food", label: "Food", icon: <Utensils size={14} /> },
  { value: "hotel", label: "Hotel", icon: <Building2 size={14} /> },
  { value: "transport", label: "Transport", icon: <Car size={14} /> },
  { value: "flight", label: "Flight", icon: <Plane size={14} /> },
  { value: "entertainment", label: "Entertainment", icon: <Ticket size={14} /> },
  { value: "shopping", label: "Shopping", icon: <ShoppingBag size={14} /> } as any
];

interface SearchedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export default function NewTripModal({ isOpen, onClose, onCreate }: NewTripModalProps) {
  const { showToast } = useToast();
  const { token, user } = useAuth();
  const [name, setName] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<SearchedUser[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Search Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (participantInput.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`http://localhost:3000/users/search?q=${encodeURIComponent(participantInput.trim())}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setSearchResults(data.data || []);
          }
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [participantInput, token]);

  // Close search dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleAddParticipant = (selectedUser: SearchedUser) => {
    // Don't add if it's the current user creating the trip (they are added automatically)
    if (selectedUser.id === user?.id) {
      showToast("You are already included in the trip", "error");
      return;
    }
    if (participants.some(p => p.id === selectedUser.id)) {
      showToast("User already added", "error");
      return;
    }
    setParticipants([...participants, selectedUser]);
    setParticipantInput("");
    setSearchResults([]);
  };

  const handleRemoveParticipant = (userId: string) => {
    setParticipants(participants.filter((p) => p.id !== userId));
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
    if (!name.trim()) {
      showToast("Trip name is required", "error");
      return;
    }

    const tripData = {
      name: name.trim(),
      invitees: participants.map(p => p.id),
      categories: selectedCategories,
    };

    if (onCreate) {
      onCreate(tripData);
    }
    
    // Reset state
    setName("");
    setParticipantInput("");
    setParticipants([]);
    setSelectedCategories([]);
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
        className="bg-white border border-[#EFECE6] rounded-2xl w-full max-w-lg p-6 shadow-xl relative z-10 font-sans max-h-[90vh] overflow-visible flex flex-col"
      >
        <h3 className="font-display text-2xl font-bold text-[#2B2A4C] mb-5 select-none shrink-0">
          Create New Trip
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-visible">
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

          {/* Participants */}
          <div className="relative overflow-visible" ref={searchRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1.5 select-none">
              Invite Friends
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8B8A9B] pointer-events-none">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                placeholder="Search by username or name..."
                className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 pl-9 pr-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground"
              />
              {isSearching && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="h-3.5 w-3.5 border-2 border-[#8B8A9B]/30 border-t-[#8B8A9B] rounded-full animate-spin" />
                </span>
              )}
            </div>

            {/* Search Dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && participantInput.length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#EFECE6] rounded-xl shadow-lg overflow-hidden z-50 max-h-48 overflow-y-auto"
                >
                  {searchResults.map(u => (
                    <div 
                      key={u.id}
                      onClick={() => handleAddParticipant(u)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F5F0E8] cursor-pointer transition-colors"
                    >
                      {u.avatar_url ? (
                        <img src={resolveAvatarUrl(u.avatar_url, u.id || u.username)} alt="" className="w-6 h-6 rounded-full object-cover border border-[#EFECE6]" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#EFECE6] flex items-center justify-center text-[#8B8A9B]">
                          <UserIcon size={12} />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#2B2A4C] leading-none">{u.display_name || u.username}</span>
                        <span className="text-[10px] text-[#8B8A9B] mt-0.5">@{u.username}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Added Participants list */}
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 select-none">
                {participants.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F0E8] border border-[#EFECE6] pl-1.5 pr-2 py-1 text-xs font-semibold text-[#2B2A4C]"
                  >
                    {p.avatar_url ? (
                      <img src={resolveAvatarUrl(p.avatar_url, p.id || p.username)} alt="" className="w-4 h-4 rounded-full object-cover border border-[#EFECE6]" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                        <UserIcon size={8} />
                      </div>
                    )}
                    {p.username}
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="flex h-4.5 w-4.5 items-center justify-center rounded-full hover:bg-black/10 transition-colors text-foreground/60 cursor-pointer ml-1"
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
              Category Tags (Optional)
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
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F5F0E8] select-none mt-2 shrink-0">
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
              Create Trip
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
