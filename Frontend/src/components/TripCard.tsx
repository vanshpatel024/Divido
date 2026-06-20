import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Utensils,
  Hotel,
  Car,
  Plane,
  Film,
  MoreHorizontal,
  Pencil,
  Trash2,
  ShoppingBag,
} from "lucide-react";
import type { Trip, Balance } from "../types";

const formatInr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const categoryMeta: Record<string, { icon: any; label: string }> = {
  food: { icon: Utensils, label: "Food" },
  hotel: { icon: Hotel, label: "Hotel" },
  transport: { icon: Car, label: "Transport" },
  flight: { icon: Plane, label: "Flight" },
  entertainment: { icon: Film, label: "Entertainment" },
  shopping: { icon: ShoppingBag, label: "Shopping" }
};

function BalancePill({ balance }: { balance: Balance }) {
  if (balance.kind === "settled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8E8E8] px-3 py-1 text-xs font-medium text-[#555555]">
        Settled ✓
      </span>
    );
  }
  if (balance.kind === "owed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#AAD9BB] px-3 py-1 text-xs font-semibold text-[#1A5C3A]">
        You get back {formatInr(balance.amount)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7DCB9] px-3 py-1 text-xs font-semibold text-[#7A4A00]">
      You owe {formatInr(balance.amount)}
    </span>
  );
}

function AvatarStack({ participants }: { participants: Trip["participants"] }) {
  const shown = participants.slice(0, 4);
  const overflow = participants.length - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((p) => (
          <div
            key={p.name}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-foreground"
            style={{ backgroundColor: p.color }}
            title={p.name}
          >
            {p.name[0]}
          </div>
        ))}
        {overflow > 0 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#EFECE6] text-xs font-semibold text-foreground/70">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

interface TripCardProps {
  trip: Trip;
  index: number;
  onEdit?: (trip: Trip) => void;
  onDelete?: (trip: Trip) => void;
}

export default function TripCard({ trip, index, onEdit, onDelete }: TripCardProps) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCardClick = () => {
    navigate(`/trip/${trip.id}`);
  };

  const leftBorderColor =
    trip.balance.kind === "owed"
      ? "border-l-[#AAD9BB]"
      : trip.balance.kind === "owe"
      ? "border-l-[#F7DCB9]"
      : "border-l-[#E8E8E8]";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      onClick={handleCardClick}
      className={`group flex flex-col rounded-2xl border border-[#E8E2D9] bg-card p-6 shadow-sm border-l-4 ${leftBorderColor} relative cursor-pointer select-none card-hover-border`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
            {trip.name}
          </h3>
          <p className="mt-1 text-sm text-foreground/55">{trip.dates}</p>
        </div>
        
        <div className="flex items-center gap-2 select-none">
          <BalancePill balance={trip.balance} />
          
          {/* Dropdown Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/40 hover:bg-[#F5F0E8] hover:text-foreground cursor-pointer transition-colors"
              aria-label="Trip Actions"
            >
              <MoreHorizontal size={16} />
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20 cursor-default"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                  }}
                />
                <div 
                  className="absolute right-0 top-8 bg-white border border-[#EFECE6] rounded-xl shadow-lg py-1.5 w-32 z-30 font-sans text-xs select-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      if (onEdit) onEdit(trip);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-[#F5F0E8] text-[#2B2A4C] font-semibold cursor-pointer transition-colors"
                  >
                    <Pencil size={12} />
                    <span>Edit Trip</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onDelete) onDelete(trip);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-red-50 text-red-600 font-semibold cursor-pointer transition-colors"
                  >
                    <Trash2 size={12} className="text-red-500" />
                    <span>Delete Trip</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <AvatarStack participants={trip.participants} />
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-foreground/50">
            Total spend
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatInr(trip.total)}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {trip.categories.map((c) => {
          const meta = categoryMeta[c];
          if (!meta) return null;
          const { icon: Icon, label } = meta;
          return (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E8] px-2.5 py-1 text-xs text-foreground/70"
              title={label}
            >
              <Icon size={12} strokeWidth={2} />
              {label}
            </span>
          );
        })}
      </div>

    </motion.article>
  );
}
