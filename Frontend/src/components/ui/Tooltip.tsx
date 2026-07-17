import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function Tooltip({
  content,
  children,
  position = "top",
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      updateCoords();
      // Use capture phase to catch scroll events from any scrollable ancestor
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
      return () => {
        window.removeEventListener("scroll", updateCoords, true);
        window.removeEventListener("resize", updateCoords);
      };
    }
  }, [isVisible, updateCoords]);

  const hasPositioning = ["relative", "absolute", "fixed", "sticky"].some(
    (cls) => className.includes(cls),
  );

  const wrapperClasses = `${hasPositioning ? "" : "relative"} inline-flex ${className}`.trim();

  // Determine fixed style based on position
  let topStyle = 0;
  let leftStyle = 0;
  let transformStyle = "";

  if (position === "top") {
    topStyle = coords.top - 8;
    leftStyle = coords.left + coords.width / 2;
    transformStyle = "translate(-50%, -100%)";
  } else if (position === "bottom") {
    topStyle = coords.top + coords.height + 8;
    leftStyle = coords.left + coords.width / 2;
    transformStyle = "translate(-50%, 0)";
  } else if (position === "left") {
    topStyle = coords.top + coords.height / 2;
    leftStyle = coords.left - 8;
    transformStyle = "translate(-100%, -50%)";
  } else if (position === "right") {
    topStyle = coords.top + coords.height / 2;
    leftStyle = coords.left + coords.width + 8;
    transformStyle = "translate(0, -50%)";
  }

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-border border-x-transparent border-b-transparent",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-border border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-border border-y-transparent border-r-transparent",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-border border-y-transparent border-l-transparent",
  };

  const arrowInnerClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-popover border-x-transparent border-b-transparent -mt-[1px]",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-popover border-x-transparent border-t-transparent -mb-[1px]",
    left: "left-full top-1/2 -translate-y-1/2 border-l-popover border-y-transparent border-r-transparent -ml-[1px]",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-popover border-y-transparent border-l-transparent -mr-[1px]",
  };

  return (
    <div
      ref={triggerRef}
      className={wrapperClasses}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  top: topStyle,
                  left: leftStyle,
                  transform: transformStyle,
                }}
                className={`z-[9999] px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-widest text-popover-foreground bg-popover/95 backdrop-blur-md border border-border rounded-lg shadow-xl pointer-events-none whitespace-nowrap`}
                role="tooltip"
              >
                {content}
                <div className={`absolute border-[4px] ${arrowClasses[position]}`} />
                <div className={`absolute border-[3px] ${arrowInnerClasses[position]}`} />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
