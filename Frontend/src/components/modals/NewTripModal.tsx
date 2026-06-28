import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, User as UserIcon, Compass } from "lucide-react";
import { useToast } from "../ui/Toast";
import Button from "../ui/Button";
import { useAuth, resolveAvatarUrl } from "../../contexts/AuthContext";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (tripData: any) => void;
  isSubmitting?: boolean;
}

interface SearchedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export default function NewTripModal({ isOpen, onClose, onCreate, isSubmitting = false }: NewTripModalProps) {
  const { showToast } = useToast();
  const { token, user } = useAuth();
  const [name, setName] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<SearchedUser[]>([]);
  
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Apply scroll lock hook
  useBodyScrollLock(isOpen);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Trip name is required", "error");
      return;
    }

    const tripData = {
      name: name.trim(),
      invitees: participants.map(p => p.id),
      categories: [],
    };

    if (onCreate) {
      onCreate(tripData);
    }
    
    // Reset state
    setName("");
    setParticipantInput("");
    setParticipants([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative z-10 font-sans max-h-[85vh] overflow-y-auto flex flex-col text-foreground"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors duration-200 p-1.5 rounded-full hover:bg-muted/50 cursor-pointer z-20"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <h3 className="font-display text-2xl font-bold text-foreground mb-5 select-none shrink-0">
          Create New Trip
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-visible">
          {/* Trip Name */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 select-none text-muted-foreground transition-colors duration-700">
              Trip Name
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary dark:text-accent pointer-events-none transition-colors duration-700 group-focus-within:text-primary">
                <Compass size={16} />
              </span>
              <input
                disabled={isSubmitting}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Goa Vacation"
                className="w-full rounded-lg border border-border bg-background/50 py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Participants */}
          <div className="relative overflow-visible flex flex-col" ref={searchRef}>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1 select-none text-muted-foreground transition-colors duration-700">
              Invite Friends
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary dark:text-accent pointer-events-none transition-colors duration-700 group-focus-within:text-primary">
                <Search size={16} />
              </span>
              <input
                disabled={isSubmitting}
                type="text"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                placeholder="Search by username or name..."
                className="w-full rounded-lg border border-border bg-background/50 py-3 pl-10 pr-10 text-[13px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/50 focus:border-primary"
              />
              {isSearching && (
                <span className="absolute inset-y-0 right-3.5 flex items-center">
                  <span className="h-3.5 w-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
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
                  className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-48 overflow-y-auto"
                >
                  {searchResults.map((u, idx) => (
                    <div 
                      key={u.id ? `${u.id}-${idx}` : idx}
                      onClick={() => handleAddParticipant(u)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/65 cursor-pointer transition-colors"
                    >
                      {u.avatar_url ? (
                        <img src={resolveAvatarUrl(u.avatar_url, u.id || u.username)} alt="" className="w-6 h-6 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <UserIcon size={12} />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground leading-none">{u.display_name || u.username}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">@{u.username}</span>
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border pl-1.5 pr-2 py-1 text-xs font-semibold text-foreground"
                  >
                    {p.avatar_url ? (
                      <img src={resolveAvatarUrl(p.avatar_url, p.id || p.username)} alt="" className="w-4 h-4 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center">
                        <UserIcon size={8} />
                      </div>
                    )}
                    {p.username}
                    <button
                      disabled={isSubmitting}
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/15 transition-colors text-foreground/50 hover:text-foreground cursor-pointer ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-border/40 select-none mt-2 shrink-0">
            <Button
              disabled={isSubmitting}
              type="button"
              onClick={onClose}
              variant="dark-outline"
              shape="pill"
              size="md"
              className="w-auto"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              type="submit"
              isLoading={isSubmitting}
              variant="premium"
              shape="pill"
              size="md"
              className="w-auto min-w-32"
            >
              Create Trip
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
