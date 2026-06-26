import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ChevronDown, Check, AlertTriangle } from "lucide-react";
import Navbar from "./Navbar";
import Button from "./Button";
import TripCard from "./TripCard";
import NewTripModal from "./NewTripModal";
import ConfirmDialog from "./ConfirmDialog";
import type { Trip } from "../types";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ─── Hero Header ──────────────────────────────────────────────────────────────
function HeroHeader({ onNewTrip }: { onNewTrip: () => void }) {
  return (
    <div className="mx-auto max-w-5xl px-6 sm:px-8 pt-10 pb-6 flex items-end justify-between select-none">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-none">
          Your Trips
        </h1>
        <p className="mt-2 text-sm font-sans text-muted-foreground">
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
          className="w-auto shadow-md"
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
}: {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = FILTER_OPTIONS.find((o) => o.value === value)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/40 transition-all duration-200 cursor-pointer whitespace-nowrap select-none"
      >
        {selected.label}
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 text-muted-foreground ${open ? "rotate-180" : ""}`}
        />
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
      {/* Search input */}
      <div className="relative flex-1 max-w-full sm:max-w-[360px]">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <Search size={15} className="text-accent opacity-60" />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search trips..."
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
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

      {/* Spacer on desktop pushes filter to right */}
      <div className="hidden sm:flex flex-1" />

      {/* Result count + Filter */}
      <div className="flex items-center gap-3">
        {(query || filter !== "all") && (
          <span className="text-xs text-muted-foreground font-medium">
            {resultCount} of {totalCount}
          </span>
        )}
        <FilterDropdown value={filter} onChange={onFilterChange} />
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-8 py-16 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <span className="text-2xl">✈️</span>
      </div>
      <h3 className="font-display text-xl font-bold text-foreground">No trips yet.</h3>
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-14 text-center select-none col-span-full">
      <Search size={28} className="text-muted-foreground/50 mb-3" />
      <h3 className="font-display text-base font-semibold text-foreground">No matching trips</h3>
      <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter.</p>
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
    <div className="min-h-screen bg-background text-foreground font-sans select-none">
      <Navbar />
      {/* Hero skeleton */}
      <div className="w-full bg-muted" style={{ height: "clamp(140px, 22vw, 200px)" }} />
      <main className="mx-auto max-w-5xl px-8 pb-20">
        {/* Search bar skeleton */}
        <div className="flex items-center gap-3 py-6">
          <div className="h-10 w-80 rounded-xl bg-muted animate-pulse" />
          <div className="flex-1" />
          <div className="h-9 w-28 rounded-full bg-muted animate-pulse" />
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm border-l-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-36 rounded-md bg-muted animate-pulse" />
                  <div className="h-3 w-24 rounded-md bg-muted animate-pulse" />
                </div>
                <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((a) => (
                    <div key={a} className="h-8 w-8 rounded-full border-2 border-card bg-muted animate-pulse" />
                  ))}
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                  <div className="h-6 w-20 rounded bg-muted animate-pulse" />
                </div>
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
  const [tripsList, setTripsList] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
  const [backgroundLines, setBackgroundLines] = useState<{ path: string; strokeWidth: number }[]>([]);
  useEffect(() => {
    // Helper to calculate Euclidean distance between two points
    const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    };

    // Storing line points dynamically to compute distances
    const generated: { start: { x: number; y: number }; end: { x: number; y: number } }[] = [];
    const lines: { path: string; strokeWidth: number }[] = [];
    
    // Limits for random stroke widths (smooth and elegant, in screen pixels with non-scaling-stroke)
    const minWidth = 1.6;
    const maxWidth = 3.6;
    const getRandomWidth = () => minWidth + Math.random() * (maxWidth - minWidth);

    // Spans with distinct non-overlapping starting and ending zones (12 segments for desktop)
    const spans = [
      { start: { x: -10, y: [10, 22] }, end: { x: [10, 22], y: -10 } },       // 0: Top-Left corner
      { start: { x: -10, y: [78, 90] }, end: { x: [10, 22], y: 110 } },       // 1: Bottom-Left corner
      { start: { x: 110, y: [10, 22] }, end: { x: [78, 90], y: -10 } },       // 2: Top-Right corner
      { start: { x: 110, y: [78, 90] }, end: { x: [78, 90], y: 110 } },       // 3: Bottom-Right corner
      { start: { x: -10, y: [33, 40] }, end: { x: 110, y: [35, 42] } },       // 4: Horizontal Upper-Middle
      { start: { x: -10, y: [58, 65] }, end: { x: 110, y: [55, 62] } },       // 5: Horizontal Lower-Middle
      { start: { x: [33, 40], y: -10 }, end: { x: [35, 42], y: 110 } },       // 6: Vertical Left-Middle
      { start: { x: [58, 65], y: -10 }, end: { x: [55, 62], y: 110 } },       // 7: Vertical Right-Middle
      { start: { x: -10, y: [45, 52] }, end: { x: [52, 60], y: -10 } },       // 8: Diagonal bottom-left-mid to top-mid
      { start: { x: 110, y: [45, 52] }, end: { x: [40, 48], y: 110 } },       // 9: Diagonal top-right-mid to bottom-mid
      { start: { x: -10, y: [68, 75] }, end: { x: [68, 75], y: -10 } },       // 10: Diagonal bottom-left to top-right
      { start: { x: 110, y: [25, 32] }, end: { x: [25, 32], y: 110 } }        // 11: Diagonal top-right to bottom-left
    ];

    // Optimize for mobile (fewer lines, maximally spaced out to prevent clumping)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // On mobile, pick 6 paths that are far apart (e.g. index 0, 3, 5, 7, 10, 11)
    const activeSpans = isMobile 
      ? [spans[0], spans[3], spans[5], spans[7], spans[10], spans[11]] 
      : spans;

    const minDistance = 15; // Enforces that no two line ends/starts spawn within 15% distance of each other

    activeSpans.forEach((span) => {
      let startX = 0, startY = 0, endX = 0, endY = 0;
      let isValid = false;
      let retries = 0;

      while (!isValid && retries < 50) {
        startX = typeof span.start.x === 'number' ? span.start.x : span.start.x[0] + Math.random() * (span.start.x[1] - span.start.x[0]);
        startY = typeof span.start.y === 'number' ? span.start.y : span.start.y[0] + Math.random() * (span.start.y[1] - span.start.y[0]);
        endX = typeof span.end.x === 'number' ? span.end.x : span.end.x[0] + Math.random() * (span.end.x[1] - span.end.x[0]);
        endY = typeof span.end.y === 'number' ? span.end.y : span.end.y[0] + Math.random() * (span.end.y[1] - span.end.y[0]);

        // Check if endpoints are too close to any previously generated line's endpoints
        let tooClose = false;
        for (const existing of generated) {
          const distStart = getDistance(startX, startY, existing.start.x, existing.start.y);
          const distEnd = getDistance(endX, endY, existing.end.x, existing.end.y);
          const distCross1 = getDistance(startX, startY, existing.end.x, existing.end.y);
          const distCross2 = getDistance(endX, endY, existing.start.x, existing.start.y);

          if (distStart < minDistance || distEnd < minDistance || distCross1 < minDistance || distCross2 < minDistance) {
            tooClose = true;
            break;
          }
        }

        if (!tooClose) {
          isValid = true;
        } else {
          retries++;
        }
      }

      // Control points are calculated dynamically to make them gentle curves passing near the center
      const cp1X = startX + (endX - startX) * 0.3 + (Math.random() * 20 - 10);
      const cp1Y = startY + (endY - startY) * 0.3 + (Math.random() * 20 - 10);
      const cp2X = startX + (endX - startX) * 0.7 + (Math.random() * 20 - 10);
      const cp2Y = startY + (endY - startY) * 0.7 + (Math.random() * 20 - 10);

      generated.push({ start: { x: startX, y: startY }, end: { x: endX, y: endY } });
      lines.push({
        path: `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`,
        strokeWidth: getRandomWidth()
      });
    });

    setBackgroundLines(lines);
  }, []);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const tripsRes = await fetch("http://localhost:3000/trips", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tripsRes.status === 401) {
        logout();
        navigate("/auth");
        return;
      }
      const tripsData = await tripsRes.json();
      if (tripsData.success) {
        setTripsList(tripsData.data || []);
      } else {
        setError(tripsData.message || "Failed to fetch trips");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Network error fetching data. Please check if your server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, logout, navigate]);

  useEffect(() => {
    const handleUpdate = () => fetchDashboardData();
    window.addEventListener("divido_dashboard_update", handleUpdate);
    return () => window.removeEventListener("divido_dashboard_update", handleUpdate);
  }, [token]);

  // ── Derived filtered list ──
  const filteredTrips = tripsList
    .filter((t) => t.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
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
        setTripsList((prev) => [responseData.data, ...prev]);
        setIsNewOpen(false);
      } else {
        alert(responseData.message || "Failed to create trip");
      }
    } catch (err) {
      console.error("Error creating trip:", err);
      alert("Network error creating trip");
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
        setTripsList(tripsList.filter((t) => t.id !== tripId));
        setIsDeleteOpen(false);
      } else {
        alert(data.message || "Failed to delete trip");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
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
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="p-6 bg-card border border-border rounded-2xl max-w-md shadow-sm">
            <h3 className="font-display text-xl font-bold text-destructive">Failed to Load Trips</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{error}</p>
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
    <div className="min-h-screen text-foreground font-sans pb-20 relative">
      {/* Subtle page-wide gradient backdrop — placed at -z-20 so it sits behind the lines */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, transparent 20%, var(--color-accent) 120%)",
          opacity: "0.06",
        }}
      />
      
      {/* Abstract lines background — placed at -z-10 so they render on top of the backdrop but behind content */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-[0.15] dark:opacity-[0.1]">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          {backgroundLines.map((line, idx) => (
            <motion.path
              key={idx}
              d={line.path}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={line.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: idx * 0.18, ease: "easeOut" }}
            />
          ))}
        </svg>
      </div>
      <Navbar />

      {/* ── Hero Banner ── */}
      <HeroHeader onNewTrip={() => setIsNewOpen(true)} />

      {/* ── Content Area ── */}
      <main className="mx-auto max-w-5xl px-6 sm:px-8">

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
                className="grid grid-cols-1 gap-6 md:grid-cols-2 pb-12"
              >
                {filteredTrips.map((trip, i) => (
                  <motion.div
                    key={trip.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.12), ease: "easeOut" }}
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
            This will permanently remove you from{" "}
            <strong className="text-foreground">{activeTrip?.name}</strong>. If you are the last participant, the trip will be completely deleted.
          </>
        }
        extraContent={
          activeTrip && !(activeTrip.end_date && activeTrip.balance.kind === "settled") ? (
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
        confirmDisabled={!activeTrip || !(activeTrip.end_date && activeTrip.balance.kind === "settled")}
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
