import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Error States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot Password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setEmailError("");

    if (!email) {
      setEmailError("Email is required");
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:3000/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const responseData = await res.json();
      if (res.ok && responseData.success) {
        setIsResetSuccess(true);
      } else {
        setGeneralError(responseData.message || "Failed to request password reset.");
      }
    } catch (err: any) {
      setGeneralError("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset errors when toggling tabs
  const handleTabToggle = (loginState: boolean) => {
    setIsLogin(loginState);
    setEmailError("");
    setPasswordError("");
    setFirstNameError("");
    setLastNameError("");
    setUsernameError("");
    setConfirmPasswordError("");
    setGeneralError("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    let hasError = false;

    if (!email) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email");
      hasError = true;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (!hasError) {
      setIsLoading(true);
      try {
        await login(email, password);
        navigate("/dashboard");
      } catch (err: any) {
        setGeneralError(err.message || "Invalid email or password");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    let hasError = false;

    if (!firstName.trim()) {
      setFirstNameError("First name is required");
      hasError = true;
    } else {
      setFirstNameError("");
    }

    if (!lastName.trim()) {
      setLastNameError("Last name is required");
      hasError = true;
    } else {
      setLastNameError("");
    }

    if (!username.trim()) {
      setUsernameError("Username is required");
      hasError = true;
    } else if (username.trim().length < 3) {
      setUsernameError("At least 3 characters");
      hasError = true;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setUsernameError("Letters, numbers, and underscores only");
      hasError = true;
    } else {
      setUsernameError("");
    }

    if (!email) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Enter a valid email");
      hasError = true;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Must be at least 6 characters");
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

    if (!hasError) {
      setIsLoading(true);
      try {
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        await signup(email, password, fullName, username.trim());
        navigate("/dashboard");
      } catch (err: any) {
        if (err.message === "Username is already taken") {
          setUsernameError(err.message);
        } else {
          setGeneralError(err.message || "Registration failed");
        }
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
      className="text-[#2B2A4C]/30 group-hover:scale-105 transition-transform duration-300 select-none"
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

  return (
    <div className="h-screen w-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* LEFT COLUMN: Desktop Only (40% width) */}
      <div className="hidden md:flex md:w-[40%] bg-[#F5F0E8] flex-col items-center justify-center h-full p-8 border-r border-[#EFECE6]">
        {/* Panda placeholder box (160x190px) */}
        <div className="w-[160px] h-[190px] bg-white border border-dashed border-[#D4CFC8] rounded-2xl flex flex-col items-center justify-center shadow-sm relative overflow-hidden group mb-4">
          {pandaMascotSvg}
          <span className="text-[11px] text-[#8B8A9B] font-semibold mt-3 tracking-wide uppercase select-none">
            Panda mascot here
          </span>
        </div>
        <p className="font-display italic text-[#8B8A9B] text-sm text-center select-none">
          Split trips, not friendships.
        </p>
      </div>

      {/* RIGHT COLUMN: Auth Form (60% width) */}
      <div className="w-full md:w-[60%] h-full flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-sm flex flex-col items-center">
          

          {/* Logo & Brand name */}
          <div className="flex items-center gap-2 mb-3 select-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-sm">
              <Leaf size={16} className="text-foreground" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              Divido
            </span>
          </div>

          {/* Toggle switcher pill */}
          {!isForgotPassword && (
            <div className="relative flex rounded-full bg-[#F5F0E8] p-1 w-full max-w-[240px] mb-5 border border-[#EFECE6]/50">
              <button
                type="button"
                onClick={() => handleTabToggle(true)}
                className={`relative z-10 w-1/2 rounded-full py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                  isLogin ? "text-white" : "text-[#8B8A9B] hover:bg-[#E8F5EE] hover:text-foreground"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleTabToggle(false)}
                className={`relative z-10 w-1/2 rounded-full py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                  !isLogin ? "text-white" : "text-[#8B8A9B] hover:bg-[#E8F5EE] hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
              
              {/* Sliding Pill Background */}
              <motion.div
                animate={{ x: isLogin ? "0%" : "100%" }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="absolute top-1 bottom-1 left-1 bg-[#2B2A4C] rounded-full"
                style={{ width: "calc(50% - 4px)" }}
              />
            </div>
          )}

          {/* Forms switcher */}
          <div className="w-full">
            <AnimatePresence mode="wait">
              {isForgotPassword ? (
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  onSubmit={handleForgotPasswordSubmit}
                  className="flex flex-col gap-3 w-full"
                >
                  <div className="w-full text-center mb-2">
                    <h2 className="font-display text-xl font-bold text-[#2B2A4C]">Reset Password</h2>
                    <p className="text-xs text-[#8B8A9B] mt-1.5 leading-normal">
                      We'll send a password recovery link to your inbox.
                    </p>
                  </div>

                  {generalError && (
                    <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl text-center">
                      {generalError}
                    </div>
                  )}

                  {isResetSuccess ? (
                    <div className="p-4 bg-[#eef7f1] border border-[#AAD9BB] rounded-2xl text-center space-y-3">
                      <p className="text-xs font-semibold text-[#1A5C3A] leading-relaxed">
                        A password recovery link has been sent to <strong>{email}</strong>. Please check your inbox.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setIsResetSuccess(false);
                          setEmail("");
                        }}
                        className="text-xs font-bold text-[#2B2A4C] hover:text-[#1f1e36] underline cursor-pointer bg-transparent border-none p-0"
                      >
                        Back to Login
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Email Field */}
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] select-none">
                          Email
                        </label>
                        <div className="relative mt-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B8A9B] z-10 pointer-events-none">
                            <Mail size={16} />
                          </span>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] ${
                              emailError ? "border-destructive focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]" : "border-[#EFECE6]"
                            }`}
                          />
                        </div>
                        {emailError && (
                          <p className="mt-1 text-xs font-medium text-destructive leading-none">
                            {emailError}
                          </p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#2B2A4C] text-white py-3.5 rounded-full font-semibold text-sm transition-all duration-200 hover:bg-[#1f1e36] cursor-pointer shadow-sm flex items-center justify-center disabled:opacity-80 mt-2"
                      >
                        {isLoading ? (
                          <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Send Reset Link"
                        )}
                      </button>

                      {/* Back to Login Link */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setGeneralError("");
                          setEmailError("");
                        }}
                        className="text-xs font-semibold text-[#8B8A9B] hover:text-[#2B2A4C] transition-colors duration-200 bg-transparent border-none cursor-pointer self-center animate-none"
                      >
                        <u>Back to Login</u>
                      </button>
                    </>
                  )}
                </motion.form>
              ) : isLogin ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  onSubmit={handleLoginSubmit}
                  className="flex flex-col gap-3 w-full"
                >
                  {generalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl text-center"
                    >
                      {generalError}
                    </motion.div>
                  )}
                  {/* Email Field */}
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] select-none">
                      Email
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B8A9B] z-10 pointer-events-none">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] ${
                          emailError ? "border-destructive focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]" : "border-[#EFECE6]"
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-xs font-medium text-destructive leading-none">
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] select-none">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setGeneralError("");
                          setEmailError("");
                        }}
                        className="text-xs font-semibold text-[#AAD9BB] hover:text-[#1A5C3A] hover:underline transition-colors duration-200 bg-transparent border-none cursor-pointer p-0 font-sans"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B8A9B] z-10 pointer-events-none">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] ${
                          passwordError ? "border-destructive focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]" : "border-[#EFECE6]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#8B8A9B] hover:text-[#2B2A4C] cursor-pointer transition-colors duration-200 z-10"
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#2B2A4C] text-white py-3.5 rounded-full font-semibold text-sm transition-all duration-200 hover:bg-[#1f1e36] cursor-pointer shadow-sm flex items-center justify-center disabled:opacity-80 mt-2"
                  >
                    {isLoading ? (
                      <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  onSubmit={handleSignupSubmit}
                  className="flex flex-col gap-3 w-full"
                >
                  {generalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl text-center"
                    >
                      {generalError}
                    </motion.div>
                  )}
                  {/* First Name & Last Name Fields */}
                  <div className="flex gap-3">
                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] select-none">
                        First Name
                      </label>
                      <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B8A9B] z-10 pointer-events-none">
                          <User size={16} />
                        </span>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Aarav"
                          className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] ${
                            firstNameError ? "border-destructive focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]" : "border-[#EFECE6]"
                          }`}
                        />
                      </div>
                      {firstNameError && (
                        <p className="mt-1 text-xs font-medium text-destructive leading-none">
                          {firstNameError}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col flex-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] select-none">
                        Last Name
                      </label>
                      <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B8A9B] z-10 pointer-events-none">
                          <User size={16} />
                        </span>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Shah"
                          className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] ${
                            lastNameError ? "border-destructive focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]" : "border-[#EFECE6]"
                          }`}
                        />
                      </div>
                      {lastNameError && (
                        <p className="mt-1 text-xs font-medium text-destructive leading-none">
                          {lastNameError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Username Field */}
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] select-none">
                      Username
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B8A9B] z-10 pointer-events-none">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="cool_panda"
                        className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] ${
                          usernameError ? "border-destructive focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]" : "border-[#EFECE6]"
                        }`}
                      />
                    </div>
                    {usernameError && (
                      <p className="mt-1 text-xs font-medium text-destructive leading-none">
                        {usernameError}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] select-none">
                      Email
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B8A9B] z-10 pointer-events-none">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] ${
                          emailError ? "border-destructive focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]" : "border-[#EFECE6]"
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-xs font-medium text-destructive leading-none">
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] select-none">
                      Password
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B8A9B] z-10 pointer-events-none">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] ${
                          passwordError ? "border-destructive focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]" : "border-[#EFECE6]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#8B8A9B] hover:text-[#2B2A4C] cursor-pointer transition-colors duration-200 z-10"
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
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] select-none">
                      Confirm Password
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B8A9B] z-10 pointer-events-none">
                        <Lock size={16} />
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full rounded-xl border bg-white py-2.5 pl-9 pr-9 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] ${
                          confirmPasswordError ? "border-destructive focus:shadow-[0_0_0_3px_rgba(239,68,68,0.25)]" : "border-[#EFECE6]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#8B8A9B] hover:text-[#2B2A4C] cursor-pointer transition-colors duration-200 z-10"
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#2B2A4C] text-white py-3.5 rounded-full font-semibold text-sm transition-all duration-200 hover:bg-[#1f1e36] cursor-pointer shadow-sm flex items-center justify-center disabled:opacity-80 mt-2"
                  >
                    {isLoading ? (
                      <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

    </div>
  );
}
