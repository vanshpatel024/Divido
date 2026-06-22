import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function InvitationsMenu() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingAction, setLoadingAction] = useState<{ id: string; action: "accept" | "reject" } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchInvitations = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3000/trips/invitations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInvitations(data.data);
        
        // Calculate unread
        const storedLastSeen = localStorage.getItem("divido_last_seen_invites");
        const lastSeenTime = storedLastSeen ? new Date(storedLastSeen).getTime() : 0;
        
        const unread = data.data.filter((inv: any) => new Date(inv.created_at).getTime() > lastSeenTime).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Failed to fetch invitations", error);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [token]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchInvitations();
    };
    window.addEventListener('divido_dashboard_update', handleUpdate);
    return () => window.removeEventListener('divido_dashboard_update', handleUpdate);
  }, [token]);

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
    setIsOpen(!isOpen);
    if (!isOpen) {
      localStorage.setItem("divido_last_seen_invites", new Date().toISOString());
      setUnreadCount(0);
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
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center p-2 rounded-full hover:bg-[#F5F0E8] transition-colors cursor-pointer"
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
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-[#E8E3D9] bg-white shadow-xl overflow-hidden flex flex-col z-20"
          >
            <div className="p-4 border-b border-[#F0ECE5] shrink-0">
              <h3 className="font-semibold text-[#2B2A4C]">Trip Invitations</h3>
            </div>
            <div className="overflow-y-auto max-h-[340px] flex flex-col custom-scrollbar">
              {invitations.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#8B8A9B]">No pending invitations</div>
              ) : (
                invitations.map((inv) => (
                  <div key={inv.id} className="p-4 border-b border-[#F0ECE5]">
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-sm text-[#2B2A4C]">
                          <strong>{inv.sender.display_name}</strong> invited you to join{" "}
                          <strong>{inv.trip.name}</strong>
                        </p>
                        <p className="text-xs text-[#8B8A9B] mt-1">
                          {new Date(inv.created_at).toLocaleDateString()} at {new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2 select-none">
                         <button
                          onClick={() => respondToInvite(inv.id, true)}
                          disabled={loadingAction?.id === inv.id}
                          className="flex-1 rounded-lg bg-[#AAD9BB] py-1.5 text-xs font-semibold text-[#1A5C3A] hover:bg-[#8bc79f] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingAction?.id === inv.id && loadingAction?.action === "accept"
                            ? "Accepting..."
                            : "Accept"}
                        </button>
                        <button
                          onClick={() => respondToInvite(inv.id, false)}
                          disabled={loadingAction?.id === inv.id}
                          className="flex-1 rounded-lg bg-red-50 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingAction?.id === inv.id && loadingAction?.action === "reject"
                            ? "Declining..."
                            : "Decline"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
