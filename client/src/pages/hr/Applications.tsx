import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPatch } from "@/lib/queryClient";
import { formatDate, getStatusColor, capitalize, cn } from "@/lib/utils";
import { Search, FileText } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";

interface Application {
  id: number;
  userId: number;
  type: string;
  title: string;
  description: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  userName?: string;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-hensek-dark">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "hr_review", label: "HR Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "escalated_to_md", label: "Escalated" },
  { key: "all", label: "All" },
];

export default function HRApplications() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Application | null>(null);
  const [comment, setComment] = useState("");
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  const { data: apps = [], isLoading } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: () => apiFetch("/api/applications"),
  });

  const review = useMutation({
    mutationFn: ({ id, action, comment }: { id: number; action: "approve" | "reject" | "escalate"; comment: string }) =>
      apiPatch(`/api/applications/${id}/review`, { action, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Decision recorded");
      setSelected(null);
      setComment("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    let rows = filter === "all" ? apps : apps.filter((a) => a.status === filter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((a) => a.title.toLowerCase().includes(q) || (a.userName ?? "").toLowerCase().includes(q));
    }
    return rows;
  }, [apps, filter, search]);

  const counts: Record<string, number> = {};
  apps.forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1; });

  const columns: Column<Application>[] = [
    {
      key: "title",
      header: "Application",
      render: (a) => (
        <div className="min-w-0">
          <p className="font-medium text-sm text-hensek-dark truncate">{a.title}</p>
          <p className="text-[10px] text-gray-400">{a.userName ?? "Unknown"} · {formatDate(a.createdAt)}</p>
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
      render: (a) => <span className={`hensek-badge ${getStatusColor(a.status)}`}>{capitalize(a.status.replace(/_/g, " "))}</span>,
    },
  ];

  return (
    <div className="hensek-page-shell">
      <PageHeader title="Applications" subtitle="Review staff leave and other applications" />

      <div className="hensek-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => {
              const c = t.key === "all" ? apps.length : counts[t.key] || 0;
              return (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                    filter === t.key ? "bg-hensek-dark text-white" : "bg-hensek-warm text-gray-600 hover:bg-hensek-warm/70",
                  )}
                >
                  {t.label}
                  <span className={cn("text-[10px] rounded-full px-1.5 py-0.5", filter === t.key ? "bg-hensek-yellow text-hensek-dark" : "bg-white/60 text-gray-500")}>{c}</span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="hensek-input pl-8 w-full lg:w-64"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(a) => String(a.id)}
          loading={isLoading}
          onRowClick={(a) => { setSelected(a); setComment(""); }}
          empty={
            <div className="flex flex-col items-center gap-2">
              <FileText size={20} className="text-gray-300" />
              <span>No applications</span>
            </div>
          }
        />
      </div>

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <span className={`hensek-badge ${getStatusColor(selected.status)}`}>{capitalize(selected.status.replace(/_/g, " "))}</span>
              <span className="hensek-badge hensek-badge-gray">{selected.type.replace(/_/g, " ")}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.description}</p>
            {(selected.startDate || selected.endDate) && (
              <p className="text-xs text-gray-500">
                {selected.startDate && `From: ${formatDate(selected.startDate)}`}
                {selected.endDate && ` · To: ${formatDate(selected.endDate)}`}
              </p>
            )}
            {selected.status === "pending" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Comment (optional)</label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="hensek-input w-full h-20 resize-none" placeholder="Reason or note…" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => review.mutate({ id: selected.id, action: "reject", comment })} disabled={review.isPending} className="hensek-btn-danger flex-1 justify-center">Reject</button>
                  <button onClick={() => review.mutate({ id: selected.id, action: "escalate", comment })} disabled={review.isPending} className="hensek-btn-outline flex-1 justify-center">Escalate to MD</button>
                  <button onClick={() => review.mutate({ id: selected.id, action: "approve", comment })} disabled={review.isPending} className="hensek-btn-primary flex-1 justify-center">Approve</button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
