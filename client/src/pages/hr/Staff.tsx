import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPatch, apiPost } from "@/lib/queryClient";
import { formatDate, getInitials, getStatusColor, capitalize } from "@/lib/utils";
import { Search, MessageSquare, MoreVertical, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";
import { cn } from "@/lib/utils";

interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  departmentSlug: string | null;
  status: string;
  employeeId: string;
  isClockedIn: boolean;
  isOnline: boolean;
  avatarUrl?: string;
  hireDate?: string;
  createdAt?: string;
}

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

type Tab = "active" | "pending" | "suspended";

export default function HRStaff() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [commentTarget, setCommentTarget] = useState<StaffUser | null>(null);
  const [comment, setComment] = useState("");

  const { data: users = [], isLoading: loadingUsers } = useQuery<StaffUser[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/users"),
  });

  const { data: pending = [], isLoading: loadingPending } = useQuery<StaffUser[]>({
    queryKey: ["users", "pending"],
    queryFn: () => apiFetch("/api/users/pending"),
  });

  // HR can approve (active) or reject (suspended). HR has no /suspend or /activate, so reuse approve/reject endpoints.
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "suspended" }) => {
      const path = status === "active" ? "approve" : "reject";
      return apiPatch(`/api/users/${id}/${path}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", "pending"] });
      toast.success("Status updated");
      setOpenMenu(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: (id: number) => apiPatch(`/api/users/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", "pending"] });
      toast.success("Account approved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: (id: number) => apiPatch(`/api/users/${id}/reject`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", "pending"] });
      toast.success("Account rejected");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addComment = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) => apiPost(`/api/users/${id}/comment`, { comment }),
    onSuccess: () => { toast.success("Comment added"); setCommentTarget(null); setComment(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const counts = {
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    pending: pending.length,
  };

  const sourceRows: StaffUser[] = tab === "pending" ? pending : users.filter((u) => u.status === tab);
  const filtered = useMemo(() => {
    if (!search) return sourceRows;
    const q = search.toLowerCase();
    return sourceRows.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.employeeId.toLowerCase().includes(q),
    );
  }, [sourceRows, search]);

  const baseCols: Column<StaffUser>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-hensek-yellow/40 flex items-center justify-center text-xs font-bold text-hensek-dark flex-shrink-0">
            {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full rounded-lg object-cover" alt={u.name} /> : getInitials(u.name)}
            {u.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-hensek-dark text-sm truncate">{u.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "id", header: "Employee ID", render: (u) => <span className="text-xs text-gray-500">{u.employeeId}</span>, className: "hidden md:table-cell" },
    { key: "dept", header: "Department", render: (u) => <span className="text-xs capitalize">{u.departmentSlug || u.role}</span>, className: "hidden sm:table-cell" },
  ];

  const columns: Column<StaffUser>[] = tab === "pending"
    ? [
        ...baseCols,
        {
          key: "registered",
          header: "Registered",
          render: (u) => <span className="text-xs text-gray-500">{u.createdAt ? formatDate(u.createdAt) : "—"}</span>,
          className: "hidden lg:table-cell",
        },
        {
          key: "actions",
          header: "",
          className: "text-right w-32",
          render: (u) => (
            <div className="flex items-center justify-end gap-1.5">
              <button
                onClick={() => reject.mutate(u.id)}
                disabled={reject.isPending || approve.isPending}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500"
                title="Reject"
              >
                <XCircle size={14} />
              </button>
              <button
                onClick={() => approve.mutate(u.id)}
                disabled={approve.isPending || reject.isPending}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 hover:bg-green-100 text-green-600"
                title="Approve"
              >
                <CheckCircle2 size={14} />
              </button>
            </div>
          ),
        },
      ]
    : [
        ...baseCols,
        {
          key: "status",
          header: "Status",
          render: (u) => <span className={`hensek-badge ${getStatusColor(u.status)}`}>{capitalize(u.status)}</span>,
        },
        {
          key: "menu",
          header: "",
          className: "w-12 relative",
          render: (u) => (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === u.id ? null : u.id); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <MoreVertical size={14} />
              </button>
              {openMenu === u.id && (
                <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-lg border border-white/60 py-1 min-w-[160px] animate-fade-in">
                  <button onClick={(e) => { e.stopPropagation(); setCommentTarget(u); setOpenMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <MessageSquare size={12} /> Add Comment
                  </button>
                  {u.status !== "active" && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: u.id, status: "active" }); }} className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50">Activate</button>
                  )}
                  {u.status === "active" && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: u.id, status: "suspended" }); }} className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50">Suspend</button>
                  )}
                </div>
              )}
            </div>
          ),
        },
      ];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: counts.active },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "suspended", label: "Suspended", count: counts.suspended },
  ];

  return (
    <div className="hensek-page-shell">
      <PageHeader title="Employees" subtitle={`${users.length + pending.length} total people`} />

      <div className="hensek-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex bg-hensek-warm rounded-xl p-1 self-start">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
                  tab === t.key ? "bg-white text-hensek-dark shadow-sm" : "text-gray-600 hover:text-hensek-dark",
                )}
              >
                {t.label}
                <span className={cn("text-[10px] rounded-full px-1.5 py-0.5", tab === t.key ? "bg-hensek-yellow text-hensek-dark" : "bg-white/60 text-gray-500")}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff…"
              className="hensek-input pl-8 w-full lg:w-64"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(u) => String(u.id)}
          loading={tab === "pending" ? loadingPending : loadingUsers}
          empty={tab === "pending" ? "No pending approvals — all caught up" : "No staff in this view"}
        />
      </div>

      {commentTarget && (
        <Modal title={`Comment on ${commentTarget.name}`} onClose={() => setCommentTarget(null)}>
          <form onSubmit={(e) => { e.preventDefault(); addComment.mutate({ id: commentTarget.id, comment }); }} className="space-y-3">
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="hensek-input w-full h-28 resize-none" placeholder="Write a comment about this staff member…" required />
            <div className="flex gap-2">
              <button type="button" onClick={() => setCommentTarget(null)} className="hensek-btn-outline flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={addComment.isPending} className="hensek-btn-primary flex-1 justify-center">{addComment.isPending ? "Saving…" : "Add Comment"}</button>
            </div>
          </form>
        </Modal>
      )}

      {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}
    </div>
  );
}
