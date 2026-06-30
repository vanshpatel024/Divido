import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon,
  X,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../ui/Toast";
import { useAuth, resolveAvatarUrl } from "../../contexts/AuthContext";
import CustomDropdown from "../ui/CustomDropdown";
import Button from "../ui/Button";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

interface Participant {
  id: string;
  name: string;
  avatar_url?: string;
  username?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.18, ease: "easeOut" as const },
  },
};

interface StopFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stopData: any) => void;
  participants: Participant[];
  isSubmitting?: boolean;
  mode?: "create" | "edit";
  initialData?: any;
}

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

function CustomDatePicker({
  value,
  onChange,
  disabled,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dateObj = value ? new Date(value) : new Date();
  const [currentYear, setCurrentYear] = useState(dateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(dateObj.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const yyyy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const allDays = [...blanks, ...days];

  const formatDateForDisplay = (val: string) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative group p-[1px]">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary dark:text-accent pointer-events-none transition-colors duration-700 group-focus-within:text-primary">
          <Calendar size={15} />
        </span>
        <input
          type="text"
          readOnly
          disabled={disabled}
          value={formatDateForDisplay(value)}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder="Select date"
          className="w-full rounded-lg border border-border bg-background/50 py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/50 focus:border-primary cursor-pointer"
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-foreground">
                {months[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-muted text-foreground transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-bold text-muted-foreground">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="py-0.5">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {allDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`blank-${idx}`} className="py-1" />;
                }
                const formattedDayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = value === formattedDayStr;
                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StopFormModal({
  isOpen,
  onClose,
  onSubmit,
  participants,
  isSubmitting = false,
  mode = "create",
  initialData,
}: StopFormModalProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [amountError, setAmountError] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Who paid what
  const [payerType, setPayerType] = useState<"single" | "multiple">("single");
  const [singlePayerId, setSinglePayerId] = useState<string>(user?.id || "");
  const [multiplePayments, setMultiplePayments] = useState<
    { userId: string; amount: string }[]
  >([]);

  // Who is splitting
  const [splits, setSplits] = useState<string[]>([]);

  // Apply scroll lock hook
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setName(initialData.name);
        setNameError("");
        setAmountInput(initialData.total.toString());
        setAmountError("");
        setDate(initialData.date.split("T")[0]);

        const uniquePayers = [
          ...new Set(initialData.transactions.map((t: any) => t.paidBy)),
        ];
        if (uniquePayers.length === 1) {
          setPayerType("single");
          const payer = participants.find((p) => p.name === uniquePayers[0]);
          setSinglePayerId(payer?.id || "");
        } else {
          setPayerType("multiple");
        }

        const splitParticipants = [
          ...new Set(
            initialData.transactions.flatMap((t: any) =>
              Array.from({ length: t.splitCount }, () => t.paidBy),
            ),
          ),
        ];
        const splitIds = splitParticipants
          .map((p) => participants.find((pt) => pt.name === p)?.id)
          .filter((id): id is string => !!id);
        setSplits(splitIds);

        setMultiplePayments(
          participants.map((p) => {
            const t = initialData.transactions.find(
              (tx: any) => tx.paidBy === p.name,
            );
            return { userId: p.id, amount: t ? t.amount.toString() : "" };
          }),
        );
      } else {
        setSinglePayerId(
          user?.id || (participants.length > 0 ? participants[0].id : ""),
        );
        setSplits(participants.map((p) => p.id));
        setMultiplePayments(
          participants.map((p) => ({ userId: p.id, amount: "" })),
        );
      }
    }
  }, [isOpen, participants, user, mode, initialData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Helper to compute remaining amount when there is exactly one empty field
  const getAutoFillPayer = () => {
    const total = parseFloat(amountInput);
    if (isNaN(total) || total <= 0) return null;

    const activePayers = participants.filter((p) => splits.includes(p.id));
    if (activePayers.length < 2) return null;

    const paymentsWithValues = activePayers.map((p) => {
      const item = multiplePayments.find((m) => m.userId === p.id);
      const valStr = item ? item.amount : "";
      const val = parseFloat(valStr);
      return {
        userId: p.id,
        valStr,
        val: isNaN(val) ? 0 : val,
        isEmpty: valStr.trim() === "",
      };
    });

    const emptyPayers = paymentsWithValues.filter((p) => p.isEmpty);
    if (emptyPayers.length === 1) {
      const targetPayer = emptyPayers[0];
      const sumOfOthers = paymentsWithValues
        .filter((p) => p.userId !== targetPayer.userId)
        .reduce((sum, p) => sum + p.val, 0);

      const remaining = total - sumOfOthers;
      if (remaining > 0) {
        return {
          userId: targetPayer.userId,
          amount: Math.round(remaining * 100) / 100,
        };
      }
    }
    return null;
  };

  const autoFillPayer = getAutoFillPayer();

  const handleToggleSplit = (userId: string) => {
    if (splits.includes(userId)) {
      setSplits(splits.filter((id) => id !== userId));
      // Clear payment value when unselected to keep UX clean
      setMultiplePayments((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, amount: "" } : p)),
      );
    } else {
      setSplits([...splits, userId]);
    }
  };

  const handleMultiplePaymentChange = (userId: string, val: string) => {
    setMultiplePayments((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, amount: val } : p)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let valid = true;
    setNameError("");
    setAmountError("");

    if (!name.trim()) {
      setNameError("Stop name is required");
      valid = false;
    }

    const totalAmount = parseFloat(amountInput);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      setAmountError("Please enter a valid positive amount");
      valid = false;
    }

    if (!valid) return;

    if (splits.length === 0) {
      showToast("At least one person must split the cost", "error");
      return;
    }

    let finalPayments: { userId: string; amount: number }[] = [];

    if (payerType === "single") {
      finalPayments = [{ userId: singlePayerId, amount: totalAmount }];
    } else {
      // Fallback: Auto-fill the remaining payer's amount on submission if only one is empty
      let currentPayments = [...multiplePayments];
      if (autoFillPayer) {
        currentPayments = currentPayments.map((m) =>
          m.userId === autoFillPayer.userId
            ? { ...m, amount: autoFillPayer.amount.toString() }
            : m,
        );
      }

      let sum = 0;
      finalPayments = currentPayments
        .filter((p) => {
          if (!splits.includes(p.userId)) return false;
          const amt = parseFloat(p.amount);
          return !isNaN(amt) && amt > 0;
        })
        .map((p) => {
          const amt = parseFloat(p.amount);
          sum += amt;
          return { userId: p.userId, amount: amt };
        });

      if (finalPayments.length === 0) {
        showToast("Please enter payment amounts", "error");
        return;
      }

      if (Math.abs(sum - totalAmount) > 0.01) {
        showToast(
          `Payments sum (${sum}) must equal total amount (${totalAmount})`,
          "error",
        );
        return;
      }
    }

    const stopData = {
      name: name.trim(),
      date: new Date(date).toISOString(),
      totalAmount,
      payments: finalPayments,
      splits,
    };

    onSubmit(stopData);

    // Reset state handled by parent via unmounting or manual reset
    setName("");
    setAmountInput("");
    setPayerType("single");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative z-10 font-sans max-h-[90vh] flex flex-col text-foreground"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors duration-200 p-1.5 rounded-full hover:bg-muted/50 cursor-pointer z-20"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <h3 className="font-display text-2xl font-bold text-foreground mb-5 shrink-0">
          {mode === "edit" ? "Edit Stop" : "Add Stop"}
        </h3>

        <motion.form
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 flex flex-col overflow-visible"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Static Top Fields (Name, Amount, Date) */}
          <div className="flex flex-col gap-4 shrink-0 overflow-visible mb-2 p-[1px]">
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-5 sm:grid-cols-3 gap-4"
            >
              {/* Stop Name */}
              <div className="col-span-5 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 text-muted-foreground transition-colors duration-700">
                  Stop Name
                </label>
                <div className="relative group p-[1px]">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary dark:text-accent pointer-events-none transition-colors duration-700 group-focus-within:text-primary">
                    <MapPin size={15} />
                  </span>
                  <input
                    disabled={isSubmitting}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    placeholder="e.g. Dinner at Mario's"
                    className={`w-full rounded-lg border py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all duration-300 bg-background/50 text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                      nameError
                        ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                        : "border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    }`}
                  />
                </div>
                {nameError && (
                  <p className="mt-1 text-[11px] font-medium text-destructive leading-none">
                    {nameError}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 text-muted-foreground transition-colors duration-700">
                  Amount
                </label>
                <div className="relative group p-[1px]">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary dark:text-accent font-semibold pointer-events-none transition-colors duration-700 group-focus-within:text-primary">
                    ₹
                  </span>
                  <input
                    disabled={isSubmitting}
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value);
                      if (amountError) setAmountError("");
                    }}
                    placeholder="0.00"
                    className={`w-full rounded-lg border py-2.5 pl-7 pr-3 text-[13px] outline-none transition-all duration-300 bg-background/50 text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                      amountError
                        ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                        : "border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    }`}
                  />
                </div>
                {amountError && (
                  <p className="mt-1 text-[11px] font-medium text-destructive leading-none">
                    {amountError}
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="col-span-3 sm:col-span-3">
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 text-muted-foreground transition-colors duration-700">
                  Date
                </label>
                <CustomDatePicker
                  disabled={isSubmitting}
                  value={date}
                  onChange={setDate}
                />
              </div>
            </motion.div>
          </div>

          {/* Scrollable Middle Content */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 my-2 p-[1px]">
            <hr className="border-border/40" />

            {/* Paid By */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors duration-200">
                  Paid By
                </label>
                <div className="relative flex bg-muted border border-border/60 rounded-lg p-0.5 w-40 overflow-hidden">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setPayerType("single")}
                    className={`relative z-10 w-1/2 py-1 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : payerType === "single"
                          ? "text-foreground font-bold"
                          : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setPayerType("multiple")}
                    className={`relative z-10 w-1/2 py-1 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : payerType === "multiple"
                          ? "text-foreground font-bold"
                          : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Multiple
                  </button>

                  {/* Sliding Pill Background */}
                  {!isSubmitting && (
                    <motion.div
                      animate={{ x: payerType === "single" ? "0%" : "100%" }}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 30,
                      }}
                      className="absolute top-0.5 bottom-0.5 left-0.5 bg-card rounded-md shadow-xs border border-border/40"
                      style={{ width: "calc(50% - 4px)" }}
                    />
                  )}
                </div>
              </div>

              {splits.length === 0 ? (
                <div className="flex items-center gap-3 p-3.5 border border-dashed border-border rounded-xl bg-background/20 text-left">
                  <AlertCircle
                    size={16}
                    className="text-muted-foreground shrink-0"
                  />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      No participants selected
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Select split participants in the list below.
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {payerType === "single" ? (
                    <motion.div
                      key="single"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      <CustomDropdown
                        disabled={isSubmitting}
                        value={singlePayerId}
                        onChange={setSinglePayerId}
                        options={participants.map((p) => ({
                          value: p.id,
                          label: p.name,
                          avatarUrl: p.avatar_url,
                          subtitle: p.username ? `@${p.username}` : undefined,
                        }))}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="multiple"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="space-y-2 border border-border/80 rounded-xl p-3 bg-background/30"
                    >
                      {participants
                        .filter((p) => splits.includes(p.id))
                        .map((p, idx) => {
                          const paymentVal =
                            multiplePayments.find((m) => m.userId === p.id)
                              ?.amount || "";
                          const isAutoFillTarget =
                            autoFillPayer && autoFillPayer.userId === p.id;

                          return (
                            <div
                              key={p.id ? `${p.id}-${idx}` : idx}
                              className="flex items-center justify-between gap-3"
                            >
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-semibold text-foreground break-words">
                                  {p.name}
                                </span>
                                {isAutoFillTarget && (
                                  <span className="text-[10px] text-accent font-semibold mt-0.5 animate-pulse">
                                    Leftover:{" "}
                                    {autoFillPayer.amount.toLocaleString(
                                      "en-IN",
                                      {
                                        style: "currency",
                                        currency: "INR",
                                        maximumFractionDigits: 2,
                                      },
                                    )}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {isAutoFillTarget && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMultiplePayments((prev) =>
                                        prev.map((m) =>
                                          m.userId === autoFillPayer.userId
                                            ? {
                                                ...m,
                                                amount:
                                                  autoFillPayer.amount.toString(),
                                              }
                                            : m,
                                        ),
                                      );
                                    }}
                                    className="text-[10px] bg-accent/10 hover:bg-accent/20 border border-accent/40 text-accent font-extrabold px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
                                  >
                                    Fill ₹{autoFillPayer.amount}
                                  </button>
                                )}
                                <div className="relative w-24">
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-secondary dark:text-accent text-xs font-semibold">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    disabled={isSubmitting}
                                    min="0"
                                    step="0.01"
                                    placeholder={
                                      isAutoFillTarget
                                        ? autoFillPayer.amount.toString()
                                        : "0.00"
                                    }
                                    value={paymentVal}
                                    onChange={(e) =>
                                      handleMultiplePaymentChange(
                                        p.id,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded-md border border-border bg-background/50 py-1.5 pl-6 pr-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>

            <hr className="border-border/40" />

            {/* Split Among */}
            <motion.div variants={itemVariants}>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-2 flex justify-between text-muted-foreground transition-colors duration-200">
                <span>Split Among</span>
                <span className="normal-case font-semibold text-foreground">
                  ({splits.length}/{participants.length} selected)
                </span>
              </label>
              <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2">
                {participants.map((p, idx) => {
                  const isSelected = splits.includes(p.id);
                  return (
                    <div
                      key={p.id ? `${p.id}-${idx}` : idx}
                      onClick={() => !isSubmitting && handleToggleSplit(p.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                        isSubmitting
                          ? "opacity-60 cursor-not-allowed border-border"
                          : isSelected
                            ? "border-accent/25 bg-accent/4 cursor-pointer"
                            : "border-border/60 hover:bg-muted cursor-pointer"
                      }`}
                    >
                      {p.avatar_url ? (
                        <img
                          src={resolveAvatarUrl(
                            p.avatar_url,
                            p.id || p.username || "",
                          )}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground">
                          <UserIcon size={12} />
                        </div>
                      )}
                      <span
                        className={`text-sm flex-1 break-words ${isSelected ? "font-bold text-foreground" : "font-semibold text-foreground"}`}
                      >
                        {p.name}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-accent bg-accent text-white" : "border-muted-foreground"}`}
                      >
                        {isSelected && (
                          <svg
                            viewBox="0 0 14 14"
                            fill="none"
                            className="w-3 h-3 text-white"
                          >
                            <path
                              d="M3 7.5L6 10.5L11 3.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Form Actions (Sticky Footer) */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/40 mt-2 shrink-0 p-[1px]"
          >
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              variant="dark-outline"
              shape="pill"
              size="md"
              className="w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              variant="premium"
              shape="pill"
              size="md"
              className="w-auto"
            >
              Add Stop
            </Button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
}
