import { Leaf } from "lucide-react";

interface LogoProps {
  variant?: "sidebar" | "card" | "navbar";
  className?: string;
  isDark?: boolean;
}

export default function Logo({
  variant = "navbar",
  className = "",
}: LogoProps) {
  if (variant === "card") {
    return (
      <div className={`flex flex-col items-center gap-3 mb-6 ${className}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-accent to-destructive shadow-sm">
          <Leaf size={20} className="text-white" />
        </div>
        <div className="flex flex-col items-center">
          <span className="font-display text-xl font-bold tracking-tight text-foreground transition-colors duration-700">
            Divido
          </span>
          <p className="text-xs mt-0.5 text-muted-foreground transition-colors duration-700">
            Split trips, not friendships.
          </p>
        </div>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={`flex items-center gap-2 text-white ${className}`}>
        <Leaf size={24} />
        <span className="font-display text-xl font-bold tracking-tight">
          Divido
        </span>
      </div>
    );
  }

  // Default navbar variant (horizontal, smaller, matches brand accents)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-destructive shadow-sm">
        <Leaf size={16} className="text-white" />
      </div>
      <span className="font-display text-base font-bold tracking-tight text-foreground">
        Divido
      </span>
    </div>
  );
}
