import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import Navbar from "./Navbar";
import TripCard from "./TripCard";
import NewTripModal from "./NewTripModal";
import DeleteTripConfirmModal from "./DeleteTripConfirmModal";
import type { Trip } from "../types";
import { useAuth } from "../context/AuthContext";
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
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#2B2A4C] hover:bg-[#1f1e36] px-6 py-2.5 text-xs font-bold text-white transition-colors duration-200 cursor-pointer shadow-xs"
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals Visibility
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active Trip for Editing/Deleting
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const tripsRes = await fetch("http://localhost:3000/trips", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (tripsRes.status === 401) {
        logout();
        navigate("/auth");
        return;
      }

      const tripsData = await tripsRes.json();

      if (tripsData.success) {
        setTripsList(tripsData.data || []);
      } else {
        setError(tripsData.message || "Failed to fetch trips");
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

  useEffect(() => {
    const handleUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener('divido_dashboard_update', handleUpdate);
    return () => window.removeEventListener('divido_dashboard_update', handleUpdate);
  }, [token]);

  const hasTrips = tripsList.length > 0;

  // Handlers
  const handleCreateTrip = async (newTripData: any) => {
    if (!token) return;
    setIsCreatingTrip(true);
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
        setIsNewOpen(false);
      } else {
        alert(responseData.message || "Failed to create trip");
      }
    } catch (err) {
      console.error("Error creating trip:", err);
      alert("Network error creating trip");
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleDeleteClick = (trip: Trip) => {
    setActiveTrip(trip);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async (tripId: string) => {
    if (!token) return;
    setIsDeletingTrip(true);
    try {
      const res = await fetch(`http://localhost:3000/trips/${tripId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTripsList(tripsList.filter((t) => t.id !== tripId));
        setIsDeleteOpen(false);
      } else {
        alert(data.message || "Failed to delete trip");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setIsDeletingTrip(false);
      setActiveTrip(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans pb-20 select-none">
        <Navbar />
        <main className="mx-auto max-w-5xl px-8 py-10 sm:py-14">
          {/* Header Skeleton */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EFECE6] pb-6">
            <div>
              <div className="h-10 w-48 bg-[#EFECE6] rounded-xl skeleton-shimmer" />
              <div className="h-4 w-72 bg-[#EFECE6] rounded-lg mt-3 skeleton-shimmer" />
            </div>
            <div className="h-9 w-28 bg-[#EFECE6] rounded-full skeleton-shimmer" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-sm border-l-4 border-l-[#E8E8E8] relative select-none">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-36 rounded-md bg-[#EFECE6] skeleton-shimmer" />
                    <div className="h-4 w-24 rounded-md bg-[#EFECE6] skeleton-shimmer" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-[#EFECE6] skeleton-shimmer" />
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((a) => (
                      <div key={a} className="h-8 w-8 rounded-full border-2 border-white bg-[#EFECE6] skeleton-shimmer" />
                    ))}
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="h-3 w-16 rounded bg-[#EFECE6] skeleton-shimmer" />
                    <div className="h-6 w-20 rounded bg-[#EFECE6] mt-1.5 skeleton-shimmer" />
                  </div>
                </div>
                <div className="mt-5 flex gap-1.5">
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E8] px-2.5 py-1 text-xs">
                    <div className="h-3 w-10 rounded bg-[#EFECE6] skeleton-shimmer" />
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E8] px-2.5 py-1 text-xs">
                    <div className="h-3 w-12 rounded bg-[#EFECE6] skeleton-shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
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
            className="inline-flex items-center gap-2 rounded-full bg-[#2B2A4C] hover:bg-[#1f1e36] px-5 py-2.5 text-xs font-bold text-white transition-colors duration-200 cursor-pointer shadow-xs select-none"
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
            isSubmitting={isCreatingTrip}
          />
        )}
        {isDeleteOpen && activeTrip && (
          <DeleteTripConfirmModal
            isOpen={isDeleteOpen}
            onClose={() => {
              if (!isDeletingTrip) {
                setIsDeleteOpen(false);
                setActiveTrip(null);
              }
            }}
            trip={activeTrip}
            onConfirm={handleConfirmDelete}
            isDeleting={isDeletingTrip}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
