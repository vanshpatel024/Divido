import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
} from "lucide-react";
import Navbar from "./Navbar";

interface Participant {
  name: string;
  color: string;
  balance: number;
}

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

const participantColors = ["#AAD9BB", "#C9B7E0", "#F7DCB9", "#FBC4AB", "#B7D4E0", "#E0CFB7"];

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
  const isGoaTrip = id === "goa";

  const [participants, setParticipants] = useState<Participant[]>([
    { name: "Aarav", color: "#AAD9BB", balance: 1220 },
    { name: "Rahul", color: "#C9B7E0", balance: 3300 },
    { name: "Priya", color: "#F7DCB9", balance: -1380 },
    { name: "Neha", color: "#FBC4AB", balance: -640 },
    { name: "Dev", color: "#B7D4E0", balance: -2500 },
  ]);

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
    {
      id: "sports",
      name: "Water Sports",
      category: "entertainment",
      date: "2026-03-14",
      total: 6600,
      transactions: [
        { paidBy: "Aarav", amount: 4500, splitCount: 5, avatarColor: "#AAD9BB" },
        { paidBy: "Priya", amount: 2100, splitCount: 5, avatarColor: "#F7DCB9" },
      ],
    },
    {
      id: "cab",
      name: "Cab to Airport",
      category: "transport",
      date: "2026-03-12",
      total: 1400,
      transactions: [
        { paidBy: "Neha", amount: 800, splitCount: 5, avatarColor: "#FBC4AB" },
        { paidBy: "Dev", amount: 600, splitCount: 5, avatarColor: "#B7D4E0" },
      ],
    },
  ]);

  const settlements = [
    { from: { name: "Priya", color: "#F7DCB9" }, to: { name: "Rahul", color: "#C9B7E0" }, amount: 1380 },
    { from: { name: "Dev", color: "#B7D4E0" }, to: { name: "Rahul", color: "#C9B7E0" }, amount: 1920 },
    { from: { name: "Neha", color: "#FBC4AB" }, to: { name: "Aarav", color: "#AAD9BB" }, amount: 640 },
    { from: { name: "Dev", color: "#B7D4E0" }, to: { name: "Aarav", color: "#AAD9BB" }, amount: 580 },
  ];

  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [activeStopIdForTransaction, setActiveStopIdForTransaction] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<{ stopId: string; txIndex: number } | null>(null);

  const [stopName, setStopName] = useState("");
  const [stopCategory, setStopCategory] = useState<Stop["category"]>("food");
  const [stopDate, setStopDate] = useState("");

  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantEmail, setNewParticipantEmail] = useState("");

  const [txPaidBy, setTxPaidBy] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState<Stop["category"]>("food");
  const [txSplitAmong, setTxSplitAmong] = useState<string[]>([]);

  const totalSpend = stops.reduce((acc, s) => acc + s.total, 0);
  const owedCount = participants.filter((p) => p.balance > 0).length;
  const oweCount = participants.filter((p) => p.balance < 0).length;

  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stopName || !stopDate) return;
    const newStop: Stop = {
      id: Math.random().toString(36).substring(2, 9),
      name: stopName,
      category: stopCategory,
      date: stopDate,
      total: 0,
      transactions: [],
    };
    setStops([newStop, ...stops]);
    setStopName("");
    setStopCategory("food");
    setStopDate("");
    setIsAddStopOpen(false);
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipantName) return;
    const nextColor = participantColors[participants.length % participantColors.length];
    const newP: Participant = {
      name: newParticipantName,
      color: nextColor,
      balance: 0,
    };
    setParticipants([...participants, newP]);
    setNewParticipantName("");
    setNewParticipantEmail("");
    setIsAddParticipantOpen(false);
  };

  const openAddTransactionModal = (stopId: string) => {
    const targetStop = stops.find((s) => s.id === stopId);
    setActiveStopIdForTransaction(stopId);
    setTxPaidBy(participants[0]?.name || "");
    setTxAmount("");
    setTxCategory(targetStop ? targetStop.category : "food");
    setTxSplitAmong(participants.map((p) => p.name));
    setIsAddTransactionOpen(true);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0 || !activeStopIdForTransaction) return;

    const payer = participants.find((p) => p.name === txPaidBy);
    const newTx: Transaction = {
      paidBy: txPaidBy,
      amount: amt,
      splitCount: txSplitAmong.length,
      avatarColor: payer ? payer.color : "#EFECE6",
    };

    setStops(
      stops.map((s) => {
        if (s.id === activeStopIdForTransaction) {
          return { ...s, total: s.total + amt, transactions: [...s.transactions, newTx] };
        }
        return s;
      })
    );
    setIsAddTransactionOpen(false);
    setActiveStopIdForTransaction(null);
  };

  const handleDeleteTransaction = (stopId: string, txIndex: number) => {
    setStops(
      stops.map((s) => {
        if (s.id === stopId) {
          const txToDelete = s.transactions[txIndex];
          return {
            ...s,
            total: s.total - txToDelete.amount,
            transactions: s.transactions.filter((_, idx) => idx !== txIndex),
          };
        }
        return s;
      })
    );
    setActiveDropdown(null);
  };

  /* ─── NOT-FOUND FALLBACK ─── */
  if (!isGoaTrip) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <main className="mx-auto max-w-5xl px-8 py-10 flex-1">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground mb-6 decoration-none">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold">Trip Not Found</h1>
          <p className="mt-2 text-sm text-foreground/55">
            This demo only contains data for the <span className="font-semibold">Goa Vacation</span> trip (ID: <code className="bg-[#EFECE6] px-1.5 py-0.5 rounded text-xs">goa</code>).
          </p>
        </main>
      </div>
    );
  }

  /* ─── MAIN RENDER ─── */
  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      {/* ── NAVBAR ── */}
      <Navbar />

      {/* ── BREADCRUMB ── */}
      <div className="border-b border-[#EFECE6] bg-white/50 py-3">
        <div className="mx-auto max-w-5xl px-8 flex items-center gap-2">
          <Link
            to="/"
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-[#EFECE6] hover:text-foreground cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={16} />
          </Link>
          <nav className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] flex items-center gap-1.5 select-none">
            <Link to="/" className="hover:text-foreground transition-colors decoration-none">Your Trips</Link>
            <span className="text-foreground/30">/</span>
            <span className="text-foreground">Goa Vacation</span>
          </nav>
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <main className="mx-auto max-w-5xl px-8">

        {/* ━━━━━━━━━ 1. HERO SECTION ━━━━━━━━━ */}
        <section className="py-8 border-b border-[#EFECE6]">
          {/* Top row: title left, buttons right */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="font-display text-5xl font-bold tracking-tight text-foreground leading-tight">
                Goa Vacation
              </h1>
              <div className="flex items-center gap-3 mt-2 text-xs text-[#8B8A9B] select-none">
                <span>12 – 17 Mar 2026</span>
                <span className="h-1 w-1 bg-foreground/20 rounded-full" />
                <span>{participants.length} participants</span>
              </div>
            </div>

            <div className="flex items-center gap-2 select-none shrink-0">
              <button
                onClick={() => setIsAddParticipantOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#2B2A4C] bg-white px-4 py-2 text-xs font-bold text-[#2B2A4C] transition-transform duration-200 hover:scale-[1.02] cursor-pointer shadow-xs"
              >
                <Plus size={13} /> Add Participant
              </button>
              <button
                onClick={() => setIsAddStopOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2B2A4C] px-4 py-2 text-xs font-bold text-white transition-transform duration-200 hover:scale-[1.02] cursor-pointer shadow-xs"
              >
                <Plus size={13} /> Add Stop
              </button>
            </div>
          </div>

          {/* Avatars row */}
          <div className="flex -space-x-1.5 mt-4 select-none">
            {participants.map((p) => (
              <div
                key={p.name}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-foreground shadow-sm"
                style={{ backgroundColor: p.color }}
                title={p.name}
              >
                {p.name[0]}
              </div>
            ))}
          </div>

          {/* Total spend + balance inline */}
          <div className="flex items-center gap-4 mt-4 select-none">
            <span className="text-xs text-[#8B8A9B] font-medium">
              Total Spend: <span className="font-bold text-foreground">{formatInr(totalSpend)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#AAD9BB] px-4 py-1.5 text-xs font-bold text-[#1A5C3A] shadow-xs">
              You get back {formatInr(1200)}
            </span>
          </div>
        </section>

        {/* ━━━━━━━━━ 2. BALANCES CARD ━━━━━━━━━ */}
        <section className="mt-8 mb-8">
          <div className="w-full bg-white border border-[#EFECE6] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#AAD9BB] transition-all duration-200">
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground mb-5 select-none">
              Balances
            </h2>

            <div className="space-y-3 select-none">
              {participants.map((p) => {
                const isPositive = p.balance > 0;
                const isZero = p.balance === 0;

                return (
                  <div
                    key={p.name}
                    className="flex items-center py-2 px-2 hover:bg-[#F9F7F4] rounded-xl transition duration-150"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-foreground border border-white shadow-xs"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name[0]}
                    </div>
                    <span className="text-sm font-medium text-[#2B2A4C] ml-2.5 shrink-0">
                      {p.name}
                    </span>

                    {/* Dotted connector */}
                    <div className="flex-1 border-b border-dashed border-[#D4CFC8] mx-3 self-end mb-1.5" />

                    {/* Balance pill */}
                    {isZero ? (
                      <span className="inline-flex items-center rounded-full bg-[#E8E8E8] px-2.5 py-1 text-[10px] font-semibold text-[#555555] shrink-0">
                        Settled
                      </span>
                    ) : isPositive ? (
                      <span className="inline-flex items-center rounded-full bg-[#AAD9BB] px-2.5 py-1 text-[10px] font-semibold text-[#1A5C3A] shrink-0">
                        gets back {formatInr(p.balance)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#F7DCB9] px-2.5 py-1 text-[10px] font-semibold text-[#7A4A00] shrink-0">
                        owes {formatInr(Math.abs(p.balance))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary footer */}
            <p className="mt-4 pt-3 border-t border-[#F5F0E8] text-[11px] text-[#8B8A9B] select-none">
              {owedCount} {owedCount === 1 ? "person is" : "people are"} owed
              <span className="mx-1.5 text-foreground/20">•</span>
              {oweCount} {oweCount === 1 ? "person" : "people"} owe
            </p>
          </div>
        </section>

        {/* ━━━━━━━━━ 3. HOW TO SETTLE CARD ━━━━━━━━━ */}
        <section className="mb-8">
          <div className="w-full bg-white border border-[#EFECE6] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#AAD9BB] transition-all duration-200">
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground mb-5 select-none">
              How to Settle
            </h2>

            {settlements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center select-none">
                <CheckCircle2 size={40} className="text-[#1A5C3A] mb-3" />
                <p className="text-base font-semibold text-[#1A5C3A]">All settled up!</p>
              </div>
            ) : (
              <div className="space-y-6 select-none">
                {settlements.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 py-2 px-1 hover:bg-[#F9F7F4] rounded-xl transition duration-150"
                  >
                    {/* From */}
                    <div className="flex flex-col items-center w-14 shrink-0">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-foreground border-2 border-white shadow-sm"
                        style={{ backgroundColor: s.from.color }}
                      >
                        {s.from.name[0]}
                      </div>
                      <span className="text-[10px] font-semibold text-foreground mt-1 text-center truncate w-full">
                        {s.from.name}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="flex-1 flex flex-col items-center relative">
                      <span className="text-[10px] font-bold text-[#1A5C3A] bg-[#AAD9BB] px-2.5 py-0.5 rounded-full z-10 shadow-xs leading-none mb-1">
                        {formatInr(s.amount)}
                      </span>
                      <div className="w-full h-[2px] bg-[#EFECE6] relative overflow-hidden rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 0.8, delay: idx * 0.12, ease: "easeOut" }}
                          className="h-full bg-[#AAD9BB] rounded-full"
                        />
                      </div>
                      {/* Arrowhead */}
                      <div className="absolute right-0 bottom-0 translate-x-0.5 -translate-y-px w-0 h-0 border-l-[5px] border-l-[#AAD9BB] border-y-[3px] border-y-transparent" />
                    </div>

                    {/* To */}
                    <div className="flex flex-col items-center w-14 shrink-0">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-foreground border-2 border-white shadow-sm"
                        style={{ backgroundColor: s.to.color }}
                      >
                        {s.to.name[0]}
                      </div>
                      <span className="text-[10px] font-semibold text-foreground mt-1 text-center truncate w-full">
                        {s.to.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ━━━━━━━━━ 4. STOPS SECTION ━━━━━━━━━ */}
        <section className="mb-8">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground mb-5 select-none">
            Stops
          </h2>

          <div className="space-y-5 w-full">
            {stops.map((stop) => {
              const { icon: CatIcon, label: CatLabel } = getCategoryDetails(stop.category);

              return (
                <motion.article
                  key={stop.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-[#EFECE6] rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#AAD9BB] transition-all duration-200 group"
                >
                  {/* Stop Header */}
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

                  {/* Transactions */}
                  <div className="divide-y divide-[#F5F0E8] mt-1 select-none">
                    {stop.transactions.map((tx, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2.5 hover:bg-[#F9F7F4] px-1.5 rounded-xl transition duration-150"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-foreground border border-white shadow-xs"
                            style={{ backgroundColor: tx.avatarColor }}
                          >
                            {tx.paidBy[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#2B2A4C]">
                              {tx.paidBy} paid <span className="font-bold">{formatInr(tx.amount)}</span>
                            </p>
                            <span className="text-[10px] text-[#8B8A9B] block mt-0.5">
                              split equally among {tx.splitCount}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 relative">
                          {/* Category chip */}
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F0E8] px-2 py-0.5 text-[10px] text-[#2B2A4C] font-semibold border border-[#EFECE6]" title={CatLabel}>
                            {CatIcon}
                          </span>

                          {/* Three-dot menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveDropdown(
                                  activeDropdown?.stopId === stop.id && activeDropdown?.txIndex === idx
                                    ? null
                                    : { stopId: stop.id, txIndex: idx }
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/40 hover:bg-[#F5F0E8] hover:text-foreground cursor-pointer transition-colors duration-150"
                              aria-label="Transaction Options"
                            >
                              <MoreHorizontal size={14} />
                            </button>

                            {activeDropdown?.stopId === stop.id && activeDropdown?.txIndex === idx && (
                              <>
                                <div className="fixed inset-0 z-20 cursor-default" onClick={() => setActiveDropdown(null)} />
                                <div className="absolute right-0 top-8 bg-white border border-[#EFECE6] rounded-xl shadow-lg py-1 w-28 z-30 text-xs select-none">
                                  <button
                                    onClick={() => { alert("Edit is disabled in this demo."); setActiveDropdown(null); }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-[#F5F0E8] text-[#2B2A4C] font-semibold cursor-pointer transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransaction(stop.id, idx)}
                                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 font-semibold cursor-pointer transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Transaction */}
                  <div className="mt-3 pt-3 border-t border-[#F5F0E8]">
                    <button
                      onClick={() => openAddTransactionModal(stop.id)}
                      className="inline-flex items-center gap-1 text-sm font-bold text-[#1A5C3A] hover:text-[#13442a] hover:underline cursor-pointer transition-colors duration-150"
                    >
                      <Plus size={13} strokeWidth={2.5} /> Add Transaction
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

      </main>

      {/* ═══════════════════ MODALS ═══════════════════ */}
      <AnimatePresence>
        {/* ADD STOP */}
        {isAddStopOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddStopOpen(false)} className="absolute inset-0 bg-black/30 backdrop-blur-xs cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-[#EFECE6] rounded-2xl w-full max-w-md p-6 shadow-xl relative z-10">
              <h3 className="font-display text-xl font-bold text-foreground mb-4 select-none">Add New Stop</h3>
              <form onSubmit={handleAddStop} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1 select-none">Stop Name</label>
                  <input type="text" required value={stopName} onChange={(e) => setStopName(e.target.value)} placeholder="e.g. Beachside Dinner" className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1 select-none">Category</label>
                  <select value={stopCategory} onChange={(e) => setStopCategory(e.target.value as Stop["category"])} className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground cursor-pointer">
                    <option value="food">Food</option><option value="hotel">Hotel</option><option value="transport">Transport</option><option value="flight">Flight</option><option value="entertainment">Entertainment</option><option value="shopping">Shopping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1 select-none">Date</label>
                  <input type="date" required value={stopDate} onChange={(e) => setStopDate(e.target.value)} className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground cursor-pointer" />
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2 select-none">
                  <button type="button" onClick={() => setIsAddStopOpen(false)} className="rounded-full border border-[#2B2A4C] px-5 py-2 text-xs font-bold text-[#2B2A4C] hover:scale-[1.02] transition-transform duration-200 cursor-pointer bg-white">Cancel</button>
                  <button type="submit" className="rounded-full bg-[#2B2A4C] text-white px-5 py-2 text-xs font-bold hover:scale-[1.02] transition-transform duration-200 cursor-pointer">Add Stop</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ADD PARTICIPANT */}
        {isAddParticipantOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddParticipantOpen(false)} className="absolute inset-0 bg-black/30 backdrop-blur-xs cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-[#EFECE6] rounded-2xl w-full max-w-md p-6 shadow-xl relative z-10">
              <h3 className="font-display text-xl font-bold text-foreground mb-4 select-none">Add Participant</h3>
              <form onSubmit={handleAddParticipant} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1 select-none">Full Name</label>
                  <input type="text" required value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} placeholder="e.g. Rohan Sen" className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1 select-none">Email (Optional)</label>
                  <input type="email" value={newParticipantEmail} onChange={(e) => setNewParticipantEmail(e.target.value)} placeholder="rohan@example.com" className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground" />
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2 select-none">
                  <button type="button" onClick={() => setIsAddParticipantOpen(false)} className="rounded-full border border-[#2B2A4C] px-5 py-2 text-xs font-bold text-[#2B2A4C] hover:scale-[1.02] transition-transform duration-200 cursor-pointer bg-white">Cancel</button>
                  <button type="submit" className="rounded-full bg-[#2B2A4C] text-white px-5 py-2 text-xs font-bold hover:scale-[1.02] transition-transform duration-200 cursor-pointer">Confirm</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ADD TRANSACTION */}
        {isAddTransactionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddTransactionOpen(false)} className="absolute inset-0 bg-black/30 backdrop-blur-xs cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-[#EFECE6] rounded-2xl w-full max-w-md p-6 shadow-xl relative z-10">
              <h3 className="font-display text-xl font-bold text-foreground mb-4 select-none">Add Transaction</h3>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1 select-none">Paid By</label>
                  <select value={txPaidBy} onChange={(e) => setTxPaidBy(e.target.value)} className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground cursor-pointer">
                    {participants.map((p) => (<option key={p.name} value={p.name}>{p.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1 select-none">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8B8A9B] text-sm select-none pointer-events-none z-10">₹</span>
                    <input type="number" required min="1" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="e.g. 500" className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 pl-8 pr-4 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1 select-none">Category</label>
                  <select value={txCategory} onChange={(e) => setTxCategory(e.target.value as Stop["category"])} className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground cursor-pointer">
                    <option value="food">Food</option><option value="hotel">Hotel</option><option value="transport">Transport</option><option value="flight">Flight</option><option value="entertainment">Entertainment</option><option value="shopping">Shopping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-2 select-none">Split Among</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-[#EFECE6] rounded-xl p-3 bg-[#F9F7F4]/50 select-none">
                    {participants.map((p) => {
                      const isChecked = txSplitAmong.includes(p.name);
                      return (
                        <label key={p.name} className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-foreground">
                          <input type="checkbox" checked={isChecked} onChange={() => { if (isChecked) { setTxSplitAmong(txSplitAmong.filter((n) => n !== p.name)); } else { setTxSplitAmong([...txSplitAmong, p.name]); } }} className="rounded text-[#2B2A4C] focus:ring-primary w-4 h-4 cursor-pointer" />
                          <span>{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2 select-none">
                  <button type="button" onClick={() => setIsAddTransactionOpen(false)} className="rounded-full border border-[#2B2A4C] px-5 py-2 text-xs font-bold text-[#2B2A4C] hover:scale-[1.02] transition-transform duration-200 cursor-pointer bg-white">Cancel</button>
                  <button type="submit" className="rounded-full bg-[#2B2A4C] text-white px-5 py-2 text-xs font-bold hover:scale-[1.02] transition-transform duration-200 cursor-pointer">Add Transaction</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
