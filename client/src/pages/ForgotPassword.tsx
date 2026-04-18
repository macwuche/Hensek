import { useState } from "react";
import { Link } from "wouter";
import { apiPost } from "@/lib/queryClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiPost<{ message: string }>("/api/auth/forgot-password", { email });
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Could not send reset email");
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
          <h1 className="text-2xl font-bold text-hensek-dark">Forgot password</h1>
          <p className="text-sm text-gray-500 mt-1">We'll email you a reset link</p>
        </div>

        <div className="hensek-card p-6">
          {done ? (
            <div className="text-sm text-gray-700 space-y-3">
              <div className="px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent. Check your inbox.
              </div>
              <Link href="/login">
                <span className="text-hensek-dark font-medium hover:underline cursor-pointer">Back to sign in</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
              )}
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
              <button type="submit" disabled={submitting} className="hensek-btn-primary w-full justify-center">
                {submitting ? "Sending…" : "Send reset link"}
              </button>
              <p className="text-center text-xs text-gray-500">
                Remembered it?{" "}
                <Link href="/login">
                  <span className="text-hensek-dark font-medium hover:underline cursor-pointer">Back to sign in</span>
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
