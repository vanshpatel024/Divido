import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  Sun,
  Moon,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";
import AuthSidebar from "../components/layout/AuthSidebar";
import { useToast } from "../components/ui/Toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  // Form Fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Error States
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Parse Supabase auth redirect hash params
    const hash = window.location.hash;
    if (!hash) {
      setIsInvalid(true);
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const type = params.get("type");

    if (type === "recovery" && accessToken) {
      setToken(accessToken);
    } else {
      setIsInvalid(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    let hasError = false;

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Confirm your password");
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    } else {
      setConfirmPasswordError("");
    }

    if (!hasError && token) {
      setIsLoading(true);
      try {
        const res = await fetch("http://localhost:3000/auth/update-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        });

        const responseData = await res.json();
        if (res.ok && responseData.success) {
          showToast(
            "Password updated successfully. Please log in with your new credentials.",
            "success",
          );
          // Clear hash fragments to prevent accidental double-submits
          window.location.hash = "";
          navigate("/auth");
        } else {
          setGeneralError(
            responseData.message ||
              "Failed to update password. Link may be expired.",
          );
        }
      } catch (err: any) {
        setGeneralError("Network error. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 400, damping: 30 },
    },
  };

  if (isInvalid) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center p-6 font-sans text-foreground transition-colors duration-700">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card/85 backdrop-blur-xl border border-border/20 rounded-2xl p-8 max-w-[380px] w-full text-center shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">
            Invalid Reset Link
          </h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            This password reset link is invalid, incomplete, or has expired.
            Please request a new link from the login page.
          </p>
          <Button onClick={() => navigate("/auth")} className="mt-6 w-full">
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden font-sans bg-background text-foreground">
      {/* Noise Overlay */}
      <div className="pointer-events-none absolute inset-0 z-[100] opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;utf8,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>

      {/* MOBILE HEADER STRIP */}
      <div className="md:hidden w-full h-3 bg-gradient-to-r from-primary via-accent to-secondary opacity-60"></div>

      <AuthSidebar />

      {/* RIGHT COLUMN: Reset Form (60% width) */}
      <div className="w-full md:w-[60%] h-full flex flex-col items-center justify-start md:justify-center p-6 md:p-12 overflow-y-auto relative z-0 transition-colors duration-700 bg-background">
        {/* Top-Right Theme Toggle */}
        <div className="w-full flex justify-end mb-6 md:mb-0 md:absolute md:top-8 md:right-8 z-20">
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

        {/* Form Container Card */}
        <div className="w-full max-w-[380px] flex flex-col items-center p-0 md:p-10 md:rounded-2xl transition-all duration-700 md:bg-card/85 md:backdrop-blur-xl md:border md:border-border/20 md:shadow-xl dark:md:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <Logo variant="card" />

          <motion.form
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 w-full mt-6"
          >
            <motion.div
              variants={itemVariants}
              className="w-full text-center mb-2"
            >
              <h2 className="font-display text-lg font-bold text-foreground transition-colors duration-700">
                Update Password
              </h2>
              <p className="text-xs mt-1 text-muted-foreground transition-colors duration-700">
                Enter your new secure password below to regain access.
              </p>
            </motion.div>

            {generalError && (
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive transition-colors duration-300"
              >
                <AlertCircle size={15} className="shrink-0" />
                <span className="flex-1 leading-normal">{generalError}</span>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-700 text-muted-foreground">
                  NEW PASSWORD
                </label>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-primary text-secondary dark:text-accent">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border py-3 pl-10 pr-10 text-[13px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 bg-background/50 text-foreground ${
                    passwordError
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : "border-border focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer transition-colors duration-700 z-10 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-[11px] font-medium text-destructive leading-none">
                  {passwordError}
                </p>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-widest transition-colors duration-700 text-muted-foreground">
                  CONFIRM PASSWORD
                </label>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-primary text-secondary dark:text-accent">
                  <Lock size={16} />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border py-3 pl-10 pr-10 text-[13px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 bg-background/50 text-foreground ${
                    confirmPasswordError
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : "border-border focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer transition-colors duration-700 z-10 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="mt-1 text-[11px] font-medium text-destructive leading-none">
                  {confirmPasswordError}
                </p>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="mt-4">
              <Button
                type="submit"
                isLoading={isLoading}
                icon={<ArrowRight size={14} />}
                className="w-full"
              >
                Update Password
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-2 text-center">
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 bg-transparent border-none cursor-pointer"
              >
                Back to Login
              </button>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
