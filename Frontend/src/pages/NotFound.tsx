import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";

export default function NotFound() {
  // Theme State
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  // Dynamic Background SVG Lines
  const [randomLines, setRandomLines] = useState<string[]>([]);
  useEffect(() => {
    const lines = [];
    const numLines = 5;
    for (let i = 0; i < numLines; i++) {
      const startY = 15 + (70 / numLines) * i + (Math.random() * 10 - 5);
      const cp1X = 25 + (Math.random() * 20 - 10);
      const cp1Y = startY + (Math.random() * 30 - 15);
      const cp2X = 75 + (Math.random() * 20 - 10);
      const cp2Y = startY + (Math.random() * 30 - 15);
      const endY = startY + (Math.random() * 20 - 10);
      lines.push(`M -10 ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, 110 ${endY}`);
    }
    setRandomLines(lines);
  }, []);


  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center select-none font-sans bg-background text-foreground relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 transition-all duration-700 bg-gradient-to-br from-sidebar-start via-sidebar-middle to-sidebar-end opacity-40 dark:opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary opacity-[0.05] blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent opacity-[0.05] blur-[80px] pointer-events-none"></div>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          {randomLines.map((path, idx) => (
            <path key={idx} d={path} fill="none" stroke={idx % 2 === 0 ? "var(--wave-stroke-even)" : "var(--wave-stroke-odd)"} strokeWidth="0.15" />
          ))}
        </svg>
      </div>

      {/* Top-Right Theme Toggle */}
      <div className="absolute top-8 right-8 z-20">
         <button
            type="button"
            onClick={toggleTheme}
            className="relative flex items-center justify-center w-10 h-10 rounded-full border border-border shadow-sm bg-card hover:bg-muted/30 text-accent dark:bg-secondary dark:hover:bg-muted dark:text-primary transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="moon"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute"
                >
                  <Moon size={16} />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute"
                >
                  <Sun size={16} />
                </motion.div>
              )}
            </AnimatePresence>
         </button>
      </div>

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-[380px] flex flex-col items-center p-8 md:p-10 rounded-2xl bg-card/85 backdrop-blur-xl border border-border/20 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        
        {/* Logo */}
        <Logo className="mb-6" />

        {/* 404 text */}
        <h1 className="font-display text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-destructive tracking-tight leading-none mb-3">
          404
        </h1>

        {/* Tagline */}
        <h2 className="font-display text-lg font-bold text-foreground mb-1 select-none">
          Lost Trip!
        </h2>
        
        {/* Subtext */}
        <p className="text-xs text-muted-foreground max-w-xs mb-6 select-none leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>


        {/* Action Button */}
        <Link to="/dashboard" className="w-full block decoration-none">
          <Button icon={<ChevronLeft size={14} />} iconPosition="left">
            Go back to dashboard
          </Button>
        </Link>
      </div>

    </div>
  );
}
