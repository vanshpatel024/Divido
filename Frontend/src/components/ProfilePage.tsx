import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, User, Mail, AtSign, ChevronLeft } from "lucide-react";
import Navbar from "./Navbar";
import { useToast } from "./Toast";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { showToast } = useToast();
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Profile states
  const [name, setName] = useState("");
  const [tempName, setTempName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Delete account confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Sync profile state with auth context user details
  useEffect(() => {
    if (user) {
      setName(user.display_name || "");
      setTempName(user.display_name || "");
    }
  }, [user]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }
    if (!token) return;

    try {
      const res = await fetch("http://localhost:3000/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: tempName }),
      });

      const responseData = await res.json();
      if (responseData.success) {
        // Update local context
        updateUser({ display_name: tempName });
        setIsEditing(false);
        showToast("Profile updated successfully", "success");
      } else {
        showToast(responseData.message || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast("Network error updating profile", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
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
                  {name || "Guest User"}
                </h2>
                <p className="text-sm text-[#8B8A9B] mt-1 flex items-center justify-center sm:justify-start gap-1 select-none">
                  <AtSign size={14} className="text-[#8bc79f]" />
                  <span>{user?.username || "username"}</span>
                </p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => {
                    setTempName(user?.display_name || "");
                    setIsEditing(true);
                  }}
                  className="px-5 py-2.5 bg-[#2B2A4C] hover:bg-[#1f1e36] text-white rounded-full text-xs font-bold transition-transform hover:scale-[1.02] cursor-pointer shadow-xs select-none"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8B8A9B] mb-2 select-none">
                  <User size={13} className="text-[#8B8A9B]" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground"
                  />
                ) : (
                  <div className="w-full rounded-xl border border-[#EFECE6] bg-[#F9F7F4]/40 py-2.5 px-3.5 text-sm text-foreground/80 font-semibold select-none">
                    {user?.display_name || "—"}
                  </div>
                )}
              </div>


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

              {isEditing && (
                <div className="flex items-center gap-2.5 pt-2 select-none">
                  <button
                    type="submit"
                    className="rounded-full bg-[#2B2A4C] hover:bg-[#1f1e36] text-white px-6 py-2.5 text-xs font-bold hover:scale-[1.02] transition-transform duration-200 cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-full border border-[#2B2A4C] px-6 py-2.5 text-xs font-bold text-[#2B2A4C] hover:scale-[1.02] transition-transform duration-200 cursor-pointer bg-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* Danger Zone Card */}
        <section className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-200">
          <h3 className="font-display text-xl font-bold text-red-500 mb-2 select-none">
            Danger Zone
          </h3>
          <p className="text-xs text-[#8B8A9B] mb-5 select-none">
            Take caution with these irreversible actions.
          </p>

          <div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-5 py-2.5 border border-red-500 hover:bg-red-50 text-red-500 rounded-full text-xs font-bold transition-transform hover:scale-[1.02] cursor-pointer"
            >
              Delete Account
            </button>
          </div>
        </section>
      </main>

      {/* Delete Account Modal overlay */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-[#EFECE6] rounded-2xl w-full max-w-sm p-6 shadow-xl relative z-10 font-sans"
            >
              <div className="flex items-center gap-3 mb-4 select-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="font-display text-xl font-bold text-[#2B2A4C]">
                  Delete Account?
                </h3>
              </div>

              <p className="text-sm text-[#8B8A9B] leading-relaxed mb-6 select-none">
                Are you sure you want to delete your account? <span className="font-semibold text-red-500">This cannot be undone.</span>
              </p>

              <div className="flex items-center justify-end gap-2.5 select-none">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-full border border-[#2B2A4C] px-5 py-2 text-xs font-bold text-[#2B2A4C] hover:scale-[1.02] transition-transform duration-200 cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="rounded-full bg-red-500 hover:bg-red-600 text-white px-5 py-2 text-xs font-bold hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
