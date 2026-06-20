import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import Navbar from "./Navbar";
import { useToast } from "./Toast";

export default function ProfilePage() {
  const { showToast } = useToast();
  
  // Profile state
  const [name, setName] = useState("Aarav");
  const [email, setEmail] = useState("aarav@example.com");
  const [tempName, setTempName] = useState("Aarav");
  const [tempEmail, setTempEmail] = useState("aarav@example.com");
  
  const [isEditing, setIsEditing] = useState(false);
  
  // Preferences state
  const [currency, setCurrency] = useState("INR");
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  // Delete account confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) {
      showToast("Name cannot be empty", "error");
      return;
    }
    if (!tempEmail.trim()) {
      showToast("Email cannot be empty", "error");
      return;
    }
    setName(tempName);
    setEmail(tempEmail);
    setIsEditing(false);
    showToast("Profile updated successfully! 🎉", "success");
  };

  const handleCancelEdit = () => {
    setTempName(name);
    setTempEmail(email);
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    console.log("Delete user account initiated");
    showToast("Account successfully deleted", "success");
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20">
      <Navbar />

      {/* Breadcrumb Header */}
      <div className="border-b border-[#EFECE6] bg-white/50 py-3">
        <div className="mx-auto max-w-2xl px-6 flex items-center gap-2">
          <Link
            to="/dashboard"
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-[#EFECE6] hover:text-foreground cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={16} />
          </Link>
          <nav className="text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] flex items-center gap-1.5 select-none">
            <Link to="/dashboard" className="hover:text-foreground transition-colors decoration-none">Your Trips</Link>
            <span className="text-foreground/30">/</span>
            <span className="text-foreground">Profile & Settings</span>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
        
        {/* Profile Card */}
        <section className="bg-white border border-[#EFECE6] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#AAD9BB] transition-all duration-200">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Avatar Circle */}
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-[#2B2A4C] border-2 border-white shadow-md select-none"
              style={{ backgroundColor: "#AAD9BB" }}
            >
              {name[0]?.toUpperCase()}
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <h2 className="font-display text-2xl font-bold text-[#2B2A4C] leading-snug">
                {name}
              </h2>
              <p className="text-sm text-[#8B8A9B] mt-0.5">
                {email}
              </p>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 sm:mt-0 px-4 py-2 border border-[#2B2A4C] hover:bg-[#2B2A4C]/5 text-[#2B2A4C] rounded-full text-xs font-bold transition-transform hover:scale-[1.02] cursor-pointer"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Edit Profile Form (Framer Motion slide down) */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleSaveChanges} className="mt-6 pt-6 border-t border-[#F5F0E8] space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1.5 select-none">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B8A9B] mb-1.5 select-none">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#EFECE6] bg-white py-2.5 px-3.5 text-sm outline-none transition-all duration-200 hover:border-[#AAD9BB] focus:border-[#AAD9BB] focus:shadow-[0_0_0_3px_rgba(170,217,187,0.25)] text-foreground"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 select-none">
                    <button
                      type="submit"
                      className="rounded-full bg-[#2B2A4C] hover:bg-[#1f1e36] text-white px-5 py-2.5 text-xs font-bold hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-full border border-[#2B2A4C] px-5 py-2.5 text-xs font-bold text-[#2B2A4C] hover:scale-[1.02] transition-transform duration-200 cursor-pointer bg-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Preferences Card */}
        <section className="bg-white border border-[#EFECE6] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#AAD9BB] transition-all duration-200">
          <h3 className="font-display text-xl font-bold text-[#2B2A4C] mb-5 select-none">
            Preferences
          </h3>

          <div className="space-y-5">
            {/* Default Currency */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-sm font-semibold text-[#2B2A4C]">Currency</span>
                <p className="text-[11px] text-[#8B8A9B]">Default symbol for new expenses</p>
              </div>
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  showToast(`Currency changed to ${e.target.value}`, "success");
                }}
                className="rounded-xl border border-[#EFECE6] bg-white py-2 px-3 text-xs font-semibold outline-none transition-all hover:border-[#AAD9BB] focus:border-[#AAD9BB] text-[#2B2A4C] cursor-pointer"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>

            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-sm font-semibold text-[#2B2A4C]">Email notifications</span>
                <p className="text-[11px] text-[#8B8A9B]">Receive weekly digest and activity updates</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  emailNotifications ? "bg-[#AAD9BB]" : "bg-gray-200"
                }`}
                aria-label="Toggle email notifications"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    emailNotifications ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
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
