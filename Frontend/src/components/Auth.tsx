import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

export default function Auth() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Carousel State
  const carouselTexts = [
    { title: "Plan together.\nPay together.", subtitle: "Split trip expenses with friends. Track balances, settle up, and keep your journeys stress-free." },
    { title: "Track every expense\neffortlessly.", subtitle: "No more spreadsheets. Just add the cost, tag your friends, and we'll do the math." },
    { title: "Settle up with\na single tap.", subtitle: "Send reminders, view balances, and pay each other back directly through the app." }
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);

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



  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    },
    exit: { opacity: 0, transition: { duration: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
  };

  return (
    <div className={`h-screen w-screen flex flex-col md:flex-row overflow-hidden font-sans ${isDark ? 'bg-[#13161D]' : 'bg-[#FAF6F1]'}`}>
      {/* Noise Overlay */}
      <div className="pointer-events-none absolute inset-0 z-[100] opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;utf8,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>
      
      {/* MOBILE HEADER STRIP */}
      <div className={`md:hidden w-full h-3 ${isDark ? 'bg-gradient-to-r from-[#58A6FF] to-[#FF6B6B] opacity-50' : 'bg-gradient-to-r from-[#58A6FF] via-[#FF6B6B] to-[#FFEDD5]'}`}></div>

      {/* LEFT COLUMN: Desktop Only (40% width) */}
      <div className="hidden md:flex md:w-[40%] relative flex-col justify-between h-full p-12 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0 transition-colors duration-700">
          {isDark ? (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0B0E14] via-[#151926] to-[#1C1420]">
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#58A6FF] opacity-[0.04] blur-[80px] mix-blend-screen"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF6B6B] opacity-[0.03] blur-[80px] mix-blend-screen"></div>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                {randomLines.map((path, idx) => (
                  <path key={idx} d={path} fill="none" stroke={idx % 2 === 0 ? "#58A6FF" : "#FF6B6B"} strokeWidth="0.15" opacity="0.08" />
                ))}
              </svg>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#71B2FF] via-[#FF8080] to-[#FFE2C2]">
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white opacity-20 blur-3xl mix-blend-overlay"></div>
              <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-white opacity-20 blur-3xl mix-blend-overlay"></div>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                {randomLines.map((path, idx) => (
                  <path key={idx} d={path} fill="none" stroke="#FFFFFF" strokeWidth="0.15" opacity="0.25" />
                ))}
              </svg>
            </div>
          )}
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
                onClick={handlePrevSlide}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ArrowRight size={14} className="rotate-180" />
              </button>
              <button 
                onClick={handleNextSlide}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Form (60% width) */}
      <div className={`w-full md:w-[60%] h-full flex flex-col items-center justify-start md:justify-center p-6 md:p-12 overflow-y-auto relative z-0 transition-colors duration-700 ${isDark ? "bg-gradient-to-br from-[#101217] via-[#161921] to-[#1C1618]" : "bg-gradient-to-br from-[#FAF6F1] via-[#FFFFFF] to-[#FFF0ED]"}`}>
        
        {/* Top-Right Theme Toggle */}
        <div className="w-full flex justify-end mb-6 md:mb-0 md:absolute md:top-8 md:right-8 z-20">
           <button
              type="button"
              onClick={toggleTheme}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full border shadow-sm transition-all duration-300 cursor-pointer overflow-hidden ${isDark ? 'bg-[#1C2030] hover:bg-[#252A3A] border-[#2A2F42] text-[#58A6FF] hover:shadow-white/5' : 'bg-[#FFFFFF] hover:bg-[#FAF6F1] border-[#E8DDD3] text-[#FF6B6B] hover:shadow-black/5'}`}
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
        <div className={`w-full max-w-[380px] flex flex-col items-center p-0 md:p-10 md:rounded-2xl transition-all duration-700 ${isDark ? "md:bg-[#1A1E2E]/80 md:backdrop-blur-xl md:border md:border-white/5 md:shadow-[0_8px_32px_rgba(0,0,0,0.4)]" : "md:bg-[#FFFFFF]/90 md:backdrop-blur-xl md:border md:border-black/5 md:shadow-[0_4px_24px_rgba(255,107,107,0.06),0_2px_8px_rgba(0,0,0,0.02)]"}`}>
          
          {/* Logo & Brand name */}
          <Logo variant="card" isDark={isDark} />

          {/* Toggle switcher pill */}
          {!isForgotPassword && (
            <div className={`relative flex rounded-full p-1 w-full mb-6 border transition-colors duration-700 ${isDark ? 'bg-[#13161D] border-[#2A2F42]' : 'bg-[#FAF6F1] border-[#E8DDD3]'}`}>
              <button
                type="button"
                onClick={() => handleTabToggle(true)}
                className={`relative z-10 w-1/2 rounded-full py-2 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                  isLogin ? "text-white" : isDark ? "text-[#8B93A8] hover:text-white" : "text-[#8B93A8] hover:text-[#13161D]"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleTabToggle(false)}
                className={`relative z-10 w-1/2 rounded-full py-2 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                  !isLogin ? "text-white" : isDark ? "text-[#8B93A8] hover:text-white" : "text-[#8B93A8] hover:text-[#13161D]"
                }`}
              >
                Sign Up
              </button>
              
              {/* Sliding Pill Background */}
              <motion.div
                animate={{ x: isLogin ? "0%" : "100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute top-1 bottom-1 left-1 bg-gradient-to-br from-[#FF6B6B] to-[#FF4D4D] rounded-full shadow-sm"
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
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  onSubmit={handleForgotPasswordSubmit}
                  className="flex flex-col gap-3 w-full"
                >
                  <motion.div variants={itemVariants} className="w-full text-center mb-1">
                    <h2 className={`font-display text-lg font-bold transition-colors duration-700 ${isDark ? 'text-white' : 'text-[#13161D]'}`}>Reset Password</h2>
                    <p className={`text-xs mt-1 transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
                      We'll send a password recovery link to your inbox.
                    </p>
                  </motion.div>

                  {generalError && (
                    <motion.div variants={itemVariants} className="p-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#FF4D4D] rounded-lg text-center">
                      {generalError}
                    </motion.div>
                  )}

                  {isResetSuccess ? (
                    <motion.div variants={itemVariants} className={`p-4 border rounded-xl text-center space-y-3 transition-colors duration-700 ${isDark ? 'bg-[#13161D]/50 border-[#10B981]/20' : 'bg-[#D1FAE5]/30 border-[#10B981]/30'}`}>
                      <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-[#10B981]' : 'text-[#10B981]'}`}>
                        A password recovery link has been sent to <strong>{email}</strong>. Please check your inbox.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setIsResetSuccess(false);
                          setEmail("");
                        }}
                        className={`text-xs font-semibold underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-700 ${isDark ? 'text-white hover:text-[#58A6FF]' : 'text-[#13161D] hover:text-[#58A6FF]'}`}
                      >
                        Back to Login
                      </button>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div variants={itemVariants} className="flex flex-col">
                        <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
                          EMAIL
                        </label>
                        <div className="relative group">
                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-[#58A6FF] ${isDark ? 'text-[#FF6B6B]' : 'text-[#FFB3A7]'}`}>
                            <Mail size={16} />
                          </span>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:border-[#58A6FF] focus:shadow-[0_0_0_3px_rgba(88,166,255,0.15)] ${
                              isDark 
                                ? `bg-[#13161D] text-white ${emailError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#2A2F42]"}`
                                : `bg-white/80 text-[#13161D] ${emailError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#E8DDD3]"}`
                            }`}
                          />
                        </div>
                        {emailError && (
                          <p className="mt-1 text-[11px] font-medium text-[#FF4D4D] leading-none">
                            {emailError}
                          </p>
                        )}
                      </motion.div>

                      <motion.button
                        variants={itemVariants}
                        type="submit"
                        disabled={isLoading}
                        whileTap={{ scale: 0.98 }}
                        className="btn-premium w-full text-white h-[44px] rounded-full font-semibold text-[13px] cursor-pointer flex items-center justify-center disabled:opacity-80 mt-1"
                      >
                        {isLoading ? (
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span className="flex items-center gap-1.5">Send Reset Link <ArrowRight size={14} /></span>
                        )}
                      </motion.button>

                      <motion.button
                        variants={itemVariants}
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setGeneralError("");
                          setEmailError("");
                        }}
                        className={`text-[13px] font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer self-center mt-2 ${isDark ? 'text-[#8B93A8] hover:text-white' : 'text-[#8B93A8] hover:text-[#13161D]'}`}
                      >
                        <u>Back to Login</u>
                      </motion.button>
                    </>
                  )}
                </motion.form>
              ) : isLogin ? (
                <motion.form
                  key="login"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  onSubmit={handleLoginSubmit}
                  className="flex flex-col gap-3 w-full"
                >
                  {generalError && (
                    <motion.div variants={itemVariants} className="p-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#FF4D4D] rounded-lg text-center">
                      {generalError}
                    </motion.div>
                  )}
                  
                  <motion.div variants={itemVariants} className="flex flex-col">
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
                      EMAIL
                    </label>
                    <div className="relative group">
                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-[#58A6FF] ${isDark ? 'text-[#FF6B6B]' : 'text-[#FFB3A7]'}`}>
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:border-[#58A6FF] focus:shadow-[0_0_0_3px_rgba(88,166,255,0.15)] ${
                          isDark 
                            ? `bg-[#13161D] text-white ${emailError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#2A2F42]"}`
                            : `bg-white/80 text-[#13161D] ${emailError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#E8DDD3]"}`
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-[11px] font-medium text-[#FF4D4D] leading-none">
                        {emailError}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest select-none transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
                        PASSWORD
                      </label>
                    </div>
                    <div className="relative group">
                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-[#58A6FF] ${isDark ? 'text-[#FF6B6B]' : 'text-[#FFB3A7]'}`}>
                        <Lock size={16} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full rounded-lg border py-3 pl-10 pr-10 text-[13px] outline-none transition-all duration-300 focus:border-[#58A6FF] focus:shadow-[0_0_0_3px_rgba(88,166,255,0.15)] ${
                          isDark 
                            ? `bg-[#13161D] text-white ${passwordError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#2A2F42]"}`
                            : `bg-white/80 text-[#13161D] ${passwordError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#E8DDD3]"}`
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer transition-colors duration-700 z-10 ${isDark ? 'text-[#8B93A8] hover:text-white' : 'text-[#8B93A8] hover:text-[#13161D]'}`}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="mt-1 text-[11px] font-medium text-[#FF4D4D] leading-none">
                        {passwordError}
                      </p>
                    )}
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="flex justify-end mt-[-2px]">
                     <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setGeneralError("");
                          setEmailError("");
                        }}
                        className="text-[12px] font-medium text-[#FF6B6B] hover:text-[#FF4D4D] hover:underline transition-colors duration-200 bg-transparent border-none cursor-pointer p-0 font-sans"
                      >
                        Forgot password?
                      </button>
                  </motion.div>

                  <motion.button
                    variants={itemVariants}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="btn-premium w-full text-white h-[44px] rounded-full font-semibold text-[13px] cursor-pointer flex items-center justify-center disabled:opacity-80 mt-1"
                  >
                    {isLoading ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="flex items-center gap-1.5">Log In <ArrowRight size={14} /></span>
                    )}
                  </motion.button>
                  
                  <motion.div variants={itemVariants} className="mt-4 flex flex-col items-center">
                    <div className="flex items-center w-full mb-4 opacity-60">
                       <div className={`flex-1 h-[1px] transition-colors duration-700 ${isDark ? 'bg-[#2A2F42]' : 'bg-[#E8DDD3]'}`}></div>
                       <span className={`px-3 text-[10px] uppercase tracking-wider font-semibold transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>or continue with</span>
                       <div className={`flex-1 h-[1px] transition-colors duration-700 ${isDark ? 'bg-[#2A2F42]' : 'bg-[#E8DDD3]'}`}></div>
                    </div>
                    
                    <div className="w-full">
                       <button type="button" className={`btn-secondary-premium w-full h-[40px] rounded-lg border flex items-center justify-center gap-2 cursor-pointer ${isDark ? 'bg-[#13161D] border-[#2A2F42] text-white' : 'bg-white/80 border-[#E8DDD3] text-[#13161D]'}`}>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                          <span className="text-[13px] font-semibold">Google</span>
                       </button>
                    </div>
                  </motion.div>
                  
                  <motion.p variants={itemVariants} className={`text-center text-[10px] mt-4 leading-relaxed transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
                    By continuing, you agree to our <span className="text-[#FF6B6B] cursor-pointer hover:underline transition-colors">Terms</span> and <span className="text-[#FF6B6B] cursor-pointer hover:underline transition-colors">Privacy Policy</span>.
                  </motion.p>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  onSubmit={handleSignupSubmit}
                  className="flex flex-col gap-3 w-full"
                >
                  {generalError && (
                    <motion.div variants={itemVariants} className="p-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#FF4D4D] rounded-lg text-center">
                      {generalError}
                    </motion.div>
                  )}
                  <div className="flex gap-3">
                    <motion.div variants={itemVariants} className="flex flex-col flex-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
                        FIRST NAME
                      </label>
                      <div className="relative group">
                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-[#58A6FF] ${isDark ? 'text-[#FF6B6B]' : 'text-[#FFB3A7]'}`}>
                          <User size={16} />
                        </span>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Aarav"
                          className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:border-[#58A6FF] focus:shadow-[0_0_0_3px_rgba(88,166,255,0.15)] ${
                            isDark 
                              ? `bg-[#13161D] text-white ${firstNameError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#2A2F42]"}`
                              : `bg-white/80 text-[#13161D] ${firstNameError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#E8DDD3]"}`
                          }`}
                        />
                      </div>
                      {firstNameError && (
                        <p className="mt-1 text-[11px] font-medium text-[#FF4D4D] leading-none">
                          {firstNameError}
                        </p>
                      )}
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex flex-col flex-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
                        LAST NAME
                      </label>
                      <div className="relative group">
                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-[#58A6FF] ${isDark ? 'text-[#FF6B6B]' : 'text-[#FFB3A7]'}`}>
                          <User size={16} />
                        </span>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Shah"
                          className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:border-[#58A6FF] focus:shadow-[0_0_0_3px_rgba(88,166,255,0.15)] ${
                            isDark 
                              ? `bg-[#13161D] text-white ${lastNameError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#2A2F42]"}`
                              : `bg-white/80 text-[#13161D] ${lastNameError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#E8DDD3]"}`
                          }`}
                        />
                      </div>
                      {lastNameError && (
                        <p className="mt-1 text-[11px] font-medium text-[#FF4D4D] leading-none">
                          {lastNameError}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  <motion.div variants={itemVariants} className="flex flex-col">
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
                      USERNAME
                    </label>
                    <div className="relative group">
                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-[#58A6FF] ${isDark ? 'text-[#FF6B6B]' : 'text-[#FFB3A7]'}`}>
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="cool_panda"
                        className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:border-[#58A6FF] focus:shadow-[0_0_0_3px_rgba(88,166,255,0.15)] ${
                          isDark 
                            ? `bg-[#13161D] text-white ${usernameError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#2A2F42]"}`
                            : `bg-white/80 text-[#13161D] ${usernameError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#E8DDD3]"}`
                        }`}
                      />
                    </div>
                    {usernameError && (
                      <p className="mt-1 text-[11px] font-medium text-[#FF4D4D] leading-none">
                        {usernameError}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex flex-col">
                    <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
                      EMAIL
                    </label>
                    <div className="relative group">
                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-[#58A6FF] ${isDark ? 'text-[#FF6B6B]' : 'text-[#FFB3A7]'}`}>
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:border-[#58A6FF] focus:shadow-[0_0_0_3px_rgba(88,166,255,0.15)] ${
                          isDark 
                            ? `bg-[#13161D] text-white ${emailError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#2A2F42]"}`
                            : `bg-white/80 text-[#13161D] ${emailError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#E8DDD3]"}`
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-[11px] font-medium text-[#FF4D4D] leading-none">
                        {emailError}
                      </p>
                    )}
                  </motion.div>

                  <div className="flex gap-3">
                    <motion.div variants={itemVariants} className="flex flex-col flex-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
                        PASSWORD
                      </label>
                      <div className="relative group">
                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-[#58A6FF] ${isDark ? 'text-[#FF6B6B]' : 'text-[#FFB3A7]'}`}>
                          <Lock size={16} />
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full rounded-lg border py-3 pl-10 pr-10 text-[13px] outline-none transition-all duration-300 focus:border-[#58A6FF] focus:shadow-[0_0_0_3px_rgba(88,166,255,0.15)] ${
                            isDark 
                              ? `bg-[#13161D] text-white ${passwordError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#2A2F42]"}`
                              : `bg-white/80 text-[#13161D] ${passwordError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#E8DDD3]"}`
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer transition-colors duration-700 z-10 ${isDark ? 'text-[#8B93A8] hover:text-white' : 'text-[#8B93A8] hover:text-[#13161D]'}`}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {passwordError && (
                        <p className="mt-1 text-[11px] font-medium text-[#FF4D4D] leading-none">
                          {passwordError}
                        </p>
                      )}
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="flex flex-col flex-1">
                      <label className={`text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 ${isDark ? 'text-[#8B93A8]' : 'text-[#8B93A8]'}`}>
                        CONFIRM
                      </label>
                      <div className="relative group">
                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-[#58A6FF] ${isDark ? 'text-[#FF6B6B]' : 'text-[#FFB3A7]'}`}>
                          <Lock size={16} />
                        </span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full rounded-lg border py-3 pl-10 pr-10 text-[13px] outline-none transition-all duration-300 focus:border-[#58A6FF] focus:shadow-[0_0_0_3px_rgba(88,166,255,0.15)] ${
                            isDark 
                              ? `bg-[#13161D] text-white ${confirmPasswordError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#2A2F42]"}`
                              : `bg-white/80 text-[#13161D] ${confirmPasswordError ? "border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "border-[#E8DDD3]"}`
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className={`absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer transition-colors duration-700 z-10 ${isDark ? 'text-[#8B93A8] hover:text-white' : 'text-[#8B93A8] hover:text-[#13161D]'}`}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPasswordError && (
                        <p className="mt-1 text-[11px] font-medium text-[#FF4D4D] leading-none">
                          {confirmPasswordError}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  <motion.button
                    variants={itemVariants}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="btn-premium w-full text-white h-[44px] rounded-full font-semibold text-[13px] cursor-pointer flex items-center justify-center disabled:opacity-80 mt-4"
                  >
                    {isLoading ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="flex items-center gap-1.5">Create Account <ArrowRight size={14} /></span>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

    </div>
  );
}
