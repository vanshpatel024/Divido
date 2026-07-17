import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  ChevronDown,
  Check,
  AlertTriangle,
  Filter,
} from "lucide-react";
import Button from "../components/ui/Button";
import TripCard from "../components/trips/TripCard";
import NewTripModal from "../components/modals/NewTripModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import type { Trip } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Hero Header ──────────────────────────────────────────────────────────────
function HeroHeader({ onNewTrip }: { onNewTrip: () => void }) {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-8 pt-10 pb-0 flex flex-row items-center sm:items-end justify-between gap-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="min-w-0 flex-1"
      >
        <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground tracking-tight leading-none truncate">
          Your Trips
        </h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-sans text-muted-foreground">
          Track spending, balances, and who owes whom.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Button
          onClick={onNewTrip}
          variant="premium"
          shape="pill"
          size="md"
          icon={<Plus size={14} />}
          iconPosition="left"
          className="w-auto shadow-md shrink-0 whitespace-nowrap"
        >
          New Trip
        </Button>
      </motion.div>
    </div>
  );
}

// ─── Filter Dropdown ───────────────────────────────────────────────────────────
type FilterValue = "all" | "owe" | "owed" | "settled";

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: "All Trips", value: "all" },
  { label: "You Owe", value: "owe" },
  { label: "You Get Back", value: "owed" },
  { label: "Settled", value: "settled" },
];

function FilterDropdown({
  value,
  onChange,
  mobileIconOnly = false,
}: {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  mobileIconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = FILTER_OPTIONS.find((o) => o.value === value)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className={`inline-flex items-center justify-center border border-border bg-card text-foreground hover:bg-muted/40 transition-all duration-200 cursor-pointer ${
          mobileIconOnly
            ? "w-[42px] h-[42px] rounded-xl"
            : "gap-2 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap"
        }`}
      >
        {mobileIconOnly ? (
          <Filter size={16} className="text-muted-foreground" />
        ) : (
          <>
            {selected.label}
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 text-muted-foreground ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 z-30 min-w-[160px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
          >
            <div className="p-1.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between w-full gap-3 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  {opt.label}
                  {opt.value === value && (
                    <Check size={12} className="text-accent shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Search & Filter Bar ───────────────────────────────────────────────────────
function SearchFilterBar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  resultCount,
  totalCount,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  filter: FilterValue;
  onFilterChange: (v: FilterValue) => void;
  resultCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 py-6">
      {/* Search input + Mobile Filter */}
      <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-[360px]">
        <div className="relative flex-1 min-w-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search size={15} className="text-accent opacity-60" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search trips..."
            className="w-full h-[42px] rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-base sm:text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button
              onClick={() => onQueryChange("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <span className="text-xs">✕</span>
            </button>
          )}
        </div>

        <div className="sm:hidden shrink-0">
          <FilterDropdown
            value={filter}
            onChange={onFilterChange}
            mobileIconOnly
          />
        </div>
      </div>

      {/* Spacer on desktop pushes filter to right */}
      <div className="hidden sm:flex flex-1" />

      {/* Result count + Desktop Filter */}
      <div className="flex items-center justify-between sm:justify-end gap-3">
        {(query || filter !== "all") && (
          <span className="text-xs text-muted-foreground font-medium">
            {resultCount} of {totalCount}
          </span>
        )}
        <div className="hidden sm:block shrink-0">
          <FilterDropdown value={filter} onChange={onFilterChange} />
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-8 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <span className="text-2xl">✈️</span>
      </div>
      <h3 className="font-display text-xl font-bold text-foreground">
        No trips yet.
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-xs font-sans">
        Create your first trip and start splitting expenses with your crew.
      </p>
      <Button
        onClick={onAddClick}
        variant="premium"
        shape="pill"
        size="md"
        icon={<Plus size={14} />}
        iconPosition="left"
        className="mt-6 w-auto"
      >
        Create Trip
      </Button>
    </div>
  );
}

// ─── No Results State ──────────────────────────────────────────────────────────
function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-14 text-center col-span-full">
      <Search size={28} className="text-muted-foreground/50 mb-3" />
      <h3 className="font-display text-base font-semibold text-foreground">
        No matching trips
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Try a different search or filter.
      </p>
      <button
        onClick={onReset}
        className="mt-4 text-xs font-semibold text-accent hover:text-accent-hover underline underline-offset-2 cursor-pointer transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="w-full relative">
      <div className="fixed inset-0 backdrop-blur-md bg-background/50 z-[-5] pointer-events-none transition-all duration-500" />
      {/* Hero skeleton */}
      <div className="mx-auto max-w-5xl px-4 sm:px-8 pt-10 pb-0 flex flex-row items-center sm:items-end justify-between gap-4">
        <div className="space-y-1.5 sm:space-y-3 min-w-0 flex-1">
          <div className="h-7 sm:h-10 w-32 sm:w-48 bg-muted rounded-xl skeleton-shimmer" />
          <div className="h-3 sm:h-4 w-40 sm:w-64 bg-muted rounded-md skeleton-shimmer" />
        </div>
        <div className="h-9 sm:h-10 w-24 sm:w-28 bg-muted rounded-full skeleton-shimmer mb-1 shrink-0" />
      </div>
      <main className="mx-auto max-w-5xl px-4 sm:px-8 pb-20 mt-2">
        {/* Search bar skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 py-6">
          <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-[360px]">
            <div className="h-[42px] flex-1 min-w-0 rounded-xl bg-muted skeleton-shimmer" />
            <div className="h-[42px] w-[42px] rounded-xl bg-muted skeleton-shimmer shrink-0 sm:hidden" />
          </div>
          <div className="hidden sm:flex flex-1" />
          <div className="hidden sm:block shrink-0">
            <div className="h-[34px] w-28 rounded-full bg-muted skeleton-shimmer" />
          </div>
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pb-12">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm border-l-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-5 w-36 rounded bg-muted skeleton-shimmer" />
                  <div className="h-3 w-24 rounded bg-muted skeleton-shimmer" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="h-6 w-20 rounded-full bg-muted skeleton-shimmer" />
                  <div className="h-7 w-7 rounded-full bg-muted skeleton-shimmer" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex -space-x-1.5">
                  {[1, 2, 3].map((a) => (
                    <div
                      key={a}
                      className="h-8 w-8 rounded-full border-2 border-card bg-muted skeleton-shimmer"
                    />
                  ))}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="h-2 w-16 rounded bg-muted skeleton-shimmer" />
                  <div className="h-6 w-24 rounded bg-muted skeleton-shimmer" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {[1, 2].map((c) => (
                  <div
                    key={c}
                    className="h-6 w-16 rounded-full bg-muted skeleton-shimmer"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const {
    data: tripsList = [],
    isLoading,
    error,
  } = useQuery<Trip[], Error>({
    queryKey: ["trips"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const res = await fetch("http://localhost:3000/trips", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        logout();
        navigate("/auth");
        throw new Error("Unauthorized");
      }
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch trips");
      return data.data || [];
    },
    enabled: !!token,
  });

  // Modals Visibility
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active Trip for Editing/Deleting
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);

  // ── Client-side search & filter ──
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterValue>("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Dynamic Background SVG Lines
  // Background lines generation has been moved to MainLayout.tsx

  useEffect(() => {
    const handleUpdate = () => queryClient.invalidateQueries({ queryKey: ["trips"] });
    window.addEventListener("divido_dashboard_update", handleUpdate);
    return () =>
      window.removeEventListener("divido_dashboard_update", handleUpdate);
  }, [queryClient]);

  // ── Derived filtered list ──
  const filteredTrips = tripsList
    .filter((t) =>
      t.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
    )
    .filter((t) => {
      if (filterStatus === "all") return true;
      if (filterStatus === "settled")
        return t.balance.kind === "settled" || (t.balance as any).amount === 0;
      return t.balance.kind === filterStatus;
    });

  const hasTrips = tripsList.length > 0;
  const hasResults = filteredTrips.length > 0;

  // ── Handlers (all untouched logic) ──
  const handleCreateTrip = async (newTripData: any) => {
    if (!token) return;
    setIsCreatingTrip(true);
    try {
      const res = await fetch("http://localhost:3000/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTripData.name,
          categories: newTripData.categories,
          invitees: newTripData.invitees,
        }),
      });
      if (res.status === 401) {
        logout();
        navigate("/auth");
        return;
      }
      const responseData = await res.json();
      if (responseData.success) {
        queryClient.invalidateQueries({ queryKey: ["trips"] });
        setIsNewOpen(false);
      } else {
        showToast(responseData.message || "Failed to create trip", "error");
      }
    } catch (err) {
      console.error("Error creating trip:", err);
      showToast("Network error creating trip", "error");
    } finally {
      setIsCreatingTrip(false);
    }
  };

  const handleDeleteClick = (trip: Trip) => {
    setActiveTrip(trip);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async (tripId: string) => {
    if (!token) return;
    setIsDeletingTrip(true);
    try {
      const res = await fetch(`http://localhost:3000/trips/${tripId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        queryClient.invalidateQueries({ queryKey: ["trips"] });
        setIsDeleteOpen(false);
      } else {
        showToast(data.message || "Failed to delete trip", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error", "error");
    } finally {
      setIsDeletingTrip(false);
      setActiveTrip(null);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
  };

  // ── Loading state ──
  if (isLoading) return <DashboardSkeleton />;

  // ── Error state ──
  if (error) {
    return (
      <div className="w-full font-sans">
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="p-6 bg-card border border-border rounded-2xl max-w-md shadow-sm">
            <h3 className="font-display text-xl font-bold text-destructive">
              Failed to Load Trips
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="dark"
              shape="pill"
              size="md"
              className="mt-5 w-auto"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-foreground font-sans">
      {/* ── Hero Banner ── */}
      <HeroHeader onNewTrip={() => setIsNewOpen(true)} />

      {/* ── Content Area ── */}
      <main className="mx-auto max-w-5xl px-4 sm:px-8">
        {hasTrips ? (
          <>
            {/* Search + Filter bar */}
            <SearchFilterBar
              query={searchQuery}
              onQueryChange={setSearchQuery}
              filter={filterStatus}
              onFilterChange={setFilterStatus}
              resultCount={filteredTrips.length}
              totalCount={tripsList.length}
            />

            {/* Trip cards grid */}
            {hasResults ? (
              <motion.div
                layout
                className="grid grid-cols-1 gap-4 md:grid-cols-2 pb-12"
              >
                {filteredTrips.map((trip, i) => (
                  <motion.div
                    key={trip.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: Math.min(i * 0.03, 0.12),
                      ease: "easeOut",
                    }}
                  >
                    <TripCard
                      trip={trip}
                      index={i}
                      onDelete={handleDeleteClick}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="py-4 pb-12">
                <NoResults onReset={handleResetFilters} />
              </div>
            )}
          </>
        ) : (
          /* Truly empty — no trips at all */
          <div className="pt-10 pb-12 max-w-xl mx-auto">
            <EmptyState onAddClick={() => setIsNewOpen(true)} />
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {isNewOpen && (
          <NewTripModal
            isOpen={isNewOpen}
            onClose={() => setIsNewOpen(false)}
            onCreate={handleCreateTrip}
            isSubmitting={isCreatingTrip}
          />
        )}
      </AnimatePresence>

      {/* Leave / delete trip confirm */}
      <ConfirmDialog
        isOpen={isDeleteOpen && !!activeTrip}
        title="Leave Trip?"
        message={
          <>
            This will permanently remove you from{""}
            <strong className="text-foreground">{activeTrip?.name}</strong>. If
            you are the last participant, the trip will be completely deleted.
          </>
        }
        extraContent={
          activeTrip &&
          !(activeTrip.end_date && activeTrip.balance.kind === "settled") ? (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium">
              {!activeTrip.end_date
                ? "You cannot leave this trip because it hasn't ended yet."
                : "You cannot leave this trip because your balance is not settled."}
            </div>
          ) : undefined
        }
        iconNode={<AlertTriangle size={20} />}
        iconVariant="danger"
        confirmLabel="Leave"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeletingTrip}
        confirmDisabled={
          !activeTrip ||
          !(activeTrip.end_date && activeTrip.balance.kind === "settled")
        }
        onConfirm={() => activeTrip && handleConfirmDelete(activeTrip.id)}
        onCancel={() => {
          if (!isDeletingTrip) {
            setIsDeleteOpen(false);
            setActiveTrip(null);
          }
        }}
      />
    </div>
  );
}
