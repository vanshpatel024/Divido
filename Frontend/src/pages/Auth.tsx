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
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";
import AuthSidebar from "../components/layout/AuthSidebar";

export default function Auth() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Theme State
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

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
    } else if (firstName.trim().length > 20) {
      setFirstNameError("Max 20 characters");
      hasError = true;
    } else {
      setFirstNameError("");
    }

    if (!lastName.trim()) {
      setLastNameError("Last name is required");
      hasError = true;
    } else if (lastName.trim().length > 20) {
      setLastNameError("Max 20 characters");
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
    } else if (username.trim().length > 25) {
      setUsernameError("Max 25 characters");
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
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden font-sans bg-background text-foreground">
      {/* Noise Overlay */}
      <div className="pointer-events-none absolute inset-0 z-[100] opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;utf8,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>
      
      {/* MOBILE HEADER STRIP */}
      <div className="md:hidden w-full h-3 bg-gradient-to-r from-primary via-accent to-secondary opacity-60"></div>

      <AuthSidebar />

      {/* RIGHT COLUMN: Auth Form (60% width) */}
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
          
          {/* Logo & Brand name */}
          <Logo variant="card" />

          {/* Toggle switcher pill */}
          {!isForgotPassword && (
            <div className="relative flex rounded-full p-1 w-full mb-6 border border-border bg-background transition-colors duration-700">
              <button
                type="button"
                onClick={() => handleTabToggle(true)}
                className={`relative z-10 w-1/2 rounded-full py-2 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                  isLogin ? "text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleTabToggle(false)}
                className={`relative z-10 w-1/2 rounded-full py-2 text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                  !isLogin ? "text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
              
              {/* Sliding Pill Background */}
              <motion.div
                animate={{ x: isLogin ? "0%" : "100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute top-1 bottom-1 left-1 bg-gradient-to-br from-accent to-destructive rounded-full shadow-sm"
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
                    <h2 className="font-display text-lg font-bold text-foreground transition-colors duration-700">Reset Password</h2>
                    <p className="text-xs mt-1 text-muted-foreground transition-colors duration-700">
                      We'll send a password recovery link to your inbox.
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

                  {isResetSuccess ? (
                    <motion.div variants={itemVariants} className={`p-4 border rounded-xl text-center space-y-3 transition-colors duration-700 bg-background/50 border-border`}>
                      <p className="text-xs font-medium leading-relaxed text-foreground">
                        A password recovery link has been sent to <strong>{email}</strong>. Please check your inbox.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setIsResetSuccess(false);
                          setEmail("");
                        }}
                        className="text-xs font-semibold underline cursor-pointer bg-transparent border-none p-0 transition-colors duration-700 text-foreground hover:text-primary"
                      >
                        Back to Login
                      </button>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div variants={itemVariants} className="flex flex-col">
                        <label className="text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 text-muted-foreground">
                          EMAIL
                        </label>
                        <div className="relative group">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-primary text-secondary dark:text-accent">
                            <Mail size={16} />
                          </span>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 bg-background/50 text-foreground ${
                              emailError 
                                ? "border-destructive focus:border-destructive focus:ring-destructive/20" 
                                : "border-border focus:border-primary"
                            }`}
                          />
                        </div>
                        {emailError && (
                          <p className="mt-1 text-[11px] font-medium text-destructive leading-none">
                            {emailError}
                          </p>
                        )}
                      </motion.div>

                       <motion.div variants={itemVariants}>
                         <Button
                            type="submit"
                            isLoading={isLoading}
                            icon={<ArrowRight size={14} />}
                            className="mt-1"
                          >
                            Send Reset Link
                          </Button>
                       </motion.div>

                      <motion.button
                        variants={itemVariants}
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setGeneralError("");
                          setEmailError("");
                        }}
                        className="text-[13px] font-medium transition-colors duration-200 bg-transparent border-none cursor-pointer self-center mt-2 text-muted-foreground hover:text-foreground"
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
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive transition-colors duration-300"
                    >
                      <AlertCircle size={15} className="shrink-0" />
                      <span className="flex-1 leading-normal">{generalError}</span>
                    </motion.div>
                  )}
                  
                  <motion.div variants={itemVariants} className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 text-muted-foreground">
                      EMAIL
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-primary text-secondary dark:text-accent">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 bg-background/50 text-foreground ${
                          emailError 
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20" 
                            : "border-border focus:border-primary"
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-[11px] font-medium text-destructive leading-none">
                        {emailError}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest select-none transition-colors duration-700 text-muted-foreground">
                        PASSWORD
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
                  
                  <motion.div variants={itemVariants} className="flex justify-end mt-[-2px]">
                     <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setGeneralError("");
                          setEmailError("");
                        }}
                        className="text-[12px] font-medium text-accent hover:text-destructive hover:underline transition-colors duration-200 bg-transparent border-none cursor-pointer p-0 font-sans"
                      >
                        Forgot password?
                      </button>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      isLoading={isLoading}
                      icon={<ArrowRight size={14} />}
                      className="mt-1"
                    >
                      Log In
                    </Button>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="mt-4 flex flex-col items-center">
                    <div className="flex items-center w-full mb-4 opacity-60">
                       <div className="flex-1 h-[1px] transition-colors duration-700 bg-border"></div>
                       <span className="px-3 text-[10px] uppercase tracking-wider font-semibold transition-colors duration-700 text-muted-foreground">or continue with</span>
                       <div className="flex-1 h-[1px] transition-colors duration-700 bg-border"></div>
                    </div>
                    
                    <div className="w-full">
                       <Button
                         type="button"
                         variant="secondary"
                         icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
                         iconPosition="left"
                       >
                         Google
                       </Button>
                    </div>
                  </motion.div>
                  
                  <motion.p variants={itemVariants} className="text-center text-[10px] mt-4 leading-relaxed transition-colors duration-700 text-muted-foreground">
                    By continuing, you agree to our <span className="text-accent cursor-pointer hover:underline transition-colors">Terms</span> and <span className="text-accent cursor-pointer hover:underline transition-colors">Privacy Policy</span>.
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
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive transition-colors duration-300"
                    >
                      <AlertCircle size={15} className="shrink-0" />
                      <span className="flex-1 leading-normal">{generalError}</span>
                    </motion.div>
                  )}
                  <div className="flex gap-3">
                    <motion.div variants={itemVariants} className="flex flex-col flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 text-muted-foreground">
                        FIRST NAME
                      </label>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-primary text-secondary dark:text-accent">
                          <User size={16} />
                        </span>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Aarav"
                          className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 bg-background/50 text-foreground ${
                            firstNameError 
                              ? "border-destructive focus:border-destructive focus:ring-destructive/20" 
                              : "border-border focus:border-primary"
                          }`}
                        />
                      </div>
                      {firstNameError && (
                        <p className="mt-1 text-[11px] font-medium text-destructive leading-none">
                          {firstNameError}
                        </p>
                      )}
                    </motion.div>

                    <motion.div variants={itemVariants} className="flex flex-col flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 text-muted-foreground">
                        LAST NAME
                      </label>
                      <div className="relative group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-primary text-secondary dark:text-accent">
                          <User size={16} />
                        </span>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Shah"
                          className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 bg-background/50 text-foreground ${
                            lastNameError 
                              ? "border-destructive focus:border-destructive focus:ring-destructive/20" 
                              : "border-border focus:border-primary"
                          }`}
                        />
                      </div>
                      {lastNameError && (
                        <p className="mt-1 text-[11px] font-medium text-destructive leading-none">
                          {lastNameError}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  <motion.div variants={itemVariants} className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 text-muted-foreground">
                      USERNAME
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-primary text-secondary dark:text-accent">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="cool_panda"
                        className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 bg-background/50 text-foreground ${
                          usernameError 
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20" 
                            : "border-border focus:border-primary"
                        }`}
                      />
                    </div>
                    {usernameError && (
                      <p className="mt-1 text-[11px] font-medium text-destructive leading-none">
                        {usernameError}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 text-muted-foreground">
                      EMAIL
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 z-10 pointer-events-none transition-colors duration-700 group-focus-within:text-primary text-secondary dark:text-accent">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={`w-full rounded-lg border py-3 pl-10 pr-4 text-[13px] outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 bg-background/50 text-foreground ${
                          emailError 
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20" 
                            : "border-border focus:border-primary"
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1 text-[11px] font-medium text-destructive leading-none">
                        {emailError}
                      </p>
                    )}
                  </motion.div>

                  <div className="flex gap-3">
                    <motion.div variants={itemVariants} className="flex flex-col flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 text-muted-foreground">
                        PASSWORD
                      </label>
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
                    
                    <motion.div variants={itemVariants} className="flex flex-col flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest mb-1 select-none transition-colors duration-700 text-muted-foreground">
                        CONFIRM
                      </label>
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
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPasswordError && (
                        <p className="mt-1 text-[11px] font-medium text-destructive leading-none">
                          {confirmPasswordError}
                        </p>
                      )}
                    </motion.div>
                  </div>

                   <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      isLoading={isLoading}
                      icon={<ArrowRight size={14} />}
                      className="mt-4"
                    >
                      Create Account
                    </Button>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

    </div>
  );
}
