import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function MainLayout() {
  const [backgroundLines, setBackgroundLines] = useState<{ path: string; strokeWidth: number }[]>([]);
  
  useEffect(() => {
    // Helper to calculate Euclidean distance between two points
    const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    };

    // Storing line points dynamically to compute distances
    const generated: { start: { x: number; y: number }; end: { x: number; y: number } }[] = [];
    const lines: { path: string; strokeWidth: number }[] = [];
    
    // Limits for random stroke widths (smooth and elegant, in screen pixels with non-scaling-stroke)
    const minWidth = 1.6;
    const maxWidth = 3.6;
    const getRandomWidth = () => minWidth + Math.random() * (maxWidth - minWidth);

    // Spans with distinct non-overlapping starting and ending zones (12 segments for desktop)
    const spans = [
      { start: { x: -10, y: [10, 22] }, end: { x: [10, 22], y: -10 } },       // 0: Top-Left corner
      { start: { x: -10, y: [78, 90] }, end: { x: [10, 22], y: 110 } },       // 1: Bottom-Left corner
      { start: { x: 110, y: [10, 22] }, end: { x: [78, 90], y: -10 } },       // 2: Top-Right corner
      { start: { x: 110, y: [78, 90] }, end: { x: [78, 90], y: 110 } },       // 3: Bottom-Right corner
      { start: { x: -10, y: [33, 40] }, end: { x: 110, y: [35, 42] } },       // 4: Horizontal Upper-Middle
      { start: { x: -10, y: [58, 65] }, end: { x: 110, y: [55, 62] } },       // 5: Horizontal Lower-Middle
      { start: { x: [33, 40], y: -10 }, end: { x: [35, 42], y: 110 } },       // 6: Vertical Left-Middle
      { start: { x: [58, 65], y: -10 }, end: { x: [55, 62], y: 110 } },       // 7: Vertical Right-Middle
      { start: { x: -10, y: [45, 52] }, end: { x: [52, 60], y: -10 } },       // 8: Diagonal bottom-left-mid to top-mid
      { start: { x: 110, y: [45, 52] }, end: { x: [40, 48], y: 110 } },       // 9: Diagonal top-right-mid to bottom-mid
      { start: { x: -10, y: [68, 75] }, end: { x: [68, 75], y: -10 } },       // 10: Diagonal bottom-left to top-right
      { start: { x: 110, y: [25, 32] }, end: { x: [25, 32], y: 110 } }        // 11: Diagonal top-right to bottom-left
    ];

    // Optimize for mobile (fewer lines, maximally spaced out to prevent clumping)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // On mobile, pick 6 paths that are far apart (e.g. index 0, 3, 5, 7, 10, 11)
    const activeSpans = isMobile 
      ? [spans[0], spans[3], spans[5], spans[7], spans[10], spans[11]] 
      : spans;

    const minDistance = 15; // Enforces that no two line ends/starts spawn within 15% distance of each other

    activeSpans.forEach((span) => {
      let startX = 0, startY = 0, endX = 0, endY = 0;
      let isValid = false;
      let retries = 0;

      while (!isValid && retries < 50) {
        startX = typeof span.start.x === 'number' ? span.start.x : span.start.x[0] + Math.random() * (span.start.x[1] - span.start.x[0]);
        startY = typeof span.start.y === 'number' ? span.start.y : span.start.y[0] + Math.random() * (span.start.y[1] - span.start.y[0]);
        endX = typeof span.end.x === 'number' ? span.end.x : span.end.x[0] + Math.random() * (span.end.x[1] - span.end.x[0]);
        endY = typeof span.end.y === 'number' ? span.end.y : span.end.y[0] + Math.random() * (span.end.y[1] - span.end.y[0]);

        // Check if endpoints are too close to any previously generated line's endpoints
        let tooClose = false;
        for (const existing of generated) {
          const distStart = getDistance(startX, startY, existing.start.x, existing.start.y);
          const distEnd = getDistance(endX, endY, existing.end.x, existing.end.y);
          const distCross1 = getDistance(startX, startY, existing.end.x, existing.end.y);
          const distCross2 = getDistance(endX, endY, existing.start.x, existing.start.y);

          if (distStart < minDistance || distEnd < minDistance || distCross1 < minDistance || distCross2 < minDistance) {
            tooClose = true;
            break;
          }
        }

        if (!tooClose) {
          isValid = true;
        } else {
          retries++;
        }
      }

      // Control points are calculated dynamically to make them gentle curves passing near the center
      const cp1X = startX + (endX - startX) * 0.3 + (Math.random() * 20 - 10);
      const cp1Y = startY + (endY - startY) * 0.3 + (Math.random() * 20 - 10);
      const cp2X = startX + (endX - startX) * 0.7 + (Math.random() * 20 - 10);
      const cp2Y = startY + (endY - startY) * 0.7 + (Math.random() * 20 - 10);

      generated.push({ start: { x: startX, y: startY }, end: { x: endX, y: endY } });
      lines.push({
        path: `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`,
        strokeWidth: getRandomWidth()
      });
    });

    setBackgroundLines(lines);
  }, []);

  return (
    <div className="min-h-screen text-foreground font-sans pb-20 relative transition-colors duration-300">
      {/* Subtle page-wide gradient backdrop — placed at -z-20 so it sits behind the lines */}
      <div
        className="fixed inset-0 pointer-events-none -z-20 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, transparent 20%, var(--color-accent) 120%)",
          opacity: "0.06",
        }}
      />
      
      {/* Abstract lines background — placed at -z-10 so they render on top of the backdrop but behind content */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-[0.15] dark:opacity-[0.1]">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          {backgroundLines.map((line, idx) => (
            <motion.path
              key={idx}
              d={line.path}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={line.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: idx * 0.18, ease: "easeOut" }}
            />
          ))}
        </svg>
      </div>

      <Navbar />

      <Outlet />
    </div>
  );
}
