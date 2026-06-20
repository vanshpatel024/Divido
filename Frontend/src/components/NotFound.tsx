import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      
      {/* 404 text */}
      <h1 className="font-display text-8xl font-black text-[#2B2A4C] tracking-tight leading-none mb-3">
        404
      </h1>

      {/* Tagline */}
      <h2 className="font-display text-xl italic text-[#8B8A9B] mb-2">
        Looks like this trip got lost.
      </h2>
      
      {/* Subtext */}
      <p className="text-sm text-[#8B8A9B]/85 max-w-xs mb-8">
        The page you're looking for doesn't exist.
      </p>

      {/* Confused Panda Mascot Placeholder */}
      <div className="w-[160px] h-[170px] bg-white rounded-2xl border border-dashed border-[#D4CFC8] flex flex-col items-center justify-center p-4 mb-8 shadow-xs">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B8A9B] text-center leading-normal">
          Panda mascot here
        </span>
        <span className="text-[9px] text-[#8B8A9B]/70 mt-1 italic">
          — confused mood
        </span>
      </div>

      {/* Action Button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 rounded-full bg-[#2B2A4C] hover:bg-[#1f1e36] text-white px-6 py-3 text-sm font-bold transition-transform hover:scale-[1.02] shadow-sm decoration-none"
      >
        <ChevronLeft size={16} />
        Go back to your trips
      </Link>
    </div>
  );
}
