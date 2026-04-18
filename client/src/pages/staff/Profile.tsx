import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPut, apiPost } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { getInitials, capitalize } from "@/lib/utils";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";

export default function StaffProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: (user as any)?.phone || "",
    address: (user as any)?.address || "",
  });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const profileMutation = useMutation({
    mutationFn: (data: typeof profile) => apiPut("/api/auth/profile", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["auth", "me"] }); toast.success("Profile updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      apiPost("/api/auth/change-password", { currentPassword, newPassword }),
    onSuccess: () => {
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePasswordSubmit = () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    passwordMutation.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
  };

  return (
    <div className="hensek-page-shell">
      <PageHeader title="My Profile" subtitle="Update your personal information and password" />

      <div className="hensek-card flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-hensek-yellow/30 flex items-center justify-center text-xl font-bold text-hensek-dark">
            {user ? getInitials(user.name) : "?"}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-base font-semibold text-hensek-dark">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="text-xs text-gray-400">
            {capitalize(user?.role || "staff")} · {capitalize(user?.departmentSlug || "General")}
            {user?.employeeId && ` · ID ${user.employeeId}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Personal Information" subtitle="Your name and contact details">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Display Name</label>
              <input
                className="hensek-input"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
              <input
                className="hensek-input"
                placeholder="+234…"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Address</label>
              <input
                className="hensek-input"
                placeholder="Your address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                className="hensek-btn-primary"
                onClick={() => profileMutation.mutate(profile)}
                disabled={profileMutation.isPending}
              >
                {profileMutation.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Change Password" subtitle="Use a strong, unique password">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Current Password</label>
              <input
                type="password"
                className="hensek-input"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">New Password</label>
              <input
                type="password"
                className="hensek-input"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Confirm New Password</label>
              <input
                type="password"
                className="hensek-input"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                className="hensek-btn-primary"
                onClick={handlePasswordSubmit}
                disabled={passwordMutation.isPending || !passwords.currentPassword || !passwords.newPassword}
              >
                {passwordMutation.isPending ? "Changing…" : "Change Password"}
              </button>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
