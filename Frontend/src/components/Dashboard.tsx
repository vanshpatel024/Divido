import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Navbar from "./Navbar";
import TripCard from "./TripCard";
import { trips } from "../data/trips";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#E8E2D9] bg-card px-8 py-20 text-center">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="56" fill="#F5F0E8" />
        <path
          d="M40 70c0-11 9-20 20-20s20 9 20 20"
          stroke="#AAD9BB"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="52" cy="58" r="3" fill="#2B2A4C" />
        <circle cx="68" cy="58" r="3" fill="#2B2A4C" />
        <path
          d="M35 45c5-8 14-13 25-13s20 5 25 13"
          stroke="#F7DCB9"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <h3 className="font-display mt-6 text-lg font-semibold text-foreground">
        No trips yet. Start by creating one!
      </h3>
      <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] cursor-pointer">
        <Plus size={16} /> New Trip
      </button>
    </div>
  );
}

export default function Dashboard() {
  const hasTrips = trips.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
              Your Trips
            </h1>
            <p className="mt-2 text-sm text-foreground/55">
              Track spending, balances, and who owes whom.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] cursor-pointer">
            <Plus size={16} /> New Trip
          </button>
        </motion.div>

        {hasTrips ? (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} />
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState />
          </div>
        )}
      </main>
    </div>
  );
}
