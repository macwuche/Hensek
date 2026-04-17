import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPut } from "@/lib/queryClient";
import { formatDate, getInitials } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface PendingUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  employeeId: string;
  createdAt: string;
}

export default function HRApprovals() {
  const qc = useQueryClient();

  const { data: pending = [], isLoading } = useQuery<PendingUser[]>({
    queryKey: ["users", "pending"],
    queryFn: () => apiFetch("/api/users/pending"),
  });

  const approve = useMutation({
    mutationFn: (id: number) => apiPut(`/api/users/${id}/approve`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Account approved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: (id: number) => apiPut(`/api/users/${id}/status`, { status: "suspended" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Account rejected"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Pending Approvals</h1>
        <p className="text-sm text-gray-500">{pending.length} accounts awaiting activation</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" /></div>
      ) : pending.length === 0 ? (
        <div className="hensek-card py-16 text-center">
          <CheckCircle2 size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">All caught up — no pending approvals</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((u) => (
            <div key={u.id} className="hensek-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-hensek-yellow/30 flex items-center justify-center font-bold text-hensek-dark text-sm">
                  {getInitials(u.name)}
                </div>
                <div>
                  <p className="font-semibold text-hensek-dark">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                  <p className="text-[10px] text-gray-400">Registered {formatDate(u.createdAt)} · {u.employeeId}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => reject.mutate(u.id)}
                  disabled={reject.isPending || approve.isPending}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                  title="Reject"
                >
                  <XCircle size={16} />
                </button>
                <button
                  onClick={() => approve.mutate(u.id)}
                  disabled={approve.isPending || reject.isPending}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                  title="Approve"
                >
                  <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {pending.length > 1 && (
            <button
              onClick={() => { if (confirm(`Approve all ${pending.length} accounts?`)) pending.forEach((u) => approve.mutate(u.id)); }}
              className="hensek-btn-primary w-full justify-center"
            >
              Approve All ({pending.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
