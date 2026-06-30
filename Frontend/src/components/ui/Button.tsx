import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?:
    | "premium"
    | "secondary"
    | "dark"
    | "dark-outline"
    | "danger"
    | "danger-outline";
  size?: "sm" | "md" | "lg";
  shape?: "pill" | "square";
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export default function Button({
  children,
  variant = "premium",
  size = "lg",
  shape = "pill",
  isLoading = false,
  icon,
  iconPosition = "right",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  // Base classes (flexible width, center align)
  const hasWidth = className.split(" ").some((c) => c.startsWith("w-"));
  const widthClass = hasWidth ? "" : "w-full";

  const baseClass = `${widthClass} cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold`;

  // Variant mappings
  const variantClasses = {
    premium: "btn-premium text-white",
    secondary:
      "btn-secondary-premium border border-border bg-card text-foreground hover:bg-muted/10",
    dark: "bg-brand-navy hover:bg-brand-navy-hover text-white",
    "dark-outline":
      "border border-border text-foreground bg-transparent hover:border-primary/50 hover:bg-primary/5 transition-colors duration-200",
    danger:
      "bg-destructive hover:bg-destructive-hover text-destructive-foreground",
    "danger-outline":
      "border border-destructive text-destructive bg-transparent hover:bg-destructive/10",
  };

  // Size mappings
  const sizeClasses = {
    sm: "h-[32px] px-3.5 text-xs font-semibold gap-1.5",
    md: "h-[40px] px-5 text-xs font-bold gap-2",
    lg: "h-[44px] px-6 text-[13px] font-bold gap-2",
  };

  // Shape mappings
  const shapeClasses = {
    pill: "rounded-full",
    square: "rounded-xl",
  };

  const finalClassName = `${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${shapeClasses[shape]} ${className}`;

  return (
    <button
      disabled={disabled || isLoading}
      className={finalClassName}
      {...props}
    >
      {isLoading ? (
        <span className="relative z-10 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span className="relative z-10 flex items-center justify-center gap-1.5">
          {icon && iconPosition === "left" && icon}
          {children}
          {icon && iconPosition === "right" && icon}
        </span>
      )}
    </button>
  );
}
