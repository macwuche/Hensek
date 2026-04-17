import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { formatDate, getStatusColor } from "@/lib/utils";
import { APPLICATION_TYPES } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: number;
  type: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  hrComment?: string;
  mdComment?: string;
}

export default function StaffApplications() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "leave", subject: "", description: "" });

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["applications", "my"],
    queryFn: () => apiFetch("/api/applications/my"),
  });

  const submitMutation = useMutation({
    mutationFn: (data: typeof form) => apiPost("/api/applications", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications", "my"] });
      setShowForm(false);
      setForm({ type: "leave", subject: "", description: "" });
      toast.success("Application submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hensek-dark">My Applications</h1>
          <p className="text-sm text-gray-500">Submit and track your applications</p>
        </div>
        <button className="hensek-btn-primary flex items-center gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Application
        </button>
      </div>

      {/* Submit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="hensek-card w-full max-w-md p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-hensek-dark">New Application</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Application Type</label>
                <select className="hensek-input text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {APPLICATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Subject *</label>
                <input className="hensek-input text-sm" placeholder="Brief subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description *</label>
                <textarea
                  className="hensek-input text-sm resize-none"
                  rows={4}
                  placeholder="Provide details for your application…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button className="hensek-btn-secondary text-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className="hensek-btn-primary text-sm"
                onClick={() => submitMutation.mutate(form)}
                disabled={submitMutation.isPending || !form.subject || !form.description}
              >
                {submitMutation.isPending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="hensek-card p-8 text-center">
          <p className="text-sm text-gray-400">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((a) => (
            <div key={a.id} className="hensek-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-hensek-dark">{a.subject}</p>
                  <p className="text-xs text-gray-400">{APPLICATION_TYPES.find(t => t.value === a.type)?.label || a.type} · {formatDate(a.createdAt)}</p>
                </div>
                <span className={`hensek-badge text-[10px] shrink-0 ${getStatusColor(a.status)}`}>
                  {a.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{a.description}</p>
              {(a.hrComment || a.mdComment) && (
                <div className="space-y-1">
                  {a.hrComment && (
                    <div className="bg-blue-50 rounded-lg px-3 py-1.5">
                      <p className="text-xs font-medium text-blue-700">HR: <span className="font-normal">{a.hrComment}</span></p>
                    </div>
                  )}
                  {a.mdComment && (
                    <div className="bg-yellow-50 rounded-lg px-3 py-1.5">
                      <p className="text-xs font-medium text-yellow-700">MD: <span className="font-normal">{a.mdComment}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
