import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown, Moon, Sun } from "lucide-react";
import { useAuth, resolveAvatarUrl } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../ui/Logo";
import ConfirmDialog from "../ui/ConfirmDialog";
import NotificationsMenu from "../navigation/NotificationsMenu";
import InvitationsMenu from "../navigation/InvitationsMenu";
import { useRealtimeDashboard } from "../../hooks/useRealtimeDashboard";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Theme state
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Single shared WebSocket connection for all navbar subcomponents
  useRealtimeDashboard(token, user?.id, (type, payload) => {
    window.dispatchEvent(new CustomEvent('divido_dashboard_update', { detail: { type, payload } }));
  });

  const displayName =
    user?.display_name || (user?.email ? user.email.split("@")[0] : "User");

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .map((n) => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");

  const initials = getInitials(displayName);

  const handleLogout = () => {
    setIsMenuOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  const executeLogout = () => {
    setIsLogoutConfirmOpen(false);
    logout();
    navigate("/auth");
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMenuOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const avatarUrl = user?.avatar_url
    ? resolveAvatarUrl(user.avatar_url, user.id || displayName)
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4 gap-2">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="rounded-full hover:bg-muted transition-colors decoration-none shrink-0"
        >
          <Logo variant="navbar" className="py-1 pl-1 pr-3" />
        </Link>

        {/* Actions & Profile dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <InvitationsMenu />
          <NotificationsMenu />

          {/* Profile Dropdown Container */}
          <div className="relative" ref={menuRef}>
            <button
              id="navbar-profile-trigger"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-muted transition-colors cursor-pointer"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
            >
              {/* Avatar */}
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-brand-navy-text border border-border bg-primary">
                  {initials}
                </div>
              )}
              <span className="hidden text-sm font-medium text-brand-navy-text sm:inline max-w-[110px] truncate">
                {displayName}
              </span>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  key="navbar-dropdown"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] origin-top-right rounded-2xl border border-border bg-card shadow-xl overflow-hidden z-20"
                  role="menu"
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-border sm:hidden">
                    <p className="text-xs text-muted-foreground font-sans">Signed in as</p>
                    <p className="text-sm font-semibold text-brand-navy-text truncate mt-0.5">
                      {displayName}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5">
                    <Link
                      to="/profile"
                      id="navbar-profile-link"
                      onClick={() => setIsMenuOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-brand-navy-text hover:bg-muted transition-colors decoration-none"
                    >
                      <User size={15} className="text-muted-foreground" />
                      Profile
                    </Link>

                    {/* Theme Toggle */}
                    <button
                      id="navbar-theme-toggle"
                      onClick={toggleTheme}
                      role="menuitem"
                      className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-brand-navy-text hover:bg-muted transition-colors cursor-pointer mt-0.5"
                    >
                      {isDark ? (
                        <Sun size={15} className="text-muted-foreground" />
                      ) : (
                        <Moon size={15} className="text-muted-foreground" />
                      )}
                      {isDark ? "Light Mode" : "Dark Mode"}
                    </button>

                    <div className="h-px bg-border my-1 mx-1" />

                    <button
                      id="navbar-logout-btn"
                      onClick={handleLogout}
                      role="menuitem"
                      className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer mt-0.5"
                    >
                      <LogOut size={15} />
                      Log out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        title="Log out?"
        message={
          <>
            Are you sure you want to log out of <strong>Divido</strong>? You will be signed out of your current session.
          </>
        }
        confirmLabel="Log out"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={executeLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </header>
  );
}
