import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiPut, apiPost } from "@/lib/queryClient";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function MDSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [profile, setProfile] = useState({ name: user?.name || "", phone: (user as any)?.phone || "", address: (user as any)?.address || "" });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await apiPut("/api/auth/profile", profile);
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) { toast.error("Passwords don't match"); return; }
    setSavingPw(true);
    try {
      await apiPost("/api/auth/change-password", { currentPassword: passwords.current, newPassword: passwords.next });
      toast.success("Password changed");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="py-6 space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account</p>
      </div>

      <div className="hensek-card p-5">
        <h2 className="text-sm font-semibold text-hensek-dark mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} className="hensek-input w-full" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} className="hensek-input w-full" placeholder="+234 800 000 0000" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input value={profile.address} onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))} className="hensek-input w-full" placeholder="Your address" />
          </div>
          <button type="submit" disabled={savingProfile} className="hensek-btn-primary">
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>

      <div className="hensek-card p-5">
        <h2 className="text-sm font-semibold text-hensek-dark mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
            <input type="password" value={passwords.current} onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))} className="hensek-input w-full" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
            <input type="password" value={passwords.next} onChange={(e) => setPasswords(p => ({ ...p, next: e.target.value }))} className="hensek-input w-full" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
            <input type="password" value={passwords.confirm} onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))} className="hensek-input w-full" required />
          </div>
          <button type="submit" disabled={savingPw} className="hensek-btn-primary">
            {savingPw ? "Changing…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
