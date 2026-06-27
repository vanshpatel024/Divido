import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const SEEN_KEY = "divido_seen_invite_ids";

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function persistSeenIds(ids: Set<string>): void {
  try {
    // Cap to the most recent 500 IDs to prevent unbounded localStorage growth
    const arr = Array.from(ids).slice(-500);
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
  } catch {
    // Silently ignore storage errors
  }
}

export default function InvitationsMenu() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [loadingAction, setLoadingAction] = useState<{ id: string; action: "accept" | "reject" } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const computeUnread = useCallback((items: any[]) => {
    const seen = getSeenIds();
    const fresh = new Set<string>(
      items.map((inv: any) => inv.id).filter((id: string) => !seen.has(id))
    );
    setUnreadIds(fresh);
  }, []);

  const fetchInvitations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3000/trips/invitations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInvitations(data.data);
        computeUnread(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch invitations", error);
    }
  }, [token, computeUnread]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ type?: string; payload?: any }>;
      const { type } = customEvt.detail || {};
      
      // Invitations menu only needs to fetch on invitation-related events
      if (type && type !== 'invitation_received' && type !== 'invitation_response') {
        return;
      }
      
      fetchInvitations();
    };
    window.addEventListener('divido_dashboard_update', handleUpdate);
    return () => window.removeEventListener('divido_dashboard_update', handleUpdate);
  }, [fetchInvitations]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const handleOpen = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      // Mark all currently visible invitations as seen
      const seen = getSeenIds();
      invitations.forEach((inv) => seen.add(inv.id));
      persistSeenIds(seen);
      setUnreadIds(new Set());
    }
  };

  const respondToInvite = async (invitationId: string, accept: boolean) => {
    if (!token) return;
    setLoadingAction({ id: invitationId, action: accept ? "accept" : "reject" });
    try {
      const res = await fetch(`http://localhost:3000/trips/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accept }),
      });
      if (res.ok) {
        // Remove from local list and clean up from seen set too
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
        setUnreadIds((prev) => {
          const next = new Set(prev);
          next.delete(invitationId);
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  const unreadCount = unreadIds.size;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center p-2 rounded-full hover:bg-muted transition-colors cursor-pointer"
        title="Trip Invitations"
      >
        <Bell size={20} className="text-[#8B8A9B]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden flex flex-col z-20"
          >
            <div className="p-4 border-b border-border shrink-0 flex items-center justify-between">
              <h3 className="font-semibold text-[#2B2A4C] dark:text-foreground">Trip Invitations</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-status-getback-text bg-status-getback-bg border border-status-getback-text/20 px-2 py-0.5 rounded-full select-none">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="overflow-y-auto max-h-[340px] flex flex-col custom-scrollbar">
              {invitations.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No pending invitations</div>
              ) : (
                invitations.map((inv) => {
                  const isUnread = unreadIds.has(inv.id);
                  return (
                    <div
                      key={inv.id}
                      className={`relative p-4 border-b border-border transition-colors ${
                        isUnread ? "bg-[#f5fbf7] dark:bg-status-getback-bg/20" : ""
                      }`}
                    >
                      {/* Unread left-border accent */}
                      {isUnread && (
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#AAD9BB] dark:bg-status-getback-text rounded-r-full" />
                      )}
                      <div className="flex flex-col gap-2 pl-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm text-[#2B2A4C] dark:text-foreground">
                              <strong>{inv.sender.display_name}</strong> invited you to join{" "}
                              <strong>{inv.trip.name}</strong>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(inv.created_at).toLocaleDateString()} at {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {isUnread && (
                            <span className="mt-1 h-2 w-2 rounded-full bg-[#AAD9BB] dark:bg-status-getback-text shrink-0" />
                          )}
                        </div>
                        <div className="flex gap-2 select-none">
                          <button
                            onClick={() => respondToInvite(inv.id, true)}
                            disabled={loadingAction?.id === inv.id}
                            className="flex-1 rounded-lg bg-status-getback-bg py-1.5 text-xs font-semibold text-status-getback-text hover:bg-status-getback-text hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingAction?.id === inv.id && loadingAction?.action === "accept"
                              ? "Accepting..."
                              : "Accept"}
                          </button>
                          <button
                            onClick={() => respondToInvite(inv.id, false)}
                            disabled={loadingAction?.id === inv.id}
                            className="flex-1 rounded-lg bg-destructive/10 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingAction?.id === inv.id && loadingAction?.action === "reject"
                              ? "Declining..."
                              : "Decline"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
