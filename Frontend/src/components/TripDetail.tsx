import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Plus,
    Flag,
    Check,
    UserPlus
} from "lucide-react";
import Navbar from "./Navbar";
import Button from "./Button";
import { useAuth, resolveAvatarUrl } from "../context/AuthContext";
import type { Trip } from "../types";
import NewStopModal from "./NewStopModal";
import InviteModal from "./InviteModal";
import { useToast } from "./Toast";
import { useRealtimeTrip } from "../hooks/useRealtimeTrip";
import ConfirmDialog from "./ConfirmDialog";

interface Transaction {
    paidBy: string;
    amount: number;
    splitCount: number;
    avatarColor: string;
}

interface Stop {
    id: string;
    name: string;
    date: string;
    created_at?: string;
    total: number;
    transactions: Transaction[];
}

const formatInr = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const markActivityAsSeen = (activityId: string) => {
    try {
        const SEEN_KEY = "divido_seen_activity_ids";
        const raw = localStorage.getItem(SEEN_KEY);
        const seenSet = raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
        if (!seenSet.has(activityId)) {
            seenSet.add(activityId);
            const arr = Array.from(seenSet).slice(-500);
            localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
            window.dispatchEvent(new CustomEvent('divido_dashboard_update'));
        }
    } catch (err) {
        console.error("Failed to mark activity as seen", err);
    }
};



export default function TripDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token, logout, user } = useAuth();
    const { showToast } = useToast();

    const [trip, setTrip] = useState<Trip | null>(null);
    const [stops, setStops] = useState<Stop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [isAddStopOpen, setIsAddStopOpen] = useState(false);
    const [isEndingTrip, setIsEndingTrip] = useState(false);
    const [isAddingStop, setIsAddingStop] = useState(false);
    const [settlingDebtId, setSettlingDebtId] = useState<string | null>(null);
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    // ConfirmDialog state
    type PendingAction = { kind: "endTrip" } | { kind: "settleDebt"; debt: any };
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

    const openConfirm = useCallback((action: PendingAction) => {
        setPendingAction(action);
        setConfirmOpen(true);
    }, []);

    const closeConfirm = useCallback(() => {
        if (confirmLoading) return; // don't dismiss mid-flight
        setConfirmOpen(false);
        setPendingAction(null);
    }, [confirmLoading]);

    const fetchTripAndStops = useCallback(async () => {
        if (!token || !id) return;
        try {
            const [tripRes, stopsRes] = await Promise.all([
                fetch(`http://localhost:3000/trips/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`http://localhost:3000/trips/${id}/stops`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (tripRes.status === 401 || stopsRes.status === 401) {
                logout();
                navigate("/auth");
                return;
            }

            const tripData = await tripRes.json();
            const stopsData = await stopsRes.json();

            if (tripData.success) {
                setTrip(tripData.data);
            } else {
                setError(tripData.message);
            }

            if (stopsData.success) {
                setStops(stopsData.data || []);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch trip details.");
        } finally {
            setIsLoading(false);
        }
    }, [id, token, logout, navigate]);

    const [prevId, setPrevId] = useState(id);
    if (id !== prevId) {
        setPrevId(id);
        setIsLoading(true);
        setError("");
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchTripAndStops();
    }, [fetchTripAndStops]);

    // Real-time: refetch whenever another participant mutates the trip
    useRealtimeTrip(id, token, user?.id, fetchTripAndStops);

    const handleEndTrip = () => {
        if (!token || !id || isEndingTrip) return;
        openConfirm({ kind: "endTrip" });
    };

    const executeEndTrip = async () => {
        if (!token || !id) return;
        setIsEndingTrip(true);
        setConfirmLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/trips/${id}/end`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setConfirmOpen(false);
                setPendingAction(null);
                markActivityAsSeen(`trip-end-${id}`);
                await fetchTripAndStops();
            } else {
                showToast(data.message || "Failed to end trip", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Network error", "error");
        } finally {
            setIsEndingTrip(false);
            setConfirmLoading(false);
        }
    };

    const handleAddStop = async (stopData: any) => {
        if (!token || !id) return;
        setIsAddingStop(true);
        try {
            const res = await fetch(`http://localhost:3000/trips/${id}/stops`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(stopData),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showToast("Stop added successfully", "success");
                setIsAddStopOpen(false);
                await fetchTripAndStops();
            } else {
                showToast(data.message || "Failed to add stop", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Network error", "error");
        } finally {
            setIsAddingStop(false);
        }
    };

    const handleSettleDebt = (debt: any) => {
        if (!token || !id || settlingDebtId !== null) return;
        openConfirm({ kind: "settleDebt", debt });
    };

    const executeSettleDebt = async (debt: any) => {
        if (!token || !id) return;
        const debtId = `${debt.fromId}-${debt.toId}`;
        setSettlingDebtId(debtId);
        setConfirmLoading(true);
        const settlementData = {
            name: `Settlement: ${debt.fromName} to ${debt.toName}`,
            date: new Date().toISOString(),
            totalAmount: debt.amount,
            payments: [{ userId: debt.fromId, amount: debt.amount }],
            splits: [debt.toId],
        };
        try {
            const res = await fetch(`http://localhost:3000/trips/${id}/stops`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settlementData),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setConfirmOpen(false);
                setPendingAction(null);
                showToast("Settlement recorded successfully", "success");
                if (data.data?.id) {
                    markActivityAsSeen(`settlement-${data.data.id}`);
                }
                await fetchTripAndStops();
            } else {
                showToast(data.message || "Failed to record settlement", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Network error", "error");
        } finally {
            setSettlingDebtId(null);
            setConfirmLoading(false);
        }
    };

    // Dispatch the correct async action when user confirms
    const handleConfirm = () => {
        if (!pendingAction) return;
        if (pendingAction.kind === "endTrip") executeEndTrip();
        if (pendingAction.kind === "settleDebt") executeSettleDebt(pendingAction.debt);
    };

    // Build dialog props from current pending action
    const dialogProps = pendingAction?.kind === "endTrip"
        ? {
            title: "End this trip?",
            message: (
                <>
                    Are you sure you want to end this trip? Once ended,{" "}
                    <strong>new stops cannot be added</strong> and this action{" "}
                    <strong>cannot be undone</strong>.
                </>
            ),
            confirmLabel: "End Trip",
            variant: "danger" as const,
        }
        : pendingAction?.kind === "settleDebt"
            ? {
                title: "Mark as paid?",
                message: (
                    <>
                        Are you sure you want to mark this debt as paid? This will record a
                        settlement of <strong>{formatInr(pendingAction.debt.amount)}</strong> paid
                        by <strong>{pendingAction.debt.fromName}</strong> to you.
                    </>
                ),
                confirmLabel: "Mark as Paid",
                variant: "primary" as const,
            }
            : { title: "", message: "", confirmLabel: "Confirm", variant: "primary" as const };

    // Derived stop arrays — must be declared before any early returns (Rules of Hooks)
    const settlementStops = useMemo(
        () => stops.filter((s) => s.name.startsWith("Settlement:")),
        [stops]
    );
    const normalStops = useMemo(
        () => stops.filter((s) => !s.name.startsWith("Settlement:") && !s.name.startsWith("Activity:")),
        [stops]
    );
    const totalSpend = useMemo(
        () => normalStops.reduce((acc, s) => acc + s.total, 0),
        [normalStops]
    );

    if (isLoading) {
        return (
            <div className="w-full font-sans select-none relative">
                <div className="fixed inset-0 backdrop-blur-md bg-background/50 z-[-5] pointer-events-none transition-all duration-500" />
                {/* Back Link Skeleton */}
                <div className="border-b border-border bg-background/50 py-3">
                    <div className="mx-auto max-w-5xl px-8 flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-muted skeleton-shimmer" />
                        <div className="h-4 w-32 bg-muted rounded-md skeleton-shimmer" />
                    </div>
                </div>

                <main className="mx-auto max-w-5xl px-8 mt-10">
                    <section className="py-8 border-b border-border select-none">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="space-y-3">
                                <div className="h-12 w-64 bg-muted rounded-xl skeleton-shimmer" />
                                <div className="h-4 w-48 bg-muted rounded-md skeleton-shimmer" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 w-24 bg-muted rounded-full skeleton-shimmer" />
                                <div className="h-8 w-24 bg-muted rounded-full skeleton-shimmer" />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-9 w-9 rounded-full border border-background bg-muted skeleton-shimmer shadow-sm" />
                            ))}
                        </div>
                        <div className="h-4 w-32 bg-muted rounded-md mt-6 skeleton-shimmer" />
                    </section>

                    {/* Balances Skeleton */}
                    <section className="py-8 border-b border-border select-none">
                        <div className="h-6 w-48 bg-muted rounded-md mb-4 skeleton-shimmer" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map(i => (
                                <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-32 rounded bg-muted skeleton-shimmer" />
                                        <div className="h-6 w-20 rounded bg-muted skeleton-shimmer" />
                                        <div className="h-3 w-24 rounded bg-muted skeleton-shimmer" />
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-muted skeleton-shimmer" />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Stops List Skeleton */}
                    <section className="mt-8 select-none">
                        <div className="h-6 w-24 bg-muted rounded-md mb-5 skeleton-shimmer" />
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between pb-3.5 border-b border-border">
                                        <div className="space-y-2">
                                            <div className="h-5 w-44 rounded bg-muted skeleton-shimmer" />
                                            <div className="h-3.5 w-20 rounded bg-muted skeleton-shimmer" />
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className="h-3 w-10 rounded bg-muted ml-auto skeleton-shimmer" />
                                            <div className="h-5 w-16 rounded bg-muted ml-auto skeleton-shimmer" />
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex justify-between items-center">
                                            <div className="h-4 w-36 rounded bg-muted skeleton-shimmer" />
                                            <div className="h-4 w-20 rounded bg-muted skeleton-shimmer" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    if (error || !trip) {
        return (
            <div className="w-full flex flex-col">
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


    return (
        <div className="w-full font-sans">

            <div className="border-b border-[#EFECE6] bg-white/50 py-3">
                <div className="mx-auto max-w-5xl px-8 flex items-center gap-2">
                    <Link
                        to="/dashboard"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
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
                                <Button
                                    disabled={isEndingTrip || isAddingStop || settlingDebtId !== null}
                                    onClick={handleEndTrip}
                                    isLoading={isEndingTrip}
                                    variant="danger-outline"
                                    shape="pill"
                                    size="sm"
                                    icon={<Flag size={13} />}
                                    iconPosition="left"
                                    className="w-auto"
                                >
                                    End Trip
                                </Button>
                            )}
                            {(!trip.end_date) && (
                                <Button
                                    disabled={isEndingTrip || isAddingStop || settlingDebtId !== null}
                                    onClick={() => setIsAddStopOpen(true)}
                                    variant="dark"
                                    shape="pill"
                                    size="sm"
                                    icon={<Plus size={13} />}
                                    iconPosition="left"
                                    className="w-auto"
                                >
                                    Add Stop
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                        <div className="flex -space-x-1.5 select-none">
                            {trip.participants.map((p, idx) => (
                                <img
                                    key={p.id ? `${p.id}-${idx}` : idx}
                                    src={resolveAvatarUrl(p.avatar_url || "", p.id || p.name)}
                                    alt={p.name}
                                    title={p.name}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white object-cover shadow-sm bg-[#EFECE6]"
                                />
                            ))}
                        </div>
                        {!trip.end_date && (
                            <button
                                onClick={() => setIsInviteOpen(true)}
                                className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shadow-sm shrink-0 ml-1.5"
                                title="Invite Friends"
                            >
                                <UserPlus size={15} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mt-4 select-none">
                        <span className="text-xs text-[#8B8A9B] font-medium">
                            Total Spend: <span className="font-bold text-foreground">{formatInr(totalSpend)}</span>
                        </span>
                    </div>
                </section>

                {/* Balances & Debts Panel */}
                <section className="py-8 border-b border-[#EFECE6]">
                    <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-5 select-none">
                        Balances & Debts
                    </h2>

                    {((trip.debts && trip.debts.length > 0) || (settlementStops && settlementStops.length > 0)) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Active Debts */}
                            {trip.debts && trip.debts.map((debt, idx) => {
                                const isCreditor = debt.toId === user?.id;
                                const isDebtor = debt.fromId === user?.id;

                                // First-person contextual labels
                                const fromLabel = isDebtor ? "YOU" : debt.fromName;
                                const toLabel = isCreditor ? "YOU" : debt.toName;

                                return (
                                    <div
                                        key={`debt-${idx}`}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${isCreditor
                                                ? "border-[#AAD9BB] bg-[#eef7f1]/30"
                                                : isDebtor
                                                    ? "border-[#F7DCB9] bg-[#fdfaf5]"
                                                    : "border-[#EFECE6] bg-white"
                                            }`}
                                    >
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className="text-sm text-foreground font-medium leading-snug">
                                                <span className={`font-bold ${isDebtor ? "text-[#7A4A00]" : ""}`}>{fromLabel}</span>
                                                {" "}owes{" "}
                                                <span className={`font-bold ${isCreditor ? "text-[#1A5C3A]" : ""}`}>{toLabel}</span>
                                            </span>
                                            <span className={`text-xl font-extrabold tracking-tight ${isCreditor ? "text-[#1A5C3A]" : isDebtor ? "text-[#7A4A00]" : "text-brand-navy-text"
                                                }`}>
                                                {formatInr(debt.amount)}
                                            </span>
                                            {isCreditor && (
                                                <span className="text-[10px] text-[#1A5C3A]/70 font-medium">
                                                    Tap ✓ once they pay you back
                                                </span>
                                            )}
                                            {isDebtor && (
                                                <span className="text-[10px] text-[#7A4A00]/70 font-medium">
                                                    Waiting to be marked paid
                                                </span>
                                            )}
                                        </div>

                                        {isCreditor && (
                                            <Button
                                                disabled={settlingDebtId !== null}
                                                onClick={() => handleSettleDebt(debt)}
                                                isLoading={settlingDebtId === `${debt.fromId}-${debt.toId}`}
                                                variant="dark"
                                                shape="pill"
                                                size="sm"
                                                className="w-auto px-3 py-1.5 shrink-0 ml-3"
                                                title="Mark as Paid"
                                                icon={<Check size={13} strokeWidth={2.5} />}
                                                iconPosition="left"
                                            >
                                                Paid
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Completed Settlements */}
                            {settlementStops
                                .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
                                .map((stop) => (
                                    <motion.div
                                        key={`settlement-${stop.id}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center justify-between p-4 rounded-2xl border border-[#AAD9BB]/40 bg-[#eef7f1]/20 transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef7f1] text-[#1A5C3A] border border-[#AAD9BB]/50 shrink-0">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-sm font-semibold text-[#1A5C3A] leading-snug truncate block">
                                                    {stop.name.replace(/^Settlement:\s*/, "")}
                                                </span>
                                                <span className="text-[10px] text-[#8B8A9B] block mt-0.5 select-none">
                                                    {new Date(stop.created_at || stop.date).toLocaleDateString()} at {new Date(stop.created_at || stop.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right select-none shrink-0 pl-2">
                                            <span className="text-[9px] text-[#1A5C3A] font-bold uppercase tracking-wider block">
                                                Settled
                                            </span>
                                            <span className="font-extrabold text-[#1A5C3A] text-base">
                                                {formatInr(stop.total)}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[#8B8A9B] font-medium select-none">
                            No balances yet. Add a stop to get started.
                        </p>
                    )}
                </section>

                {/* Stops Display */}
                <section className="mb-8 mt-8">
                    <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-5 select-none">
                        Stops
                    </h2>

                    {normalStops.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-[#EFECE6] border-dashed">
                            <p className="text-[#8B8A9B] font-medium text-sm">No stops added yet.</p>
                            {!trip.end_date && (
                                <div className="flex justify-center">
                                    <Button
                                        onClick={() => setIsAddStopOpen(true)}
                                        variant="dark"
                                        shape="pill"
                                        size="sm"
                                        icon={<Plus size={13} />}
                                        iconPosition="left"
                                        className="mt-3 w-auto"
                                    >
                                        Add First Stop
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-5 w-full">
                            {normalStops.map((stop) => {
                                return (
                                    <motion.article
                                        key={stop.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center justify-between gap-4 pb-3.5 border-b border-[#EFECE6]">
                                            <div className="flex items-center gap-2.5">
                                                <div>
                                                    <h3 className="font-semibold text-brand-navy-text leading-snug">{stop.name}</h3>
                                                    <span className="text-[11px] text-[#8B8A9B] block mt-0.5 select-none">{new Date(stop.date).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="text-right select-none shrink-0">
                                                <span className="text-[10px] text-[#8B8A9B] block font-semibold uppercase tracking-wider">Total</span>
                                                <span className="font-bold text-lg text-foreground">{formatInr(stop.total)}</span>
                                            </div>
                                        </div>

                                        {stop.transactions && stop.transactions.length > 0 && (
                                            <div className="pt-3.5 space-y-2 select-none">
                                                {stop.transactions.map((tx, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-xs">
                                                        <span className="text-[#8B8A9B]">
                                                            Paid by <span className="font-semibold text-brand-navy-text">{tx.paidBy}</span>
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-semibold text-brand-navy-text">{formatInr(tx.amount)}</span>
                                                            <span className="text-[10px] text-[#8B8A9B] bg-[#F5F0E8] px-2 py-0.5 rounded border border-[#EFECE6]">
                                                                split with {tx.splitCount}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            <AnimatePresence>
                {isAddStopOpen && trip && (
                    <NewStopModal
                        isOpen={isAddStopOpen}
                        onClose={() => {
                            if (!isAddingStop) setIsAddStopOpen(false);
                        }}
                        onCreate={handleAddStop}
                        participants={trip.participants.map(p => ({
                            ...p,
                            id: p.id || ""
                        }))}
                        isSubmitting={isAddingStop}
                    />
                )}
                {isInviteOpen && trip && (
                    <InviteModal
                        isOpen={isInviteOpen}
                        onClose={() => setIsInviteOpen(false)}
                        tripId={id || ""}
                        existingParticipants={trip.participants}
                    />
                )}
            </AnimatePresence>

            <ConfirmDialog
                isOpen={confirmOpen}
                title={dialogProps.title}
                message={dialogProps.message}
                confirmLabel={dialogProps.confirmLabel}
                variant={dialogProps.variant}
                isLoading={confirmLoading}
                onConfirm={handleConfirm}
                onCancel={closeConfirm}
            />
        </div>
    );
}
