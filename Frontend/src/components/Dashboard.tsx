import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, X } from "lucide-react";
import Navbar from "./Navbar";
import TripCard from "./TripCard";
import NewTripModal from "./NewTripModal";
import EditTripModal from "./EditTripModal";
import DeleteTripConfirmModal from "./DeleteTripConfirmModal";
import type { Trip } from "../types";
import { useAuth, resolveAvatarUrl } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#D4CFC8] bg-white px-8 py-16 text-center select-none shadow-xs">
      
      {/* Mascot Placeholder */}
      <div className="w-[140px] h-[160px] bg-[#F5F0E8] rounded-2xl border border-dashed border-[#D4CFC8] flex flex-col items-center justify-center p-3 mb-6">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B8A9B] text-center leading-normal">
          Panda mascot here
        </span>
        <span className="text-[9px] text-[#8B8A9B]/70 mt-1 italic">
          — confused mood
        </span>
      </div>

      <h3 className="font-display text-2xl font-bold text-[#2B2A4C]">
        No trips yet.
      </h3>
      <p className="mt-1.5 text-xs text-[#8B8A9B] max-w-xs font-sans">
        Create your first trip and start splitting.
      </p>
      
      <button
        onClick={onAddClick}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2B2A4C] hover:bg-[#1f1e36] px-6 py-2.5 text-xs font-bold text-white transition-transform hover:scale-[1.02] cursor-pointer shadow-xs"
      >
        <Plus size={14} /> Create Trip
      </button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [tripsList, setTripsList] = useState<Trip[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals Visibility
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active Trip for Editing/Deleting
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const [tripsRes, invitesRes] = await Promise.all([
        fetch("http://localhost:3000/trips", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:3000/trips/invitations", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (tripsRes.status === 401 || invitesRes.status === 401) {
        logout();
        navigate("/auth");
        return;
      }

      const tripsData = await tripsRes.json();
      const invitesData = await invitesRes.json();

      if (tripsData.success) {
        setTripsList(tripsData.data || []);
      } else {
        setError(tripsData.message || "Failed to fetch trips");
      }

      if (invitesData.success) {
        setInvitations(invitesData.data || []);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Network error fetching data. Please check if your server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, logout, navigate]);

  const hasTrips = tripsList.length > 0;
  const hasInvitations = invitations.length > 0;

  // Handlers
  const handleCreateTrip = async (newTripData: any) => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3000/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTripData.name,
          categories: newTripData.categories,
          invitees: newTripData.invitees,
        }),
      });

      if (res.status === 401) {
        logout();
        navigate("/auth");
        return;
      }

      const responseData = await res.json();
      if (responseData.success) {
        setTripsList((prev) => [responseData.data, ...prev]);
      } else {
        alert(responseData.message || "Failed to create trip");
      }
    } catch (err) {
      console.error("Error creating trip:", err);
      alert("Network error creating trip");
    }
  };

  const handleRespondInvite = async (invitationId: string, accept: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3000/trips/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ accept }),
      });

      if (res.ok) {
        // Refresh data to show new trip if accepted
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Failed to respond to invite:", error);
    }
  };

  const handleEditClick = (trip: Trip) => {
    setActiveTrip(trip);
    setIsEditOpen(true);
  };

  const handleSaveTrip = (updatedTrip: Trip) => {
    setTripsList(tripsList.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)));
    setActiveTrip(null);
  };

  const handleDeleteClick = (trip: Trip) => {
    setActiveTrip(trip);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = (tripId: string) => {
    setTripsList(tripsList.filter((t) => t.id !== tripId));
    setActiveTrip(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans pb-20">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="h-12 w-12 border-4 border-[#2B2A4C]/10 border-t-[#2B2A4C] rounded-full"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="mt-4 text-xs text-[#8B8A9B] font-semibold uppercase tracking-wider select-none"
          >
            Loading trips...
          </motion.p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans pb-20">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="p-6 bg-white border border-[#EFECE6] rounded-2xl max-w-md shadow-xs hover:border-[#AAD9BB] transition-colors">
            <h3 className="font-display text-xl font-bold text-destructive">Failed to Load Trips</h3>
            <p className="mt-2 text-xs text-[#8B8A9B] leading-relaxed">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2B2A4C] hover:bg-[#1f1e36] px-5 py-2 text-xs font-bold text-white cursor-pointer transition-colors shadow-xs select-none"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      <Navbar />

      <main className="mx-auto max-w-5xl px-8 py-10 sm:py-14">

        {/* Invitations Section */}
        <AnimatePresence>
          {hasInvitations && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-10 overflow-hidden"
            >
              <h2 className="font-display text-xl font-bold tracking-tight text-[#2B2A4C] mb-4">Pending Invitations</h2>
              <div className="flex flex-col gap-3">
                {invitations.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between bg-white border border-[#EFECE6] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <img 
                        src={resolveAvatarUrl(inv.sender.avatar_url, inv.sender.id || inv.sender.username)} 
                        alt="" 
                        className="w-10 h-10 rounded-full border border-[#EFECE6] object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#2B2A4C]">
                          <span className="text-[#8B8A9B] font-normal">Trip invite to </span> 
                          {inv.trip.name}
                        </p>
                        <p className="text-xs text-[#8B8A9B]">from @{inv.sender.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleRespondInvite(inv.id, false)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => handleRespondInvite(inv.id, true)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#AAD9BB] text-[#1A5C3A] hover:bg-[#8bc79f] transition-colors"
                      >
                        <Check size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EFECE6] pb-6"
        >
          <div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-[#2B2A4C]">
              Your Trips
            </h1>
            <p className="mt-2 text-sm text-[#8B8A9B] font-sans">
              Track spending, balances, and who owes whom.
            </p>
          </div>
          <button
            onClick={() => setIsNewOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#2B2A4C] hover:bg-[#1f1e36] px-5 py-2.5 text-xs font-bold text-white transition-transform hover:scale-[1.02] cursor-pointer shadow-xs select-none"
          >
            <Plus size={14} /> New Trip
          </button>
        </motion.div>

        {/* Trips Grid / Empty State */}
        {hasTrips ? (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {tripsList.map((trip, i) => (
              <TripCard
                key={trip.id}
                trip={trip}
                index={i}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 max-w-xl mx-auto">
            <EmptyState onAddClick={() => setIsNewOpen(true)} />
          </div>
        )}
      </main>

      {/* Modals Section */}
      <AnimatePresence>
        {isNewOpen && (
          <NewTripModal
            isOpen={isNewOpen}
            onClose={() => setIsNewOpen(false)}
            onCreate={handleCreateTrip}
          />
        )}
        {isEditOpen && activeTrip && (
          <EditTripModal
            isOpen={isEditOpen}
            onClose={() => {
              setIsEditOpen(false);
              setActiveTrip(null);
            }}
            trip={activeTrip}
            onSave={handleSaveTrip}
          />
        )}
        {isDeleteOpen && activeTrip && (
          <DeleteTripConfirmModal
            isOpen={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false);
              setActiveTrip(null);
            }}
            trip={activeTrip}
            onConfirm={handleConfirmDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
