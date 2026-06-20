import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import Navbar from "./Navbar";
import TripCard from "./TripCard";
import NewTripModal from "./NewTripModal";
import EditTripModal from "./EditTripModal";
import DeleteTripConfirmModal from "./DeleteTripConfirmModal";
import { trips as initialTrips } from "../data/trips";
import type { Trip } from "../types";

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
  const [tripsList, setTripsList] = useState<Trip[]>(initialTrips);

  // Modals Visibility
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active Trip for Editing/Deleting
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const hasTrips = tripsList.length > 0;

  // Handlers
  const handleCreateTrip = (newTripData: any) => {
    // Generate a random path-friendly ID for client route
    const randomId = Math.random().toString(36).substring(2, 9);
    const newTrip: Trip = {
      id: randomId,
      name: newTripData.name,
      dates: formatDatesRange(newTripData.startDate, newTripData.endDate),
      participants: newTripData.participants,
      total: 0,
      balance: { kind: "settled" },
      categories: newTripData.categories
    };
    setTripsList([newTrip, ...tripsList]);
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

  // Convert "YYYY-MM-DD" to human friendly display format
  const formatDatesRange = (startStr: string, endStr: string) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "Custom Dates";
    }

    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = months[start.getMonth()];
    const endMonth = months[end.getMonth()];
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear !== endYear) {
      return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
    }
    if (startMonth !== endMonth) {
      return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`;
    }
    if (startDay === endDay) {
      return `${startDay} ${startMonth} ${startYear}`;
    }
    return `${startDay} – ${endDay} ${startMonth} ${startYear}`;
  };

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
            className="inline-flex items-center gap-2 rounded-full bg-[#2B2A4C] hover:bg-[#1f1e36] px-5 py-2.5 text-xs font-bold text-white transition-transform hover:scale-[1.02] cursor-pointer shadow-xs select-none"
          >
            <Plus size={14} /> New Trip
          </button>
        </motion.div>

        {/* Trips Grid / Empty State */}
        {hasTrips ? (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
