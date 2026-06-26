import { useState, useEffect, useRef, useCallback } from "react";
import { Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import ConfirmDialog from "./ConfirmDialog";

const SEEN_KEY = "divido_seen_activity_ids";
const CLEARED_KEY = "divido_cleared_activity_ids";

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

function getClearedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(CLEARED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function persistClearedIds(ids: Set<string>): void {
  try {
    const arr = Array.from(ids).slice(-500);
    localStorage.setItem(CLEARED_KEY, JSON.stringify(arr));
  } catch {
    // Silently ignore storage errors
  }
}

export default function NotificationsMenu() {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setClearedIds(getClearedIds());
  }, []);

  const computeUnread = useCallback((items: any[]) => {
    const seen = getSeenIds();
    
    // Filter out items where the actor is the current user themselves
    const unread = items.filter((a: any) => {
      if (a.actorId && user?.id && a.actorId === user.id) {
        return false;
      }
      return !seen.has(a.id);
    });

    setUnreadIds(new Set(unread.map(a => a.id)));
  }, [user?.id]);

  const fetchActivities = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3000/users/me/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActivities(data.data);
        computeUnread(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch activities", error);
    }
  }, [token, computeUnread]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<{ type?: string; payload?: any }>;
      const { type } = customEvt.detail || {};
      
      // Activity feed doesn't care about invitation_received
      if (type === 'invitation_received') {
        return;
      }
      
      fetchActivities();
    };
    window.addEventListener('divido_dashboard_update', handleUpdate);
    return () => window.removeEventListener('divido_dashboard_update', handleUpdate);
  }, [fetchActivities]);

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
      // Mark all currently visible items as seen
      const seen = getSeenIds();
      activities.forEach((a) => seen.add(a.id));
      persistSeenIds(seen);
      setUnreadIds(new Set());
    }
  };

  const formatInr = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const parseSettlementNames = (name: string) => {
    const match = name.match(/^Settlement:\s*(.*?)\s+to\s+(.*?)$/i);
    if (match) {
      return { from: match[1], to: match[2] };
    }
    return null;
  };

  const renderActivityText = (act: any) => {
    switch (act.type) {
      case 'invitation_response':
        return (
          <span>
            <strong>{act.userName}</strong> <strong>{act.status}</strong> your invitation to <strong>{act.tripName}</strong>
          </span>
        );
      case 'trip_ended':
        return (
          <span>
            <strong>{act.tripName}</strong> has <strong>ended</strong>.
          </span>
        );
      case 'settlement': {
        const parsed = parseSettlementNames(act.name);
        const formattedAmount = typeof act.amount === 'number' ? formatInr(act.amount) : act.amount;
        if (parsed) {
          if (act.role === 'receiver') {
            return <span>Received <strong>{formattedAmount}</strong> from <strong>{parsed.from}</strong></span>;
          } else {
            return <span>Paid <strong>{formattedAmount}</strong> to <strong>{parsed.to}</strong></span>;
          }
        }
        if (act.role === 'receiver') {
          return <span>Received <strong>{formattedAmount}</strong> for settlement</span>;
        } else {
          return <span>Paid <strong>{formattedAmount}</strong> for settlement</span>;
        }
      }
      case 'member_joined':
        return (
          <span>
            <strong>{act.userName}</strong> <strong>joined</strong> <strong>{act.tripName}</strong>
          </span>
        );
      case 'member_left': {
        const match = act.name.match(/^Activity:\s*(.*?)\s+left\s+the\s+(.*?)\s+trip$/i);
        if (match) {
          return (
            <span>
              <strong>{match[1]}</strong> <strong>left</strong> the <strong>{match[2]}</strong> trip
            </span>
          );
        }
        const cleanName = act.name.replace(/^Activity:\s*/i, '');
        return <span>{cleanName}</span>;
      }
      default:
        return <span>Unknown activity</span>;
    }
  };

  const visibleActivities = activities.filter((act) => !clearedIds.has(act.id));
  const unreadCount = Array.from(unreadIds).filter((id) => !clearedIds.has(id)).length;

  const handleClearAllClick = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (visibleActivities.length === 0) return;
    setIsConfirmOpen(true);
  };

  const executeClearAll = () => {
    const updatedCleared = new Set(clearedIds);
    visibleActivities.forEach((a) => updatedCleared.add(a.id));
    persistClearedIds(updatedCleared);
    setClearedIds(updatedCleared);
    
    const seen = getSeenIds();
    visibleActivities.forEach((a) => seen.add(a.id));
    persistSeenIds(seen);
    setUnreadIds(new Set());
    setIsConfirmOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center p-2 rounded-full hover:bg-[#F5F0E8] transition-colors cursor-pointer"
        title="Activity Feed"
      >
        <Mail size={20} className="text-[#8B8A9B]" />
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
            className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-[#E8E3D9] bg-white shadow-xl overflow-hidden flex flex-col z-20"
          >
            <div className="p-4 border-b border-[#F0ECE5] shrink-0 flex items-center justify-between select-none">
              <h3 className="font-semibold text-[#2B2A4C]">Activity Feed</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-[#1A5C3A] bg-[#eef7f1] border border-[#AAD9BB]/60 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
                {unreadCount > 0 && visibleActivities.length > 0 && (
                  <span className="text-[#E8E3D9] text-xs">|</span>
                )}
                {visibleActivities.length > 0 && (
                  <button
                    onClick={handleClearAllClick}
                    className="text-xs font-semibold text-[#8B8A9B] hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent p-0"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[340px] flex flex-col custom-scrollbar">
              {visibleActivities.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#8B8A9B]">No recent activities</div>
              ) : (
                visibleActivities.map((act) => {
                  const isUnread = unreadIds.has(act.id);
                  return (
                    <Link
                      key={act.id}
                      to={act.tripId ? `/trip/${act.tripId}` : '#'}
                      onClick={() => setIsOpen(false)}
                      className={`relative p-3 border-b border-[#F0ECE5] hover:bg-[#F5F0E8] transition-colors decoration-none block ${
                        isUnread ? "bg-[#f5fbf7]" : ""
                      }`}
                    >
                      {/* Unread left-border accent */}
                      {isUnread && (
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#AAD9BB] rounded-r-full" />
                      )}
                      <div className="flex items-start gap-3 pl-1">
                        <div className="flex-1 text-sm text-[#2B2A4C]">
                          {renderActivityText(act)}
                          <p className="text-xs text-[#8B8A9B] mt-1">
                            {new Date(act.date).toLocaleDateString()} at {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {isUnread && (
                          <span className="mt-1 h-2 w-2 rounded-full bg-[#AAD9BB] shrink-0" />
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Clear Activity Feed?"
        message={
          <>
            Are you sure you want to <strong>clear your activity feed</strong>? This will <strong>hide all activities</strong> from the list. This action <strong>cannot be undone</strong>.
          </>
        }
        confirmLabel="Clear Feed"
        variant="danger"
        onConfirm={executeClearAll}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
