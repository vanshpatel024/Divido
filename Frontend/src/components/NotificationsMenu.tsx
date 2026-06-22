import { useState, useEffect, useRef } from "react";
import { Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function NotificationsMenu() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchActivities = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3000/users/me/activities", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActivities(data.data);
        
        // Calculate unread
        const storedLastSeen = localStorage.getItem("divido_last_seen_activities");
        const lastSeenTime = storedLastSeen ? new Date(storedLastSeen).getTime() : 0;
        
        const unread = data.data.filter((act: any) => new Date(act.date).getTime() > lastSeenTime).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Failed to fetch activities", error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [token]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchActivities();
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
      localStorage.setItem("divido_last_seen_activities", new Date().toISOString());
      setUnreadCount(0);
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
        return <span><strong>{act.userName}</strong> {act.status} your invitation to <strong>{act.tripName}</strong></span>;
      case 'trip_ended':
        return <span><strong>{act.tripName}</strong> has ended.</span>;
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
        return <span><strong>{act.userName}</strong> joined <strong>{act.tripName}</strong></span>;
      case 'member_left': {
        const cleanName = act.name.replace(/^Activity:\s*/i, '');
        return <span>{cleanName}</span>;
      }
      default:
        return <span>Unknown activity</span>;
    }
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
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-[#E8E3D9] bg-white shadow-xl overflow-hidden flex flex-col z-20"
          >
            <div className="p-4 border-b border-[#F0ECE5] shrink-0">
              <h3 className="font-semibold text-[#2B2A4C]">Activity Feed</h3>
            </div>
            <div className="overflow-y-auto max-h-[340px] flex flex-col custom-scrollbar">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#8B8A9B]">No recent activities</div>
              ) : (
                activities.map((act) => (
                  <Link 
                    key={act.id} 
                    to={act.tripId ? `/trip/${act.tripId}` : '#'}
                    onClick={() => setIsOpen(false)}
                    className="p-3 border-b border-[#F0ECE5] hover:bg-[#F5F0E8] transition-colors decoration-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 text-sm text-[#2B2A4C]">
                        {renderActivityText(act)}
                        <p className="text-xs text-[#8B8A9B] mt-1">
                          {new Date(act.date).toLocaleDateString()} at {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
