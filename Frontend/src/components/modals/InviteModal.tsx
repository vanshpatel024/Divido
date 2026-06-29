import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, User as UserIcon } from "lucide-react";
import { useToast } from "../ui/Toast";
import { useAuth, resolveAvatarUrl } from "../../contexts/AuthContext";
import Button from "../ui/Button";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  existingParticipants: { id?: string; name: string; username?: string; avatar_url?: string }[];
}

interface SearchedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  isParticipant?: boolean;
  isInvited?: boolean;
}

export default function InviteModal({ isOpen, onClose, tripId, existingParticipants }: InviteModalProps) {
  const { showToast } = useToast();
  const { token, user } = useAuth();
  const [inviteeInput, setInviteeInput] = useState("");
  const [selectedInvitees, setSelectedInvitees] = useState<SearchedUser[]>([]);
  
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingInvitees, setPendingInvitees] = useState<{ id: string; username: string; display_name: string; avatar_url: string }[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Apply scroll lock hook
  useBodyScrollLock(isOpen);

  // Fetch pending invitations for this trip
  const fetchPendingInvitations = async () => {
    if (!token || !tripId) return;
    try {
      const res = await fetch(`http://localhost:3000/trips/${tripId}/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPendingInvitees(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch pending invitations:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPendingInvitations();
    }
  }, [isOpen, tripId, token]);

  // Real-time synchronization
  useEffect(() => {
    const handleRealtimeUpdate = () => {
      fetchPendingInvitations();
    };

    window.addEventListener("divido_trip_update", handleRealtimeUpdate);
    window.addEventListener("divido_dashboard_update", handleRealtimeUpdate);

    return () => {
      window.removeEventListener("divido_trip_update", handleRealtimeUpdate);
      window.removeEventListener("divido_dashboard_update", handleRealtimeUpdate);
    };
  }, []);

  const isUserParticipant = (userId: string) => {
    return existingParticipants.some(p => p.id === userId) || userId === user?.id;
  };

  const isUserInvited = (userId: string) => {
    return pendingInvitees.some(p => p.id === userId);
  };

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
      if (inviteeInput.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`http://localhost:3000/users/search?q=${encodeURIComponent(inviteeInput.trim())}&tripId=${tripId}`, {
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
  }, [inviteeInput, token, tripId]);

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

  const handleAddInvitee = (selectedUser: SearchedUser) => {
    // These are defensive guards — the UI already blocks disabled rows from reaching here
    if (selectedUser.id === user?.id) return;
    if (isUserParticipant(selectedUser.id)) return;
    if (isUserInvited(selectedUser.id)) return;
    // Don't add if already queued in this send batch
    if (selectedInvitees.some(p => p.id === selectedUser.id)) {
      showToast("User already added", "error");
      return;
    }
    setSelectedInvitees([...selectedInvitees, selectedUser]);
    setInviteeInput("");
    setSearchResults([]);
  };

  const handleRemoveInvitee = (userId: string) => {
    setSelectedInvitees(selectedInvitees.filter((p) => p.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvitees.length === 0) {
      showToast("Please add at least one person to invite", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3000/trips/${tripId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          invitees: selectedInvitees.map(p => p.id)
        })
      });

      const responseData = await res.json();
      if (responseData.success) {
        const data = responseData.data || {};
        const invited = data.invitees || [];
        const alreadyInvited = data.alreadyInvited || [];
        const alreadyJoined = data.alreadyJoined || [];

        // Build detailed messages
        const msgParts: string[] = [];
        if (invited.length > 0) {
          msgParts.push(`Invitations sent successfully to ${invited.length} friend(s)`);
        }
        if (alreadyInvited.length > 0) {
          msgParts.push(`${alreadyInvited.join(", ")} already invited`);
        }
        if (alreadyJoined.length > 0) {
          msgParts.push(`${alreadyJoined.join(", ")} already participant(s)`);
        }

        const fullMessage = msgParts.join(". ");
        const toastType = invited.length > 0 ? "success" : "error";
        showToast(fullMessage || "Invitations processed", toastType);

        // Remove processed/invited/joined users from list
        const idsToRemove = new Set<string>([
          ...invited,
          ...(data.alreadyInvitedIds || []),
          ...(data.alreadyJoinedIds || [])
        ]);

        const remaining = selectedInvitees.filter(u => !idsToRemove.has(u.id));
        setSelectedInvitees(remaining);
        setInviteeInput("");
        setSearchResults([]);

        // Close if no invitees are left
        if (remaining.length === 0) {
          onClose();
        }

        // Refresh pending list
        fetchPendingInvitations();
      } else {
        showToast(responseData.message || "Failed to send invitations", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Network error", "error");
    } finally {
      setIsSubmitting(false);
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
        className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative z-10 font-sans max-h-[90vh] overflow-visible flex flex-col text-foreground"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors duration-200 p-1.5 rounded-full hover:bg-muted/50 cursor-pointer z-20"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <h3 className="font-display text-2xl font-bold text-foreground mb-5 select-none shrink-0">
          Invite Friends
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-visible">
          {/* Participants Search */}
          <div className="relative overflow-visible flex flex-col" ref={searchRef}>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 select-none text-muted-foreground transition-colors duration-200">
              Search Friends
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-secondary dark:text-accent pointer-events-none">
                <Search size={14} />
              </span>
              <input
                disabled={isSubmitting}
                type="text"
                value={inviteeInput}
                onChange={(e) => setInviteeInput(e.target.value)}
                placeholder="Search by username or name..."
                className="w-full rounded-lg border border-border bg-background/50 py-2.5 pl-9 pr-3.5 text-sm outline-none transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isSearching && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="h-3.5 w-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                </span>
              )}
            </div>

            {/* Search Dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && inviteeInput.length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-48 overflow-y-auto"
                >
                  {searchResults.map((u, idx) => {
                    const isJoined = u.isParticipant || isUserParticipant(u.id);
                    const isInvited = u.isInvited || isUserInvited(u.id);
                    const isDisabled = isJoined || isInvited;

                    return (
                      <div 
                        key={u.id ? `${u.id}-${idx}` : idx}
                        onClick={() => { if (!isDisabled) handleAddInvitee(u); }}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                          isDisabled
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:bg-muted cursor-pointer"
                        }`}
                      >
                        {u.avatar_url ? (
                          <img src={resolveAvatarUrl(u.avatar_url, u.id || u.username)} alt="" className="w-6 h-6 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <UserIcon size={12} />
                          </div>
                        )}
                        <div className="flex flex-col flex-1">
                          <span className="text-sm font-semibold text-foreground leading-none">{u.display_name || u.username}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">@{u.username}</span>
                        </div>

                        {/* Real-time Status Badges */}
                        {isJoined && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 select-none">
                            Joined
                          </span>
                        )}
                        {!isJoined && isInvited && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600 select-none animate-pulse">
                            Invited
                          </span>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Added Invitee list */}
            {selectedInvitees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 select-none">
                {selectedInvitees.map((p) => (
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
                      onClick={() => handleRemoveInvitee(p.id)}
                      className="flex h-4.5 w-4.5 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors text-foreground/60 cursor-pointer ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40 select-none mt-2 shrink-0">
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
              className="w-auto"
            >
              Send Invites
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
