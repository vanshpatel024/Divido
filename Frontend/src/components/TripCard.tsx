import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Utensils,
  Hotel,
  Car,
  Plane,
  Film,
  DoorOpen,
  ShoppingBag,
} from "lucide-react";
import type { Trip, Balance } from "../types";
import { resolveAvatarUrl } from "../context/AuthContext";

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
        {shown.map((p) => {
          const avatarUrl = p.avatar_url ? resolveAvatarUrl(p.avatar_url, p.id || p.name) : null;
          return (
            <div
              key={p.id || p.name}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-foreground overflow-hidden"
              style={{ backgroundColor: p.color }}
              title={p.name}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={p.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                p.name[0]
              )}
            </div>
          );
        })}
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
  onDelete?: (trip: Trip) => void;
}

export default function TripCard({ trip, index, onDelete }: TripCardProps) {
  const navigate = useNavigate();

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
          
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(trip);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/40 hover:bg-red-50 hover:text-red-500 cursor-pointer transition-colors"
              aria-label="Leave Trip"
              title="Leave Trip"
            >
              <DoorOpen size={15} />
            </button>
          )}
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
