import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User as UserIcon } from "lucide-react";
import { useToast } from "./Toast";
import { useAuth, resolveAvatarUrl } from "../context/AuthContext";
import CustomDropdown from "./CustomDropdown";

interface Participant {
  id: string;
  name: string;
  avatar_url?: string;
  username?: string;
}

interface NewStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (stopData: any) => void;
  participants: Participant[];
  isSubmitting?: boolean;
}



export default function NewStopModal({ isOpen, onClose, onCreate, participants, isSubmitting = false }: NewStopModalProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [name, setName] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Who paid what
  const [payerType, setPayerType] = useState<"single" | "multiple">("single");
  const [singlePayerId, setSinglePayerId] = useState<string>(user?.id || "");
  const [multiplePayments, setMultiplePayments] = useState<{ userId: string, amount: string }[]>([]);

  // Who is splitting
  const [splits, setSplits] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSinglePayerId(user?.id || (participants.length > 0 ? participants[0].id : ""));
      setSplits(participants.map(p => p.id));
      setMultiplePayments(participants.map(p => ({ userId: p.id, amount: "" })));
    }
  }, [isOpen, participants, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Helper to compute remaining amount when there is exactly one empty field
  const getAutoFillPayer = () => {
    const total = parseFloat(amountInput);
    if (isNaN(total) || total <= 0) return null;

    const activePayers = participants.filter(p => splits.includes(p.id));
    if (activePayers.length < 2) return null;

    const paymentsWithValues = activePayers.map(p => {
      const item = multiplePayments.find(m => m.userId === p.id);
      const valStr = item ? item.amount : "";
      const val = parseFloat(valStr);
      return {
        userId: p.id,
        valStr,
        val: isNaN(val) ? 0 : val,
        isEmpty: valStr.trim() === ""
      };
    });

    const emptyPayers = paymentsWithValues.filter(p => p.isEmpty);
    if (emptyPayers.length === 1) {
      const targetPayer = emptyPayers[0];
      const sumOfOthers = paymentsWithValues
        .filter(p => p.userId !== targetPayer.userId)
        .reduce((sum, p) => sum + p.val, 0);

      const remaining = total - sumOfOthers;
      if (remaining > 0) {
        return {
          userId: targetPayer.userId,
          amount: Math.round(remaining * 100) / 100
        };
      }
    }
    return null;
  };

  const autoFillPayer = getAutoFillPayer();

  const handleToggleSplit = (userId: string) => {
    if (splits.includes(userId)) {
      setSplits(splits.filter(id => id !== userId));
      // Clear payment value when unselected to keep UX clean
      setMultiplePayments(prev => prev.map(p => p.userId === userId ? { ...p, amount: "" } : p));
    } else {
      setSplits([...splits, userId]);
    }
  };

  const handleMultiplePaymentChange = (userId: string, val: string) => {
    setMultiplePayments(prev => prev.map(p => p.userId === userId ? { ...p, amount: val } : p));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Stop name is required", "error");
      return;
    }

    const totalAmount = parseFloat(amountInput);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      showToast("Please enter a valid positive amount", "error");
      return;
    }

    if (splits.length === 0) {
      showToast("At least one person must split the cost", "error");
      return;
    }

    let finalPayments: { userId: string, amount: number }[] = [];

    if (payerType === "single") {
      finalPayments = [{ userId: singlePayerId, amount: totalAmount }];
    } else {
      // Fallback: Auto-fill the remaining payer's amount on submission if only one is empty
      let currentPayments = [...multiplePayments];
      if (autoFillPayer) {
        currentPayments = currentPayments.map(m =>
          m.userId === autoFillPayer.userId ? { ...m, amount: autoFillPayer.amount.toString() } : m
        );
      }

      let sum = 0;
      finalPayments = currentPayments.filter(p => {
        if (!splits.includes(p.userId)) return false;
        const amt = parseFloat(p.amount);
        return !isNaN(amt) && amt > 0;
      }).map(p => {
        const amt = parseFloat(p.amount);
        sum += amt;
        return { userId: p.userId, amount: amt };
      });

      if (finalPayments.length === 0) {
        showToast("Please enter payment amounts", "error");
        return;
      }
      
      if (Math.abs(sum - totalAmount) > 0.01) {
        showToast(`Payments sum (${sum}) must equal total amount (${totalAmount})`, "error");
        return;
      }
    }

    const stopData = {
      name: name.trim(),
      date: new Date(date).toISOString(),
      totalAmount,
      payments: finalPayments,
      splits
    };

    onCreate(stopData);
    
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
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-xs cursor-pointer"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#EFECE6] rounded-2xl w-full max-w-lg p-6 shadow-xl relative z-10 font-sans max-h-[90vh] flex flex-col"
      >
        <h3 className="font-display text-2xl font-bold text-[#2B2A4C] mb-5 select-none shrink-0">
          Add Stop
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {/* Name & Amount */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1.5 select-none">
                Stop Name
              </label>
              <input
                disabled={isSubmitting}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dinner at Mario's"
                className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1.5 select-none">
                Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8B8A9B] font-semibold">
                  ₹
                </span>
                <input
                  disabled={isSubmitting}
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 pl-8 pr-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1.5 select-none">
                Date
              </label>
              <input
                disabled={isSubmitting}
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <hr className="border-[#F5F0E8] my-2" />

          {/* Paid By */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] select-none">
                Paid By
              </label>
              <div className="flex bg-[#F5F0E8] rounded-lg p-0.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setPayerType("single")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : payerType === "single"
                      ? "bg-white text-[#2B2A4C] shadow-sm cursor-pointer"
                      : "text-[#8B8A9B] cursor-pointer"
                  }`}
                >
                  Single
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setPayerType("multiple")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : payerType === "multiple"
                      ? "bg-white text-[#2B2A4C] shadow-sm cursor-pointer"
                      : "text-[#8B8A9B] cursor-pointer"
                  }`}
                >
                  Multiple
                </button>
              </div>
            </div>

            {payerType === "single" ? (
              <CustomDropdown
                disabled={isSubmitting}
                value={singlePayerId}
                onChange={setSinglePayerId}
                options={participants.map((p) => ({
                  value: p.id,
                  label: p.name,
                  avatarUrl: p.avatar_url,
                  subtitle: p.username ? `@${p.username}` : undefined
                }))}
              />
            ) : (
              <div className="space-y-2 border border-[#EFECE6] rounded-xl p-3 bg-[#faf9f7]">
                {participants.filter(p => splits.includes(p.id)).map((p, idx) => {
                  const paymentVal = multiplePayments.find(m => m.userId === p.id)?.amount || "";
                  const isAutoFillTarget = autoFillPayer && autoFillPayer.userId === p.id;
                  
                  return (
                    <div key={p.id ? `${p.id}-${idx}` : idx} className="flex items-center justify-between gap-3">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold text-[#2B2A4C] truncate">{p.name}</span>
                        {isAutoFillTarget && (
                          <span className="text-[10px] text-[#1A5C3A] font-semibold mt-0.5 select-none animate-pulse">
                            Leftover: {autoFillPayer.amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 select-none">
                        {isAutoFillTarget && (
                          <button
                            type="button"
                            onClick={() => {
                              setMultiplePayments(prev => prev.map(m => m.userId === autoFillPayer.userId ? { ...m, amount: autoFillPayer.amount.toString() } : m));
                            }}
                            className="text-[10px] bg-[#eef7f1] hover:bg-[#e2f1e6] border border-[#AAD9BB] text-[#1A5C3A] font-extrabold px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-xs"
                          >
                            Fill ₹{autoFillPayer.amount}
                          </button>
                        )}
                        <div className="relative w-24">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[#8B8A9B] text-xs font-semibold">₹</span>
                          <input
                            type="number"
                            disabled={isSubmitting}
                            min="0"
                            step="0.01"
                            placeholder={isAutoFillTarget ? autoFillPayer.amount.toString() : "0.00"}
                            value={paymentVal}
                            onChange={(e) => handleMultiplePaymentChange(p.id, e.target.value)}
                            className="w-full rounded-md border border-[#EFECE6] bg-white py-1.5 pl-6 pr-2 text-xs outline-none focus:border-[#AAD9BB] disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="border-[#F5F0E8] my-2" />

          {/* Split Among */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-2 select-none flex justify-between">
              <span>Split Among</span>
              <span className="normal-case font-normal text-[#2B2A4C]">
                ({splits.length}/{participants.length} selected)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {participants.map((p, idx) => {
                const isSelected = splits.includes(p.id);
                return (
                  <div
                    key={p.id ? `${p.id}-${idx}` : idx}
                    onClick={() => !isSubmitting && handleToggleSplit(p.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                      isSubmitting
                        ? "opacity-60 cursor-not-allowed border-[#EFECE6]"
                        : isSelected
                        ? "border-[#AAD9BB] bg-[#eef7f1] cursor-pointer"
                        : "border-[#EFECE6] hover:bg-[#F5F0E8] cursor-pointer"
                    }`}
                  >
                    {p.avatar_url ? (
                      <img src={resolveAvatarUrl(p.avatar_url, p.id || p.username || '')} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white border border-[#EFECE6] flex items-center justify-center text-[#8B8A9B]">
                        <UserIcon size={12} />
                      </div>
                    )}
                    <span className={`text-sm flex-1 truncate ${isSelected ? "font-bold text-[#1A5C3A]" : "font-semibold text-[#2B2A4C]"}`}>
                      {p.name}
                    </span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-[#1A5C3A] bg-[#1A5C3A]" : "border-[#8B8A9B]"}`}>
                      {isSelected && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-white"><path d="M3 7.5L6 10.5L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F5F0E8] select-none mt-2 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className={`rounded-full border border-[#2B2A4C] px-6 py-2.5 text-xs font-bold text-[#2B2A4C] transition-colors duration-200 bg-white ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F5F0E8] cursor-pointer"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center justify-center rounded-full bg-[#2B2A4C] text-white px-6 py-2.5 text-xs font-bold transition-colors duration-200 min-w-32 cursor-pointer ${
                isSubmitting ? "opacity-75 cursor-not-allowed" : "hover:bg-[#1f1e36]"
              }`}
            >
              {isSubmitting ? (
                <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Add Stop"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
