import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Check, Clock } from "lucide-react";
import Button from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import type { Trip } from "../types";
import { useToast } from "../components/ui/Toast";
import { useRealtimeTrip } from "../hooks/useRealtimeTrip";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Tooltip from "../components/ui/Tooltip";

const renderSettlementLabel = (name: string, currentDisplayName?: string) => {
  const raw = name.replace(/^Settlement:\s*/, ""); // e.g. "Alice to Bob"
  if (!currentDisplayName) return <span>{raw}</span>;

  // Split by " to "
  const parts = raw.split(" to ");
  if (parts.length === 2) {
    const from = parts[0].trim();
    const to = parts[1].trim();

    const fromIsMe = from.toLowerCase() === currentDisplayName.toLowerCase();
    const toIsMe = to.toLowerCase() === currentDisplayName.toLowerCase();

    return (
      <span>
        <span className={fromIsMe ? "font-bold text-foreground" : "font-semibold text-foreground"}>{fromIsMe ? "YOU" : from}</span>
        <span className="text-muted-foreground"> paid </span>
        <span className={toIsMe ? "font-bold text-foreground" : "font-semibold text-foreground"}>{toIsMe ? "YOU" : to}</span>
      </span>
    );
  }

  return <span>{raw}</span>;
};

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

export default function TripBalances() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();
  const { showToast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [settlingDebtId, setSettlingDebtId] = useState<string | null>(null);

  // ConfirmDialog state
  type PendingAction = { kind: "settleDebt"; debt: any };
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const openConfirm = useCallback((action: PendingAction) => {
    setPendingAction(action);
    setConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    if (confirmLoading) return;
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

  useEffect(() => {
    fetchTripAndStops();
  }, [fetchTripAndStops]);

  useRealtimeTrip(id, token, user?.id, fetchTripAndStops);

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

  if (isLoading && !trip) {
    return (
      <div className="w-full font-sans pb-16">
        <main className="mx-auto max-w-3xl px-6 md:px-8 pt-10">
          <section className="mb-8">
            <div className="h-4 w-24 bg-muted/50 rounded-full mb-5 animate-pulse" />
            <div className="h-10 w-48 bg-muted/50 rounded-full animate-pulse" />
          </section>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col p-5 md:p-6 rounded-[1.5rem] border border-border bg-card shadow-sm h-[100px] animate-pulse">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-muted/50 rounded-full" />
                    <div className="flex flex-col gap-2">
                      <div className="h-4 w-32 bg-muted/50 rounded-full" />
                      <div className="h-2.5 w-24 bg-muted/50 rounded-full" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="h-2 w-12 bg-muted/50 rounded-full" />
                    <div className="h-5 w-16 bg-muted/50 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex h-[80vh] items-center justify-center font-sans">
        <div className="text-center bg-card border border-border p-8 rounded-2xl max-w-sm w-full mx-4 shadow-sm">
          <p className="text-muted-foreground font-semibold mb-6">{error || "Trip not found."}</p>
          <Button onClick={() => navigate("/dashboard")} variant="dark-outline" shape="pill">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const settlementStops = stops.filter(s => s.name.startsWith("Settlement:"));

  const combinedBalances = [
    ...(trip.debts || []).map(debt => ({ type: 'debt', data: debt })),
    ...(settlementStops || [])
      .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
      .map(stop => ({ type: 'settlement', data: stop }))
  ];

  return (
    <div className="w-full font-sans pb-16">
      <main className="mx-auto max-w-3xl px-6 md:px-8 pt-10">
        <section className="mb-8">
          <Link to={`/trip/${id}`} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground mb-5 decoration-none transition-colors select-none">
            <ChevronLeft size={14} strokeWidth={3} /> Back to Trip
          </Link>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-none">
            All Balances
          </h1>
        </section>

        <div className="grid grid-cols-1 gap-4">
          {combinedBalances.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border border-dashed select-none">
              <p className="text-muted-foreground font-medium text-xs">No pending balances or settlements yet.</p>
            </div>
          ) : (
            combinedBalances.map((item, idx) => {
              if (item.type === 'debt') {
                const debt = item.data as any;
                const isCreditor = debt.toId === user?.id;
                const isDebtor = debt.fromId === user?.id;
                const fromLabel = isDebtor ? "YOU" : debt.fromName;
                const toLabel = isCreditor ? "YOU" : debt.toName;
                const verb = isDebtor ? "owe" : "owes";

                return (
                  <div
                    key={`debt-${idx}`}
                    className="flex flex-col p-5 md:p-6 rounded-[1.5rem] border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0 border border-border">
                          <Clock size={14} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-foreground leading-snug block break-words pr-2">
                            <span className="font-bold">{fromLabel}</span> {verb} <span className="font-bold">{toLabel}</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground block select-none">
                            {isCreditor ? "Tap ✓ to mark paid" : "Pending payment"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center shrink-0 pl-2">
                        <div className="text-right select-none">
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">
                            Pending
                          </span>
                          <span className="font-extrabold text-foreground text-base">
                            {formatInr(debt.amount)}
                          </span>
                        </div>
                        {isCreditor && (
                          <Tooltip content="Mark as Paid" position="top">
                            <Button
                              disabled={settlingDebtId !== null}
                              onClick={() => handleSettleDebt(debt)}
                              isLoading={settlingDebtId === `${debt.fromId}-${debt.toId}`}
                              variant="premium"
                              shape="pill"
                              className="!w-8 !h-8 !p-0 shrink-0 ml-3"
                              title="Mark as Paid"
                            >
                              <Check size={16} strokeWidth={2.5} />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else {
                const stop = item.data as any;
                return (
                  <motion.div
                    key={`settlement-${stop.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col p-5 md:p-6 rounded-[1.5rem] border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary shrink-0">
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-foreground leading-snug block break-words pr-2">
                            {renderSettlementLabel(stop.name, user?.display_name)}
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5 select-none">
                            {new Date(stop.created_at || stop.date).toLocaleDateString()} at {new Date(stop.created_at || stop.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right select-none shrink-0 pl-2">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">
                          Settled
                        </span>
                        <span className="font-extrabold text-foreground text-base">
                          {formatInr(stop.total)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-x-6 gap-y-2 items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-70">Added:</span>
                        <span className="text-foreground">{new Date(stop.created_at || stop.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-70">Settled:</span>
                        <span className="text-foreground">{new Date(stop.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              }
            })
          )}
        </div>
      </main>

      <ConfirmDialog
        isOpen={confirmOpen}
        onCancel={closeConfirm}
        onConfirm={() => {
          if (pendingAction?.kind === "settleDebt") executeSettleDebt(pendingAction.debt);
        }}
        title="Mark as Paid"
        message={`Are you sure you want to settle the balance of ₹${pendingAction?.debt?.amount}? This will record a payment from ${pendingAction?.debt?.fromName} to ${pendingAction?.debt?.toName}.`}
        confirmLabel="Yes, Mark as Paid"
        cancelLabel="Cancel"
        isLoading={confirmLoading}
      />
    </div>
  );
}
