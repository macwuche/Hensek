import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/lib/utils";

export default function Login() {
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect
  if (!isLoading && user) {
    window.location.href = getDashboardPath(user.role, user.departmentSlug);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #F5F0DC 0%, #FEFCE8 55%, #FEF9C3 100%)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-hensek-dark flex items-center justify-center mb-3 shadow-lg">
            <span className="text-hensek-yellow font-bold text-2xl">H</span>
          </div>
          <h1 className="text-2xl font-bold text-hensek-dark">Hensek Platform</h1>
          <p className="text-sm text-gray-500 mt-1">Staff Management System</p>
        </div>

        <div className="hensek-card p-6">
          <h2 className="text-lg font-semibold text-hensek-dark mb-4">Sign In</h2>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hensek-input w-full"
                placeholder="you@hensek.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="hensek-input w-full"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="hensek-btn-primary w-full justify-center"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-hensek-dark/40 border-t-hensek-dark rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            New employee?{" "}
            <Link href="/register">
              <span className="text-hensek-dark font-medium hover:underline cursor-pointer">Request access</span>
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Accounts require HR approval before first login
        </p>
      </div>
    </div>
  );
}
