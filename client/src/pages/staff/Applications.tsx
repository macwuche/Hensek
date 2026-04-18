import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { formatDate, getStatusColor, capitalize, cn, APPLICATION_TYPES } from "@/lib/utils";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";

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

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "hr_review", label: "HR Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-hensek-dark">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function StaffApplications() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Application | null>(null);
  const [filter, setFilter] = useState("all");
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

  const counts: Record<string, number> = { all: applications.length };
  applications.forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1; });

  const filtered = useMemo(
    () => (filter === "all" ? applications : applications.filter((a) => a.status === filter)),
    [applications, filter],
  );

  const columns: Column<Application>[] = [
    {
      key: "subject",
      header: "Application",
      render: (a) => (
        <div className="min-w-0">
          <p className="font-medium text-sm text-hensek-dark truncate">{a.subject}</p>
          <p className="text-[11px] text-gray-400">
            {APPLICATION_TYPES.find((t) => t.value === a.type)?.label || a.type} · {formatDate(a.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (a) => <span className="text-xs text-gray-600 capitalize">{a.type.replace(/_/g, " ")}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "status",
      header: "Status",
      render: (a) => (
        <span className={`hensek-badge ${getStatusColor(a.status)}`}>
          {capitalize(a.status.replace(/_/g, " "))}
        </span>
      ),
    },
  ];

  return (
    <div className="hensek-page-shell">
      <PageHeader
        title="My Applications"
        subtitle="Submit and track your applications"
        actions={
          <button className="hensek-btn-primary flex items-center gap-1.5" onClick={() => setShowForm(true)}>
            <Plus size={15} /> New Application
          </button>
        }
      />

      <div className="hensek-card">
        <div className="flex flex-wrap gap-1 mb-4">
          {TABS.map((t) => {
            const c = counts[t.key] || 0;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                  filter === t.key
                    ? "bg-hensek-dark text-white"
                    : "bg-hensek-warm text-gray-600 hover:bg-hensek-warm/70",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "text-[10px] rounded-full px-1.5 py-0.5",
                    filter === t.key ? "bg-hensek-yellow text-hensek-dark" : "bg-white/60 text-gray-500",
                  )}
                >
                  {c}
                </span>
              </button>
            );
          })}
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(a) => String(a.id)}
          loading={isLoading}
          onRowClick={(a) => setSelected(a)}
          empty={
            <div className="flex flex-col items-center gap-2">
              <FileText size={20} className="text-gray-300" />
              <span>No applications yet</span>
            </div>
          }
        />
      </div>

      {showForm && (
        <Modal title="New Application" onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Application Type</label>
              <select
                className="hensek-input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {APPLICATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Subject *</label>
              <input
                className="hensek-input"
                placeholder="Brief subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Description *</label>
              <textarea
                className="hensek-input h-28 resize-none"
                placeholder="Provide details for your application…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)} className="hensek-btn-outline flex-1 justify-center">Cancel</button>
              <button
                onClick={() => submitMutation.mutate(form)}
                disabled={submitMutation.isPending || !form.subject || !form.description}
                className="hensek-btn-primary flex-1 justify-center"
              >
                {submitMutation.isPending ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.subject} onClose={() => setSelected(null)}>
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <span className={`hensek-badge ${getStatusColor(selected.status)}`}>
                {capitalize(selected.status.replace(/_/g, " "))}
              </span>
              <span className="hensek-badge hensek-badge-gray">{selected.type.replace(/_/g, " ")}</span>
              <span className="text-xs text-gray-400 self-center">{formatDate(selected.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.description}</p>
            {selected.hrComment && (
              <div className="bg-blue-50 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-blue-700 mb-0.5">HR Comment</p>
                <p className="text-xs text-blue-700/90">{selected.hrComment}</p>
              </div>
            )}
            {selected.mdComment && (
              <div className="bg-yellow-50 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-yellow-700 mb-0.5">MD Comment</p>
                <p className="text-xs text-yellow-700/90">{selected.mdComment}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
