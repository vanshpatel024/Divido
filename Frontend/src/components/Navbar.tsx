import { Link, useNavigate } from "react-router-dom";
import { Leaf, LogOut } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 border-b border-[#EFECE6] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity decoration-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <Leaf size={18} className="text-foreground" />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-foreground">
            Divido
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity decoration-none">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-foreground"
              style={{ backgroundColor: "#F7DCB9" }}
            >
              A
            </div>
            <span className="hidden text-sm font-medium text-foreground sm:inline">
              Aarav
            </span>
          </Link>
          <button
            onClick={() => navigate("/auth")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-[#EFECE6] hover:text-foreground cursor-pointer"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
