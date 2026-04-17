import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPut } from "@/lib/queryClient";
import { formatDate, getStatusColor, capitalize } from "@/lib/utils";
import { toast } from "sonner";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
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

export default function HRApplications() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Application | null>(null);
  const [comment, setComment] = useState("");
  const [filter, setFilter] = useState("pending");

  const { data: apps = [], isLoading } = useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: () => apiFetch("/api/applications"),
  });

  const review = useMutation({
    mutationFn: ({ id, status, hrComment }: { id: number; status: string; hrComment: string }) =>
      apiPut(`/api/applications/${id}/review`, { status, hrComment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Decision recorded");
      setSelected(null);
      setComment("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);
  const counts: Record<string, number> = {};
  apps.forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1; });

  return (
    <div className="py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Applications</h1>
        <p className="text-sm text-gray-500">Review staff leave and other applications</p>
      </div>

      <div className="flex gap-1 flex-wrap">
        {["pending", "hr_review", "approved", "rejected", "escalated_to_md", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? "bg-hensek-dark text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {capitalize(f.replace(/_/g, " "))} ({f === "all" ? apps.length : counts[f] || 0})
          </button>
        ))}
      </div>

      <div className="hensek-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No applications</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((app) => (
              <li key={app.id} className="px-4 py-3 hover:bg-gray-50/50 cursor-pointer" onClick={() => { setSelected(app); setComment(""); }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`hensek-badge text-[10px] ${getStatusColor(app.status)}`}>{capitalize(app.status)}</span>
                      <span className="text-[10px] text-gray-400 uppercase">{app.type.replace(/_/g, " ")}</span>
                    </div>
                    <p className="font-medium text-sm text-hensek-dark truncate">{app.title}</p>
                    <p className="text-xs text-gray-400">{app.userName ? `${app.userName} · ` : ""}{formatDate(app.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <span className={`hensek-badge ${getStatusColor(selected.status)}`}>{capitalize(selected.status)}</span>
              <span className="hensek-badge hensek-badge-gray">{selected.type.replace(/_/g, " ")}</span>
            </div>
            <p className="text-sm text-gray-700">{selected.description}</p>
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
                <div className="flex gap-2">
                  <button onClick={() => review.mutate({ id: selected.id, status: "rejected", hrComment: comment })} disabled={review.isPending} className="hensek-btn-danger flex-1 justify-center">Reject</button>
                  <button onClick={() => review.mutate({ id: selected.id, status: "escalated_to_md", hrComment: comment })} disabled={review.isPending} className="hensek-btn-outline flex-1 justify-center">Escalate to MD</button>
                  <button onClick={() => review.mutate({ id: selected.id, status: "approved", hrComment: comment })} disabled={review.isPending} className="hensek-btn-primary flex-1 justify-center">Approve</button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
