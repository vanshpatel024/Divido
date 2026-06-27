import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, Mail, AtSign, ChevronLeft, KeyRound } from "lucide-react";
import { useToast } from "./Toast";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "./ConfirmDialog";
import Button from "./Button";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
};

export default function ProfilePage() {
  const { showToast } = useToast();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Dialog and processing states
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleResetPassword = async () => {
    if (!token || !user?.email) return;
    setIsResetting(true);
    try {
      const res = await fetch("http://localhost:3000/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: user.email }),
      });

      const responseData = await res.json();
      if (responseData.success) {
        showToast("Password reset email sent successfully. Please check your inbox.", "success");
      } else {
        showToast(responseData.message || "Failed to send reset email", "error");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      showToast("Network error requesting password reset", "error");
    } finally {
      setIsResetting(false);
      setIsResetConfirmOpen(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      const res = await fetch("http://localhost:3000/auth/delete-account", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await res.json();
      if (responseData.success) {
        showToast("Account successfully deleted", "success");
        logout();
        navigate("/auth");
      } else {
        showToast(responseData.message || "Failed to delete account", "error");
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      showToast("Network error deleting account", "error");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (!user) return <ProfileSkeleton />;

  return (
    <div className="w-full font-sans transition-colors duration-300">

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-2xl px-6 py-10 space-y-6"
      >
        {/* Back Button */}
        <motion.div variants={itemVariants} className="flex items-center select-none">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors decoration-none"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
            <span>Back to Trips</span>
          </Link>
        </motion.div>
        
        {/* Profile Card */}
        <motion.section variants={itemVariants} className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-border transition-all duration-300">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/50">
              <img
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || "")}&background=AAD9BB&color=000`}
                alt=""
                className="w-20 h-20 rounded-full border border-border shadow-sm object-cover bg-muted"
              />
              <div className="text-center sm:text-left flex-1">
                <h2 className="font-display text-2xl font-bold text-foreground leading-snug">
                  {user?.display_name || "Guest User"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center sm:justify-start gap-1 select-none">
                  <AtSign size={14} className="text-muted-foreground" />
                  <span>{user?.username || "username"}</span>
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 select-none">
                  <Mail size={13} className="text-muted-foreground" />
                  Email Address
                </label>
                <div className="w-full rounded-xl border border-border bg-muted/20 py-2.5 px-3.5 text-sm text-foreground/70 font-medium select-none flex items-center">
                  <span>{user?.email || "—"}</span>
                  <span className="ml-auto text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Account email</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Reset Password Card */}
        <motion.section variants={itemVariants} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-border transition-all duration-300">
          <div className="flex items-center gap-3 mb-2 select-none">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
              <KeyRound size={16} />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">
              Reset Password
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5 select-none pl-11">
            Request a secure link to reset your account password.
          </p>

          <div className="pl-11">
            <Button
              onClick={() => setIsResetConfirmOpen(true)}
              variant="premium"
              shape="pill"
              size="md"
              className="w-auto px-6"
            >
              Reset Password
            </Button>
          </div>
        </motion.section>

        {/* Danger Zone Card */}
        <motion.section variants={itemVariants} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-destructive/40 transition-all duration-300">
          <div className="flex items-center gap-3 mb-2 select-none">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert size={16} />
            </div>
            <h3 className="font-display text-xl font-bold text-destructive">
              Danger Zone
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5 select-none pl-11">
            Take caution with these irreversible actions.
          </p>

          <div className="pl-11">
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              variant="danger-outline"
              shape="pill"
              size="md"
              className="w-auto"
            >
              Delete Account
            </Button>
          </div>
        </motion.section>
      </motion.main>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset password?"
        message={
          <>
            Are you sure you want to send a password reset link to <strong>{user?.email}</strong>? You will receive an email to update your credentials.
          </>
        }
        confirmLabel="Send reset link"
        cancelLabel="Cancel"
        variant="primary"
        isLoading={isResetting}
        onConfirm={handleResetPassword}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Delete Account?"
        message={
          <>
            Are you sure you want to delete your account? <strong>This action cannot be undone</strong> and all your trips and personal data will be permanently deleted.
          </>
        }
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="w-full font-sans relative">
      <div className="fixed inset-0 backdrop-blur-md bg-background/50 z-[-5] pointer-events-none transition-all duration-500" />
      <div className="mx-auto max-w-2xl px-6 py-10 space-y-6 select-none">
        {/* Back Button Skeleton */}
        <div className="h-4 w-32 bg-muted rounded-md skeleton-shimmer mb-6" />

        {/* Profile Card Skeleton */}
        <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/50">
              <div className="h-24 w-24 rounded-full bg-muted skeleton-shimmer shrink-0" />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-3 w-full">
                <div className="h-8 w-48 bg-muted rounded-xl skeleton-shimmer" />
                <div className="h-4 w-32 bg-muted rounded-md skeleton-shimmer" />
              </div>
            </div>
            <div className="space-y-4 pt-2">
              <div>
                <div className="h-3 w-16 bg-muted rounded-md mb-2 skeleton-shimmer" />
                <div className="h-10 w-full max-w-sm bg-muted rounded-lg skeleton-shimmer" />
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <div className="h-9 w-28 bg-muted rounded-full skeleton-shimmer" />
            </div>
          </div>
        </section>

        {/* Reset Password Card Skeleton */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-muted skeleton-shimmer shrink-0" />
            <div className="h-6 w-40 bg-muted rounded-xl skeleton-shimmer" />
          </div>
          <div className="h-3 w-64 bg-muted rounded-md mb-6 ml-11 skeleton-shimmer" />
          <div className="pl-11">
            <div className="h-9 w-36 bg-muted rounded-full skeleton-shimmer" />
          </div>
        </section>

        {/* Danger Zone Card Skeleton */}
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-muted skeleton-shimmer shrink-0" />
            <div className="h-6 w-32 bg-muted rounded-xl skeleton-shimmer" />
          </div>
          <div className="h-3 w-56 bg-muted rounded-md mb-6 ml-11 skeleton-shimmer" />
          <div className="pl-11">
            <div className="h-9 w-36 bg-muted rounded-full skeleton-shimmer" />
          </div>
        </section>
      </div>
    </div>
  );
}
