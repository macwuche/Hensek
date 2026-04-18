import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { apiPost } from "@/lib/queryClient";

export default function ResetPassword() {
  const [location] = useLocation();
  const token = useMemo(() => {
    const qs = typeof window !== "undefined" ? window.location.search : "";
    return new URLSearchParams(qs).get("token") || "";
  }, [location]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirm) return setError("Passwords do not match");

    setSubmitting(true);
    try {
      await apiPost<{ message: string }>("/api/auth/reset-password", { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Could not reset password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #F5F0DC 0%, #FEFCE8 55%, #FEF9C3 100%)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-hensek-dark flex items-center justify-center mb-3 shadow-lg">
            <span className="text-hensek-yellow font-bold text-2xl">H</span>
          </div>
          <h1 className="text-2xl font-bold text-hensek-dark">Set a new password</h1>
          <p className="text-sm text-gray-500 mt-1">Choose something memorable and secure</p>
        </div>

        <div className="hensek-card p-6">
          {!token ? (
            <div className="text-sm text-red-600">
              Missing reset token. Please use the link from your email.
            </div>
          ) : done ? (
            <div className="text-sm text-gray-700 space-y-3">
              <div className="px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700">
                Your password has been updated. You can now sign in.
              </div>
              <Link href="/login">
                <span className="text-hensek-dark font-medium hover:underline cursor-pointer">Go to sign in</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="hensek-input w-full"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm new password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="hensek-input w-full"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button type="submit" disabled={submitting} className="hensek-btn-primary w-full justify-center">
                {submitting ? "Saving…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
