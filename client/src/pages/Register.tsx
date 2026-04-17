import { useState } from "react";
import { Link } from "wouter";
import { apiPost } from "@/lib/queryClient";
import { toast } from "sonner";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
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
          <p className="text-sm text-gray-500 mt-1">Request Access</p>
        </div>

        {done ? (
          <div className="hensek-card p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h2 className="text-lg font-semibold text-hensek-dark mb-2">Registration Submitted</h2>
            <p className="text-sm text-gray-500 mb-4">
              Your account is pending HR approval. You will be notified once it is activated.
            </p>
            <Link href="/login">
              <span className="hensek-btn-primary inline-flex justify-center cursor-pointer">Back to Login</span>
            </Link>
          </div>
        ) : (
          <div className="hensek-card p-6">
            <h2 className="text-lg font-semibold text-hensek-dark mb-1">Create Account</h2>
            <p className="text-xs text-gray-500 mb-4">HR will review and activate your account.</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={set("name")} className="hensek-input w-full" placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                <input type="email" value={form.email} onChange={set("email")} className="hensek-input w-full" placeholder="you@hensek.com" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone (optional)</label>
                <input type="tel" value={form.phone} onChange={set("phone")} className="hensek-input w-full" placeholder="+234 800 000 0000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <input type="password" value={form.password} onChange={set("password")} className="hensek-input w-full" placeholder="Min. 6 characters" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} className="hensek-input w-full" placeholder="Repeat password" required />
              </div>

              <button type="submit" disabled={submitting} className="hensek-btn-primary w-full justify-center mt-2">
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-hensek-dark/40 border-t-hensek-dark rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : "Submit Registration"}
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-4">
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-hensek-dark font-medium hover:underline cursor-pointer">Sign in</span>
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
