import { Link, useNavigate } from "react-router-dom";
import { Leaf, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.display_name || (user?.email ? user.email.split("@")[0] : "User");
  
  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };
  const initials = getInitials(displayName);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-[#EFECE6] bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity decoration-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <Leaf size={18} className="text-foreground" />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-foreground">
            Divido
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity decoration-none">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover shadow-sm border border-[#EFECE6]"
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-[#2B2A4C] shadow-sm border border-primary/20 bg-primary"
              >
                {initials}
              </div>
            )}
            <span className="hidden text-sm font-medium text-[#2B2A4C] sm:inline max-w-[120px] truncate">
              {displayName}
            </span>
          </Link>
          <button
            onClick={handleLogout}
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
