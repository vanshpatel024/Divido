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
import { motion } from "framer-motion";
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
    shopping: { icon: ShoppingBag, label: "Shopping" },
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ balance }: { balance: Balance }) {
    if (balance.kind === "settled" || (balance as any).amount === 0) {
        return (
            <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium tracking-wide bg-[var(--color-status-settled-bg)] text-[var(--color-status-settled-text)]"
            >
                Settled
            </span>
        );
    }
    if (balance.kind === "owed") {
        return (
            <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide bg-[var(--color-status-getback-bg)] text-[var(--color-status-getback-text)]"
            >
                + {formatInr((balance as any).amount)}
            </span>
        );
    }
    // "owe"
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide bg-[var(--color-status-owe-bg)] text-[var(--color-accent)]"
        >
            − {formatInr((balance as any).amount)}
        </span>
    );
}

// ─── Avatar Stack ──────────────────────────────────────────────────────────────
function AvatarStack({ participants }: { participants: Trip["participants"] }) {
    const shown = participants.slice(0, 4);
    const overflow = participants.length - shown.length;
    return (
        <div className="flex items-center">
            <div className="flex -space-x-2">
                {shown.map((p) => {
                    const avatarUrl = p.avatar_url
                        ? resolveAvatarUrl(p.avatar_url, p.id || p.name)
                        : null;
                    return (
                        <div
                            key={p.id || p.name}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-semibold text-foreground overflow-hidden"
                            style={{ backgroundColor: p.color }}
                            title={p.name}
                        >
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                                p.name[0]
                            )}
                        </div>
                    );
                })}
                {overflow > 0 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
                        +{overflow}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── TripCard ─────────────────────────────────────────────────────────────────
interface TripCardProps {
    trip: Trip;
    index: number;
    onDelete?: (trip: Trip) => void;
}

export default function TripCard({ trip, index: _index, onDelete }: TripCardProps) {
    const navigate = useNavigate();

    const handleCardClick = () => navigate(`/trip/${trip.id}`);

    const isSettled = trip.balance.kind === "settled" || (trip.balance as any).amount === 0;
    const leftBorderColor: string = isSettled
        ? "var(--color-status-settled-border)"
        : trip.balance.kind === "owed"
            ? "var(--color-status-getback-text)"
            : "var(--color-accent)";

    const hoverBorderColor: string = isSettled
        ? "var(--color-status-settled-hover-border)"
        : trip.balance.kind === "owed"
            ? "var(--color-status-getback-text)"
            : "var(--color-accent)";

    return (
        <motion.article
            onClick={handleCardClick}
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm border-l-4 border-l-[var(--left-border-color)] relative cursor-pointer select-none transition-colors duration-300 hover:border-[var(--hover-border-color)]"
            style={{
                ["--left-border-color" as any]: leftBorderColor,
                ["--hover-border-color" as any]: hoverBorderColor,
            }}
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            {/* Top row: title + badge + delete */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold tracking-tight text-foreground truncate">
                        {trip.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{trip.dates}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge balance={trip.balance} />

                    {onDelete && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete(trip);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
                            aria-label="Leave Trip"
                            title="Leave Trip"
                        >
                            <DoorOpen size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Middle row: avatars + total */}
            <div className="mt-4 flex items-center justify-between">
                <AvatarStack participants={trip.participants} />
                <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">
                        Total spend
                    </div>
                    <div className="text-xl font-bold text-foreground mt-0.5">
                        {formatInr(trip.total)}
                    </div>
                </div>
            </div>

            {/* Category tags */}
            {trip.categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                    {trip.categories.map((c) => {
                        const meta = categoryMeta[c];
                        if (!meta) return null;
                        const { icon: Icon, label } = meta;
                        return (
                            <span
                                key={c}
                                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
                                title={label}
                            >
                                <Icon size={11} strokeWidth={2} />
                                {label}
                            </span>
                        );
                    })}
                </div>
            )}
        </motion.article>
    );
}
