import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Plus,
  Flag,
  Check,
  UserPlus,
  AlertTriangle,
  Clock,
  Pencil,
  Trash2,
  MoreHorizontal,
  User,
  ChevronRight,
} from "lucide-react";
import Button from "../components/ui/Button";
import { useAuth, resolveAvatarUrl } from "../contexts/AuthContext";
import type { Trip } from "../types";
import StopFormModal from "../components/modals/StopFormModal";
import InviteModal from "../components/modals/InviteModal";
import { useToast } from "../components/ui/Toast";
import { useRealtimeTrip } from "../hooks/useRealtimeTrip";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Tooltip from "../components/ui/Tooltip";

const renderSettlementLabel = (name: string, currentDisplayName?: string) => {
  const raw = name.replace(/^Settlement:\s*/, ""); // e.g."Alice to Bob"
  if (!currentDisplayName) return <span>{raw}</span>;

  // Split by"to"
  const parts = raw.split("to");
  if (parts.length === 2) {
    const from = parts[0].trim();
    const to = parts[1].trim();

    const fromIsMe = from.toLowerCase() === currentDisplayName.toLowerCase();
    const toIsMe = to.toLowerCase() === currentDisplayName.toLowerCase();

    return (
      <span>
        <span
          className={
            fromIsMe
              ? "font-bold text-foreground"
              : "font-semibold text-foreground"
          }
        >
          {fromIsMe ? "YOU" : from}
        </span>
        <span className="text-muted-foreground"> paid </span>
        <span
          className={
            toIsMe
              ? "font-bold text-foreground"
              : "font-semibold text-foreground"
          }
        >
          {toIsMe ? "YOU" : to}
        </span>
      </span>
    );
  }

  return <span>{raw}</span>;
};

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
  created_by?: string | null;
  creator_name?: string | null;
  edited?: boolean;
  transactions: Transaction[];
}

const formatInr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const markActivityAsSeen = (activityId: string) => {
  try {
    const SEEN_KEY = "divido_seen_activity_ids";
    const raw = localStorage.getItem(SEEN_KEY);
    const seenSet = raw
      ? new Set(JSON.parse(raw) as string[])
      : new Set<string>();
    if (!seenSet.has(activityId)) {
      seenSet.add(activityId);
      const arr = Array.from(seenSet).slice(-500);
      localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
      window.dispatchEvent(new CustomEvent("divido_dashboard_update"));
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

  // Edit stop state
  const [isEditStopOpen, setIsEditStopOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [isEditingStop, setIsEditingStop] = useState(false);

  // Three-dot menu state
  const [openMenuStopId, setOpenMenuStopId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ConfirmDialog state
  type PendingAction =
    | { kind: "endTrip" }
    | { kind: "settleDebt"; debt: any }
    | { kind: "deleteStop"; stopId: string; stopName: string };
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

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
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:3000/trips/${id}/stops`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
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

  // Listen for stop_edited WS events from other participants
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        const msg = `${detail.editorName} edited a transaction in ${detail.tripName} — ₹${detail.oldTotal} → ₹${detail.newTotal}`;
        showToast(msg, "info");
      }
    };
    window.addEventListener("divido_stop_edited", handler);
    return () => window.removeEventListener("divido_stop_edited", handler);
  }, [showToast]);

  // Close three-dot menu on outside click
  useEffect(() => {
    if (!openMenuStopId) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuStopId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenuStopId]);

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
        headers: { Authorization: `Bearer ${token}` },
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

  const openEditStop = (stop: Stop) => {
    setEditingStop(stop);
    setIsEditStopOpen(true);
  };

  const handleEditStop = async (stopData: any) => {
    if (!token || !id || !editingStop) return;
    setIsEditingStop(true);
    try {
      const res = await fetch(
        `http://localhost:3000/trips/${id}/stops/${editingStop.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(stopData),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Stop updated successfully", "success");
        setIsEditStopOpen(false);
        setEditingStop(null);
        await fetchTripAndStops();
      } else {
        showToast(data.message || "Failed to update stop", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Network error", "error");
    } finally {
      setIsEditingStop(false);
    }
  };

  const openDeleteStop = (stop: Stop) => {
    setOpenMenuStopId(null);
    openConfirm({ kind: "deleteStop", stopId: stop.id, stopName: stop.name });
  };

  const executeDeleteStop = async (stopId: string) => {
    if (!token || !id || !stopId) return;
    setConfirmLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/trips/${id}/stops/${stopId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setStops((prev) => prev.filter((s) => s.id !== stopId));
        showToast("Stop deleted successfully", "success");
        await fetchTripAndStops();
      } else {
        showToast(data.message || "Failed to delete stop", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Network error", "error");
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setPendingAction(null);
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
    if (pendingAction.kind === "settleDebt")
      executeSettleDebt(pendingAction.debt);
    if (pendingAction.kind === "deleteStop")
      executeDeleteStop(pendingAction.stopId);
  };

  // Build dialog props from current pending action
  const dialogProps =
    pendingAction?.kind === "endTrip"
      ? {
          title: "End this trip?",
          message: (
            <>
              Are you sure you want to end this trip? Once ended,{""}
              <strong>new stops cannot be added</strong> and this action{""}
              <strong>cannot be undone</strong>.
            </>
          ),
          confirmLabel: "End Trip",
          variant: "danger" as const,
          iconNode: <AlertTriangle size={20} />,
          iconVariant: "danger" as const,
        }
      : pendingAction?.kind === "settleDebt"
        ? {
            title: "Mark as paid?",
            message: (
              <>
                Are you sure you want to mark this debt as paid? This will
                record a settlement of{" "}
                <strong>{formatInr(pendingAction.debt.amount)}</strong> paid by{" "}
                <strong>{pendingAction.debt.fromName}</strong> to you.
              </>
            ),
            confirmLabel: "Mark as Paid",
            variant: "primary" as const,
            iconNode: undefined,
            iconVariant: undefined,
          }
        : pendingAction?.kind === "deleteStop"
          ? {
              title: "Delete Stop?",
              message: (
                <>
                  This will permanently delete{" "}
                  <strong className="text-foreground">
                    {pendingAction.stopName}
                  </strong>{" "}
                  and all its transactions. This cannot be undone.
                </>
              ),
              confirmLabel: "Delete",
              variant: "danger" as const,
              iconNode: <Trash2 size={20} />,
              iconVariant: "danger" as const,
            }
          : {
              title: "",
              message: "",
              confirmLabel: "Confirm",
              variant: "primary" as const,
              iconNode: undefined,
              iconVariant: undefined,
            };

  // Derived stop arrays — must be declared before any early returns (Rules of Hooks)
  const settlementStops = useMemo(
    () => stops.filter((s) => s.name.startsWith("Settlement:")),
    [stops],
  );
  const normalStops = useMemo(
    () =>
      stops.filter(
        (s) =>
          !s.name.startsWith("Settlement:") && !s.name.startsWith("Activity:"),
      ),
    [stops],
  );
  const totalSpend = useMemo(
    () => normalStops.reduce((acc, s) => acc + s.total, 0),
    [normalStops],
  );

  if (isLoading) {
    return (
      <div className="w-full font-sans relative">
        <div className="fixed inset-0 backdrop-blur-md bg-background/50 z-[-5] pointer-events-none transition-all duration-500" />
        <main className="mx-auto max-w-5xl px-8 mt-10">
          <section className="pb-8 border-b border-border">
            <div className="h-4 w-28 bg-muted rounded skeleton-shimmer mb-5" />

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-4">
                <div className="h-14 sm:h-16 w-64 sm:w-80 bg-muted rounded-xl skeleton-shimmer" />
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-32 bg-muted rounded-lg skeleton-shimmer" />
                  <div className="h-7 w-28 bg-muted rounded-lg skeleton-shimmer" />
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <div className="h-8 w-24 bg-muted rounded-full skeleton-shimmer" />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className="flex -space-x-1.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-9 w-9 rounded-full border-2 border-background bg-muted skeleton-shimmer shadow-sm"
                  />
                ))}
              </div>
              <div className="h-9 w-9 rounded-full bg-muted skeleton-shimmer ml-1.5" />
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="h-4 w-32 bg-muted rounded skeleton-shimmer" />
            </div>
          </section>

          {/* Balances Skeleton */}
          <section className="pt-8 pb-4">
            <div className="h-6 w-48 bg-muted rounded-md mb-4 skeleton-shimmer" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-4 w-3/4 max-w-[128px] rounded bg-muted skeleton-shimmer" />
                    <div className="h-6 w-1/2 max-w-[80px] rounded bg-muted skeleton-shimmer" />
                    <div className="h-3 w-2/3 max-w-[96px] rounded bg-muted skeleton-shimmer" />
                  </div>
                  <div className="h-10 w-10 shrink-0 rounded-full bg-muted skeleton-shimmer" />
                </div>
              ))}
            </div>
          </section>

          {/* Stops List Skeleton */}
          <section className="pt-4 pb-8">
            <div className="flex items-center justify-between mb-5">
              <div className="h-8 w-24 bg-muted rounded-md skeleton-shimmer" />
              <div className="h-8 w-28 bg-muted rounded-full skeleton-shimmer" />
            </div>
            <div className="space-y-5 w-full">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-border">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="h-5 w-4/5 max-w-[176px] rounded bg-muted skeleton-shimmer" />
                      <div className="h-3 w-1/2 max-w-[80px] rounded bg-muted skeleton-shimmer" />
                      <div className="h-5 w-2/3 max-w-[112px] rounded-md bg-muted skeleton-shimmer mt-2" />
                    </div>
                    <div className="text-right space-y-2 flex flex-col items-end shrink-0">
                      <div className="h-3 w-10 rounded bg-muted skeleton-shimmer" />
                      <div className="h-6 w-16 rounded bg-muted skeleton-shimmer" />
                    </div>
                  </div>
                  <div className="pt-3.5 space-y-2">
                    <div className="flex justify-between items-center gap-4">
                      <div className="h-4 w-1/2 max-w-[160px] rounded bg-muted skeleton-shimmer" />
                      <div className="h-4 w-1/4 max-w-[80px] rounded bg-muted skeleton-shimmer" />
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
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground mb-6 decoration-none"
          >
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
      <main className="mx-auto max-w-5xl px-8 mt-10">
        <section className="pb-8 border-b border-border">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground mb-5 decoration-none transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={3} /> Back to Trips
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-none mb-4">
                {trip.name}
              </h1>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                <span className="bg-muted/50 border border-border/50 px-2.5 py-1.5 rounded-lg">
                  {trip.dates}
                </span>
                <span className="bg-muted/50 border border-border/50 px-2.5 py-1.5 rounded-lg">
                  {trip.participants.length} participants
                </span>
              </div>
            </div>

            <div className="flex items-center shrink-0">
              {!trip.end_date && (
                <Button
                  disabled={
                    isEndingTrip || isAddingStop || settlingDebtId !== null
                  }
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
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex -space-x-1.5">
              {trip.participants.map((p, idx) => (
                <img
                  key={p.id ? `${p.id}-${idx}` : idx}
                  src={resolveAvatarUrl(p.avatar_url || "", p.id || p.name)}
                  alt={p.name}
                  title={p.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background object-cover shadow-sm bg-muted"
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

          <div className="flex items-center gap-4 mt-4">
            <span className="text-xs text-muted-foreground font-medium">
              Total Spend:{" "}
              <span className="font-bold text-foreground">
                {formatInr(totalSpend)}
              </span>
            </span>
          </div>
        </section>

        {/* Balances & Debts Panel */}
        <section className="pt-8 pb-4">
          <div className="flex flex-col gap-1 mb-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Balances & Debts
              </h2>
              {((trip.debts && trip.debts.length > 0) ||
                (settlementStops && settlementStops.length > 0)) && (
                <Link
                  to={`/trip/${id}/balances`}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
                >
                  View All
                  <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
              )}
            </div>
            {((trip.debts && trip.debts.length > 0) ||
              (settlementStops && settlementStops.length > 0)) && (
              <p className="text-[11px] text-muted-foreground">
                Recent entries
              </p>
            )}
          </div>

          {(trip.debts && trip.debts.length > 0) ||
          (settlementStops && settlementStops.length > 0) ? (
            (() => {
              const combinedBalances = [
                ...(trip.debts || []).map((debt) => ({
                  type: "debt",
                  data: debt,
                })),
                ...(settlementStops || [])
                  .sort(
                    (a, b) =>
                      new Date(b.created_at || b.date).getTime() -
                      new Date(a.created_at || a.date).getTime(),
                  )
                  .map((stop) => ({ type: "settlement", data: stop })),
              ];

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {combinedBalances.map((item, idx) => {
                      let responsiveClass = "flex";
                      if (idx >= 4) responsiveClass = "hidden";
                      else if (idx >= 2) responsiveClass = "hidden md:flex";

                      if (item.type === "debt") {
                        const debt = item.data as any;
                        const isCreditor = debt.toId === user?.id;
                        const isDebtor = debt.fromId === user?.id;
                        const fromLabel = isDebtor ? "YOU" : debt.fromName;
                        const toLabel = isCreditor ? "YOU" : debt.toName;
                        const verb = isDebtor ? "owe" : "owes";

                        return (
                          <div
                            key={`debt-${idx}`}
                            className={`${responsiveClass} flex-col p-4 sm:p-5 rounded-[1.5rem] border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md group`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-full w-full">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0 border border-border">
                                  <Clock size={16} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                  <span className="text-[13px] font-medium text-foreground leading-snug break-words whitespace-normal pr-2">
                                    <strong className="font-bold text-[14px]">{fromLabel}</strong>{" "}
                                    {verb}{" "}
                                    <strong className="font-bold text-[14px]">{toLabel}</strong>
                                  </span>
                                  <span className="text-[11px] text-muted-foreground block">
                                    {isCreditor
                                      ? "Tap ✓ to mark paid"
                                      : "Pending payment"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 mt-2 sm:mt-0">
                                <div className="text-left sm:text-right">
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                                    Pending
                                  </span>
                                  <span className="font-extrabold text-foreground text-lg">
                                    {formatInr(debt.amount)}
                                  </span>
                                </div>
                                {isCreditor && (
                                  <Tooltip content="Mark as Paid" position="top">
                                    <Button
                                      disabled={settlingDebtId !== null}
                                      onClick={() => handleSettleDebt(debt)}
                                      isLoading={
                                        settlingDebtId ===
                                        `${debt.fromId}-${debt.toId}`
                                      }
                                      variant="premium"
                                      shape="pill"
                                      size="sm"
                                      className="h-9 w-9 p-0 shrink-0 shadow-sm"
                                      title="Mark as Paid"
                                    >
                                      <Check size={16} strokeWidth={3} />
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
                            className={`${responsiveClass} flex-col p-4 sm:p-5 rounded-[1.5rem] border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-full w-full">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 border border-primary/20">
                                  <Check size={16} strokeWidth={3} />
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                  <span className="text-[13px] font-medium text-foreground leading-snug break-words whitespace-normal pr-2">
                                    {renderSettlementLabel(
                                      stop.name,
                                      user?.display_name,
                                    )}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground block">
                                    {new Date(
                                      stop.created_at || stop.date,
                                    ).toLocaleDateString()}{" "}
                                    at{" "}
                                    {new Date(
                                      stop.created_at || stop.date,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 mt-2 sm:mt-0">
                                <div className="text-left sm:text-right">
                                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                                    Settled
                                  </span>
                                  <span className="font-extrabold text-foreground text-lg">
                                    {formatInr(stop.total)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }
                    })}
                  </div>
                </>
              );
            })()
          ) : (
            <div className="text-center py-10 bg-card/50 rounded-2xl border border-border border-dashed">
              <p className="text-muted-foreground font-medium text-xs">
                No pending balances or settlements yet.
              </p>
            </div>
          )}
        </section>

        {/* Stops Display */}
        <section className="pt-4 pb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Stops
            </h2>
            {!trip.end_date && normalStops.length > 0 && (
              <Button
                disabled={
                  isEndingTrip || isAddingStop || settlingDebtId !== null
                }
                onClick={() => setIsAddStopOpen(true)}
                isLoading={isAddingStop}
                variant="premium"
                shape="pill"
                size="sm"
                icon={<Plus size={13} />}
                iconPosition="left"
                className="w-auto shadow-md"
              >
                Add Stop
              </Button>
            )}
          </div>

          {normalStops.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border border-dashed">
              <p className="text-muted-foreground font-medium text-sm">
                No stops added yet.
              </p>
              {!trip.end_date && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => setIsAddStopOpen(true)}
                    variant="premium"
                    shape="pill"
                    size="sm"
                    icon={<Plus size={13} />}
                    iconPosition="left"
                    className="mt-3 w-auto shadow-md"
                  >
                    Add First Stop
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5 w-full">
              {normalStops.map((stop) => {
                const isMenuOpen = openMenuStopId === stop.id;
                return (
                  <motion.article
                    key={stop.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-border">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground leading-snug">
                          {stop.name}
                        </h3>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          {new Date(stop.date).toLocaleDateString()}
                        </span>
                        {stop.creator_name && (
                          <div className="inline-flex items-center gap-1.5 mt-2 bg-muted/50 border border-border px-2 py-0.5 rounded-md">
                            <User size={11} className="text-muted-foreground" />
                            <span className="text-[10px] font-medium text-muted-foreground">
                              Added by <span className="text-foreground">{stop.creator_name}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Total */}
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider">
                            Total
                          </span>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="font-bold text-lg text-foreground">
                              {formatInr(stop.total)}
                            </span>
                            {stop.edited && (
                              <span
                                title="This stop was edited"
                                className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border"
                              >
                                edited
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Three-dot menu */}
                        {!trip.end_date && (
                          <div
                            className="relative"
                            ref={isMenuOpen ? menuRef : undefined}
                          >
                            <button
                              onClick={() =>
                                setOpenMenuStopId(isMenuOpen ? null : stop.id)
                              }
                              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 cursor-pointer"
                              title="More options"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            <AnimatePresence>
                              {isMenuOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute right-0 top-full mt-1 w-44 bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl shadow-2xl z-20 p-1"
                                  >
                                    <button
                                      onClick={() => {
                                        setOpenMenuStopId(null);
                                        openEditStop(stop);
                                      }}
                                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 hover:text-foreground rounded-lg transition-colors duration-200 cursor-pointer text-left group"
                                    >
                                      <Pencil
                                        size={14}
                                        className="text-muted-foreground group-hover:text-foreground transition-colors"
                                      />
                                      Edit Stop
                                    </button>
                                    <button
                                      onClick={() => openDeleteStop(stop)}
                                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors duration-200 cursor-pointer text-left mt-0.5"
                                    >
                                      <Trash2 size={14} />
                                      Delete Stop
                                    </button>
                                  </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>

                    {stop.transactions && stop.transactions.length > 0 && (
                      <div className="pt-3.5 space-y-2">
                        {stop.transactions.map((tx, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className="text-muted-foreground">
                              Paid by{" "}
                              <span className="font-semibold text-foreground">
                                {tx.paidBy}
                              </span>
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-foreground">
                                {formatInr(tx.amount)}
                              </span>
                              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
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
          <StopFormModal
            mode="create"
            isOpen={isAddStopOpen}
            onClose={() => setIsAddStopOpen(false)}
            onSubmit={handleAddStop}
            participants={trip.participants.map((p) => ({
              ...p,
              id: p.id || "",
            }))}
            isSubmitting={isAddingStop}
          />
        )}
        {isEditStopOpen && trip && editingStop && (
          <StopFormModal
            mode="edit"
            isOpen={isEditStopOpen}
            onClose={() => {
              if (!isEditingStop) {
                setIsEditStopOpen(false);
                setEditingStop(null);
              }
            }}
            onSubmit={handleEditStop}
            participants={trip.participants.map((p) => ({
              ...p,
              id: p.id || "",
            }))}
            initialData={editingStop}
            isSubmitting={isEditingStop}
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
        iconNode={dialogProps.iconNode}
        iconVariant={dialogProps.iconVariant}
        isLoading={confirmLoading}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />

      {/* Inline Delete Stop Modal Removed in favor of ConfirmDialog */}
    </div>
  );
}
