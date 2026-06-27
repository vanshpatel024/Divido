import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, User as UserIcon } from "lucide-react";
import { resolveAvatarUrl } from "../context/AuthContext";

export interface DropdownOption {
  value: string;
  label: string;
  avatarUrl?: string;
  subtitle?: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = "Select option",
  label
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full font-sans" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1.5 select-none">
          {label}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-primary/50 focus:border-primary/50 text-foreground select-none cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${isOpen ? "border-[#AAD9BB] shadow-[0_0_0_3px_rgba(170,217,187,0.25)]" : ""}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.avatarUrl !== undefined ? (
                <img
                  src={resolveAvatarUrl(selectedOption.avatarUrl || "", selectedOption.value)}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover border border-[#EFECE6] shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#EFECE6] flex items-center justify-center text-[#8B8A9B] shrink-0">
                  <UserIcon size={10} />
                </div>
              )}
              <span className="font-semibold text-[#2B2A4C] truncate">
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="text-foreground/45">{placeholder}</span>
          )}
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[#8B8A9B] shrink-0 ml-1.5"
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {/* Options Dropdown Menu */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 mt-1.5 bg-white border border-[#EFECE6] rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto custom-scrollbar overflow-hidden"
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-xs text-[#8B8A9B] select-none text-center">
                No options available
              </div>
            ) : (
              options.map((opt, idx) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors text-left select-none cursor-pointer first:rounded-t-xl last:rounded-b-xl ${
                      isSelected
                        ? "bg-[#eef7f1] text-[#1A5C3A]"
                        : "hover:bg-muted text-[#2B2A4C]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {opt.avatarUrl !== undefined ? (
                        <img
                          src={resolveAvatarUrl(opt.avatarUrl || "", opt.value)}
                          alt=""
                          className="w-5.5 h-5.5 rounded-full object-cover border border-[#EFECE6] shrink-0"
                        />
                      ) : (
                        <div className="w-5.5 h-5.5 rounded-full bg-[#EFECE6] flex items-center justify-center text-[#8B8A9B] shrink-0">
                          <UserIcon size={11} />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className={`leading-none truncate ${isSelected ? "font-bold" : "font-semibold"}`}>
                          {opt.label}
                        </span>
                        {opt.subtitle && (
                          <span className="text-[10px] text-[#8B8A9B] mt-0.5 truncate">
                            {opt.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={14} strokeWidth={2.5} className="text-[#1A5C3A] shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
