import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Plus,
  Utensils,
  Building2,
  Car,
  Plane,
  Ticket,
  ShoppingBag,
  Landmark,
  MoreHorizontal,
  CheckCircle2,
  Flag
} from "lucide-react";
import Navbar from "./Navbar";
import { useAuth, resolveAvatarUrl } from "../context/AuthContext";
import type { Trip } from "../types";

interface Transaction {
  paidBy: string;
  amount: number;
  splitCount: number;
  avatarColor: string;
}

interface Stop {
  id: string;
  name: string;
  category: "food" | "hotel" | "transport" | "flight" | "entertainment" | "shopping";
  date: string;
  total: number;
  transactions: Transaction[];
}

const formatInr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const getCategoryDetails = (category: string) => {
  switch (category.toLowerCase()) {
    case "food":
      return { icon: <Utensils size={12} />, label: "Food" };
    case "hotel":
      return { icon: <Building2 size={12} />, label: "Hotel" };
    case "transport":
      return { icon: <Car size={12} />, label: "Transport" };
    case "flight":
      return { icon: <Plane size={12} />, label: "Flight" };
    case "entertainment":
      return { icon: <Ticket size={12} />, label: "Entertainment" };
    case "shopping":
      return { icon: <ShoppingBag size={12} />, label: "Shopping" };
    default:
      return { icon: <Landmark size={12} />, label: "Other" };
  }
};

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [stops, setStops] = useState<Stop[]>([
    {
      id: "dinner",
      name: "Beachside Dinner",
      category: "food",
      date: "2026-03-18",
      total: 4500,
      transactions: [
        { paidBy: "Aarav", amount: 3000, splitCount: 5, avatarColor: "#AAD9BB" },
        { paidBy: "Priya", amount: 1500, splitCount: 5, avatarColor: "#F7DCB9" },
      ],
    },
    {
      id: "hotel",
      name: "Hotel Booking",
      category: "hotel",
      date: "2026-03-16",
      total: 12000,
      transactions: [
        { paidBy: "Rahul", amount: 12000, splitCount: 5, avatarColor: "#C9B7E0" },
      ],
    },
  ]);

  const fetchTrip = async () => {
    if (!token || !id) return;
    try {
      const res = await fetch(`http://localhost:3000/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        logout();
        navigate("/auth");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setTrip(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch trip details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [id, token]);

  const handleEndTrip = async () => {
    if (!token || !id) return;
    if (confirm("Are you sure you want to end this trip?")) {
      try {
        const res = await fetch(`http://localhost:3000/trips/${id}/end`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          fetchTrip(); // refresh to show ended
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<{ stopId: string; txIndex: number } | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <span className="h-8 w-8 border-4 border-[#2B2A4C]/10 border-t-[#2B2A4C] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <main className="mx-auto max-w-5xl px-8 py-10 flex-1">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground mb-6 decoration-none">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold">Trip Not Found</h1>
          <p className="mt-2 text-sm text-foreground/55">{error}</p>
        </main>
      </div>
    );
  }

  const totalSpend = stops.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      <Navbar />

      <div className="border-b border-[#EFECE6] bg-white/50 py-3">
        <div className="mx-auto max-w-5xl px-8 flex items-center gap-2">
          <Link
            to="/dashboard"
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-[#EFECE6] hover:text-foreground cursor-pointer"
          >
            <ChevronLeft size={16} />
          </Link>
          <nav className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] flex items-center gap-1.5 select-none">
            <Link to="/dashboard" className="hover:text-foreground transition-colors decoration-none">Your Trips</Link>
            <span className="text-foreground/30">/</span>
            <span className="text-foreground">{trip.name}</span>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-8">
        <section className="py-8 border-b border-[#EFECE6]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="font-display text-5xl font-bold tracking-tight text-foreground leading-tight">
                {trip.name}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-xs text-[#8B8A9B] select-none">
                <span>{trip.dates}</span>
                <span className="h-1 w-1 bg-foreground/20 rounded-full" />
                <span>{trip.participants.length} participants</span>
              </div>
            </div>

            <div className="flex items-center gap-2 select-none shrink-0">
              {(!trip.end_date) && (
                <button
                  onClick={handleEndTrip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-transform duration-200 cursor-pointer shadow-xs hover:bg-red-100"
                >
                  <Flag size={13} /> End Trip
                </button>
              )}
              <button
                onClick={() => setIsAddStopOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2B2A4C] px-4 py-2 text-xs font-bold text-white transition-transform duration-200 cursor-pointer shadow-xs hover:bg-[#1f1e36]"
              >
                <Plus size={13} /> Add Stop
              </button>
            </div>
          </div>

          <div className="flex -space-x-1.5 mt-4 select-none">
            {trip.participants.map((p) => (
              <img
                key={p.id}
                src={resolveAvatarUrl(p.avatar_url || "", p.id || p.name)}
                alt={p.name}
                title={p.name}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white object-cover shadow-sm bg-[#EFECE6]"
              />
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 select-none">
            <span className="text-xs text-[#8B8A9B] font-medium">
              Total Spend: <span className="font-bold text-foreground">{formatInr(totalSpend)}</span>
            </span>
          </div>
        </section>

        {/* Stops Display - Mocked for visual */}
        <section className="mb-8 mt-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-5 select-none">
            Stops (Mocked Data)
          </h2>

          <div className="space-y-5 w-full">
            {stops.map((stop) => {
              const { icon: CatIcon, label: CatLabel } = getCategoryDetails(stop.category);
              return (
                <motion.article
                  key={stop.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-[#EFECE6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#AAD9BB] transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between gap-4 pb-3.5 border-b border-[#EFECE6]">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F0E8] px-3 py-1 text-xs text-[#2B2A4C] font-semibold border border-[#EFECE6] select-none">
                        {CatIcon}
                        <span>{CatLabel}</span>
                      </span>
                      <div>
                        <h3 className="font-semibold text-[#2B2A4C] leading-snug">{stop.name}</h3>
                        <span className="text-[11px] text-[#8B8A9B] block mt-0.5 select-none">{stop.date}</span>
                      </div>
                    </div>
                    <div className="text-right select-none shrink-0">
                      <span className="text-[10px] text-[#8B8A9B] block font-semibold uppercase tracking-wider">Total</span>
                      <span className="font-bold text-lg text-foreground">{formatInr(stop.total)}</span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
