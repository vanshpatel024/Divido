import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Logo from "../ui/Logo";

const CAROUSEL_INTERVAL_MS = 5000;

export default function AuthSidebar() {
  // Carousel State
  const carouselTexts = [
    { title: "Plan together.\nPay together.", subtitle: "Split trip expenses with friends. Track balances, settle up, and keep your journeys stress-free." },
    { title: "Track every expense\neffortlessly.", subtitle: "No more spreadsheets. Just add the cost, tag your friends, and we'll do the math." },
    { title: "Settle up with\na single tap.", subtitle: "Send reminders, view balances, and pay each other back directly through the app." }
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);

  // Auto-rotate slides every 5s (resets to 5s if user manually changes slide)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSlideDirection(1);
      setCurrentSlide((prev) => (prev + 1) % carouselTexts.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  const handleNextSlide = () => {
    setSlideDirection(1);
    setCurrentSlide((prev) => (prev + 1) % carouselTexts.length);
  };

  const handlePrevSlide = () => {
    setSlideDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + carouselTexts.length) % carouselTexts.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
      filter: "blur(4px)"
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.4, type: "spring" as const, stiffness: 300, damping: 30 }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      filter: "blur(4px)",
      transition: { duration: 0.3 }
    })
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
    <div className="hidden md:flex md:w-[40%] relative flex-col justify-between h-full p-12 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 transition-all duration-700 bg-gradient-to-br from-sidebar-start via-sidebar-middle to-sidebar-end">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary opacity-[0.05] blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent opacity-[0.05] blur-[80px] pointer-events-none"></div>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          {randomLines.map((path, idx) => (
            <path key={idx} d={path} fill="none" stroke={idx % 2 === 0 ? "var(--wave-stroke-even)" : "var(--wave-stroke-odd)"} strokeWidth="0.15" />
          ))}
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 mt-4">
        <Logo variant="sidebar" />
      </div>

      <div className="relative z-10 mt-auto pb-4 h-[240px] flex flex-col justify-end">
        <AnimatePresence custom={slideDirection} mode="wait">
          <motion.div
            key={currentSlide}
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col"
          >
            <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4 whitespace-pre-line">
              {carouselTexts[currentSlide].title}
            </h1>
            <p className="text-white/80 font-sans text-sm max-w-[280px] leading-relaxed">
              {carouselTexts[currentSlide].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
        
        <div className="flex items-center justify-between mt-8 w-full max-w-[280px]">
          <div className="flex gap-2">
            {carouselTexts.map((_, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={() => {
                  setSlideDirection(idx > currentSlide ? 1 : -1);
                  setCurrentSlide(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'}`}
              ></button>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={handlePrevSlide}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowRight size={14} className="rotate-180" />
            </button>
            <button 
              type="button"
              onClick={handleNextSlide}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
