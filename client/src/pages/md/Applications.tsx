import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPatch } from "@/lib/queryClient";
import { formatDate, getStatusColor, capitalize, cn } from "@/lib/utils";
import { FileText } from "lucide-react";
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
  hrComment?: string;
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
  { key: "escalated_to_md", label: "Escalated" },
  { key: "pending", label: "Pending" },
  { key: "hr_review", label: "HR Review" },
  { key: "approved", label: "Approved" },
  { key: "md_approved", label: "MD Approved" },
  { key: "md_rejected", label: "MD Rejected" },
  { key: "all", label: "All" },
];

export default function MDApplications() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Application | null>(null);
  const [comment, setComment] = useState("");
  const [filter, setFilter] = useState("escalated_to_md");

  const { data: apps = [], isLoading } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: () => apiFetch("/api/applications"),
  });

  const review = useMutation({
    mutationFn: ({ id, action, comment }: { id: number; action: "approve" | "reject"; comment: string }) =>
      apiPatch(`/api/applications/${id}/review`, { action, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Decision recorded");
      setSelected(null);
      setComment("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = useMemo(
    () => (filter === "all" ? apps : apps.filter((a) => a.status === filter)),
    [apps, filter],
  );

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
      <PageHeader title="Applications" subtitle="Escalated and all staff applications" />

      <div className="hensek-card">
        <div className="flex flex-wrap gap-1 mb-4">
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
            {selected.hrComment && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs font-medium text-blue-700 mb-0.5">HR Comment</p>
                <p className="text-sm text-blue-800">{selected.hrComment}</p>
              </div>
            )}
            {(selected.startDate || selected.endDate) && (
              <p className="text-xs text-gray-500">
                {selected.startDate && `From: ${formatDate(selected.startDate)}`}
                {selected.endDate && ` · To: ${formatDate(selected.endDate)}`}
              </p>
            )}
            {selected.status === "escalated_to_md" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">MD Comment (optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="hensek-input w-full h-20 resize-none"
                    placeholder="Reason for decision…"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => review.mutate({ id: selected.id, action: "reject", comment })}
                    disabled={review.isPending}
                    className="hensek-btn-danger flex-1 justify-center"
                  >Reject</button>
                  <button
                    onClick={() => review.mutate({ id: selected.id, action: "approve", comment })}
                    disabled={review.isPending}
                    className="hensek-btn-primary flex-1 justify-center"
                  >Approve</button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
