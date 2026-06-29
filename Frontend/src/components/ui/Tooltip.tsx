import React, { useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-brand-navy border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-brand-navy border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-brand-navy border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-brand-navy border-y-transparent border-l-transparent",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-[999] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-brand-navy rounded-lg shadow-lg pointer-events-none whitespace-nowrap transition-opacity duration-150 animate-fade-in ${positionClasses[position]}`}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute border-[4px] ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}
