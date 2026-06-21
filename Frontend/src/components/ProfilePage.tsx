import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Mail, AtSign, ChevronLeft, KeyRound } from "lucide-react";
import Navbar from "./Navbar";
import { useToast } from "./Toast";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "./ConfirmDialog";

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
    if (!token) return;
    setIsResetting(true);
    try {
      const res = await fetch("http://localhost:3000/auth/reset-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      <Navbar />

      <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
        {/* Back Button */}
        <div className="flex items-center select-none">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8B8A9B] hover:text-[#2B2A4C] transition-colors decoration-none"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
            <span>Back to Trips</span>
          </Link>
        </div>
        
        {/* Profile Card */}
        <section className="bg-white border border-[#EFECE6] rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-[#AAD9BB] transition-all duration-200">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#F5F0E8]">
              <img
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || "")}&background=AAD9BB&color=000`}
                alt=""
                className="w-20 h-20 rounded-full border-2 border-white shadow-sm object-cover bg-[#F5F0E8]"
              />
              <div className="text-center sm:text-left flex-1">
                <h2 className="font-display text-2xl font-bold text-[#2B2A4C] leading-snug">
                  {user?.display_name || "Guest User"}
                </h2>
                <p className="text-sm text-[#8B8A9B] mt-1 flex items-center justify-center sm:justify-start gap-1 select-none">
                  <AtSign size={14} className="text-[#8bc79f]" />
                  <span>{user?.username || "username"}</span>
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8B8A9B] mb-2 select-none">
                  <Mail size={13} className="text-[#8B8A9B]" />
                  Email Address
                </label>
                <div className="w-full rounded-xl border border-[#EFECE6] bg-[#F9F7F4]/40 py-2.5 px-3.5 text-sm text-foreground/50 font-semibold select-none flex items-center">
                  <span>{user?.email || "—"}</span>
                  <span className="ml-auto text-[10px] uppercase font-bold text-[#8B8A9B]/60 tracking-wider">Account email</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reset Password Card */}
        <section className="bg-white border border-[#EFECE6] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#AAD9BB] transition-all duration-200">
          <div className="flex items-center gap-3 mb-2 select-none">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound size={16} />
            </div>
            <h3 className="font-display text-xl font-bold text-[#2B2A4C]">
              Reset Password
            </h3>
          </div>
          <p className="text-xs text-[#8B8A9B] mb-5 select-none pl-11">
            Request a secure link to reset your account password.
          </p>

          <div className="pl-11">
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-5 py-2.5 bg-[#2B2A4C] hover:bg-[#1f1e36] text-white rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer shadow-xs select-none"
            >
              Reset Password
            </button>
          </div>
        </section>

        {/* Danger Zone Card */}
        <section className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-200">
          <div className="flex items-center gap-3 mb-2 select-none">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
              <ShieldAlert size={16} />
            </div>
            <h3 className="font-display text-xl font-bold text-red-500">
              Danger Zone
            </h3>
          </div>
          <p className="text-xs text-[#8B8A9B] mb-5 select-none pl-11">
            Take caution with these irreversible actions.
          </p>

          <div className="pl-11">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-5 py-2.5 border border-red-500 hover:bg-red-50 text-red-500 rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer"
            >
              Delete Account
            </button>
          </div>
        </section>
      </main>

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
