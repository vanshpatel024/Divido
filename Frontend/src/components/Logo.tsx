import { Leaf } from "lucide-react";

interface LogoProps {
  variant?: "sidebar" | "card" | "navbar";
  className?: string;
  isDark?: boolean;
}

export default function Logo({ variant = "navbar", className = "", isDark = false }: LogoProps) {
  if (variant === "card") {
    return (
      <div className={`flex flex-col items-center gap-3 mb-6 select-none ${className}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#FF6B6B] to-[#FF4D4D] shadow-sm">
          <Leaf size={20} className="text-white" />
        </div>
        <div className="flex flex-col items-center">
          <span className={`font-display text-xl font-bold tracking-tight transition-colors duration-700 ${isDark ? 'text-white' : 'text-[#13161D]'}`}>
            Divido
          </span>
          <p className={`text-xs mt-0.5 transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
            Split trips, not friendships.
          </p>
        </div>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={`flex items-center gap-2 text-white select-none ${className}`}>
        <Leaf size={24} />
        <span className="font-display text-xl font-bold tracking-tight">Divido</span>
      </div>
    );
  }

  // Default navbar variant (horizontal, smaller, matches brand accents)
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF4D4D] shadow-sm">
        <Leaf size={16} className="text-white" />
      </div>
      <span className="font-display text-base font-bold tracking-tight text-foreground">
        Divido
      </span>
    </div>
  );
}
