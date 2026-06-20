import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Utensils,
  Hotel,
  Car,
  Plane,
  Film,
  ArrowRight,
} from "lucide-react";
import type { Trip, Balance } from "../types";

const formatInr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const categoryMeta = {
  food: { icon: Utensils, label: "Food" },
  hotel: { icon: Hotel, label: "Hotel" },
  transport: { icon: Car, label: "Transport" },
  flight: { icon: Plane, label: "Flight" },
  entertainment: { icon: Film, label: "Entertainment" },
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
}

export default function TripCard({ trip, index }: TripCardProps) {
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
      whileHover={{ y: -4 }}
      className={`group flex flex-col rounded-2xl border border-[#E8E2D9] bg-card p-6 shadow-md transition-shadow duration-300 hover:shadow-lg border-l-4 ${leftBorderColor}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
            {trip.name}
          </h3>
          <p className="mt-1 text-sm text-foreground/55">{trip.dates}</p>
        </div>
        <BalancePill balance={trip.balance} />
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

      <Link
        to={`/trip/${trip.id}`}
        className="mt-6 inline-flex items-center gap-1 self-start text-sm font-medium text-foreground/70 transition-colors hover:text-foreground decoration-none"
      >
        View Details
        <ArrowRight
          size={14}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </motion.article>
  );
}
