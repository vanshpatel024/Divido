import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import Logo from "./Logo";
import { useToast } from "./Toast";
import Button from "./Button";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
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
          showToast("Password updated successfully. Please log in with your new credentials.", "success");
          // Clear hash fragments to prevent accidental double-submits
          window.location.hash = "";
          navigate("/auth");
        } else {
          setGeneralError(responseData.message || "Failed to update password. Link may be expired.");
        }
      } catch (err: any) {
        setGeneralError("Network error. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const pandaMascotSvg = (
    <svg
      width="72"
      height="72"
      viewBox="0 0 64 64"
      className="text-[#2B2A4C]/30 select-none"
    >
      {/* Ears */}
      <circle cx="18" cy="18" r="8" fill="currentColor" />
      <circle cx="46" cy="18" r="8" fill="currentColor" />
      {/* Head */}
      <circle cx="32" cy="36" r="20" fill="#FFFFFF" stroke="currentColor" strokeWidth="2.5" />
      {/* Eyes patches */}
      <ellipse cx="24" cy="34" rx="5" ry="7" fill="currentColor" transform="rotate(-15 24 34)" />
      <ellipse cx="40" cy="34" rx="5" ry="7" fill="currentColor" transform="rotate(15 40 34)" />
      {/* Eyes pupils */}
      <circle cx="25" cy="33" r="1.5" fill="#FFFFFF" />
      <circle cx="39" cy="33" r="1.5" fill="#FFFFFF" />
      {/* Nose/mouth */}
      <polygon points="32,41 29,39 35,39" fill="currentColor" />
      <path d="M30,44 Q32,46 34,44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );

  if (isInvalid) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center p-6 font-sans select-none text-foreground">
        <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="w-[100px] h-[100px] bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={40} />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">Invalid Reset Link</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            This password reset link is invalid, incomplete, or has expired. Please request a new link from the login page.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="mt-6"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background flex flex-col md:flex-row overflow-hidden font-sans text-foreground">
      
      {/* LEFT COLUMN: Desktop Only (40% width) */}
      <div className="hidden md:flex md:w-[40%] bg-muted/20 flex-col items-center justify-center h-full p-8 border-r border-border">
        {/* Panda placeholder box */}
        <div className="w-[160px] h-[190px] bg-card border border-dashed border-border rounded-2xl flex flex-col items-center justify-center shadow-sm relative overflow-hidden mb-4">
          {pandaMascotSvg}
          <span className="text-[11px] text-muted-foreground font-semibold mt-3 tracking-wide uppercase select-none">
            New Credentials
          </span>
        </div>
        <p className="font-display italic text-muted-foreground text-sm text-center select-none">
          Securing your split transactions.
        </p>
      </div>

      {/* RIGHT COLUMN: Reset Form (60% width) */}
      <div className="w-full md:w-[60%] h-full flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-sm flex flex-col items-center">
          
          {/* Logo & Brand name */}
          <Logo className="mb-6" />

          <div className="w-full text-center mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Update Password</h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
              Enter your new secure password below to regain access.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {generalError && (
              <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl text-center">
                {generalError}
              </div>
            )}

            {/* Password Field */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
                New Password
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground z-10 pointer-events-none">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-background/50 py-2.5 pl-9 pr-9 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 text-foreground ${
                    passwordError ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-200 z-10"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-xs font-medium text-destructive leading-none">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground z-10 pointer-events-none">
                  <Lock size={16} />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border bg-background/50 py-2.5 pl-9 pr-9 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 text-foreground ${
                    confirmPasswordError ? "border-destructive focus:ring-destructive/20" : "border-border focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-200 z-10"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="mt-1 text-xs font-medium text-destructive leading-none">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="mt-2"
            >
              Update Password
            </Button>
          </form>

        </div>
      </div>

    </div>
  );
}
