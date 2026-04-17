import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPut, apiPost } from "@/lib/queryClient";
import { formatDate, getInitials, getStatusColor, capitalize } from "@/lib/utils";
import { Search, MessageSquare, MoreVertical } from "lucide-react";
import { toast } from "sonner";

interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: string;
  departmentSlug: string | null;
  status: string;
  employeeId: string;
  isClockedIn: boolean;
  isOnline: boolean;
  avatarUrl?: string;
  hireDate?: string;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
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

export default function HRStaff() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [commentTarget, setCommentTarget] = useState<StaffUser | null>(null);
  const [comment, setComment] = useState("");
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/users"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiPut(`/api/users/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("Status updated"); setOpenMenu(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const addComment = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) => apiPost(`/api/users/${id}/comments`, { comment }),
    onSuccess: () => { toast.success("Comment added"); setCommentTarget(null); setComment(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hensek-dark">Staff</h1>
          <p className="text-sm text-gray-500">{users.length} employees</p>
        </div>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff…" className="hensek-input w-full pl-8" />
      </div>

      <div className="hensek-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No staff found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Employee</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden sm:table-cell">Department</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-8 h-8 rounded-lg bg-hensek-yellow/40 flex items-center justify-center text-xs font-bold text-hensek-dark flex-shrink-0">
                          {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full rounded-lg object-cover" alt={u.name} /> : getInitials(u.name)}
                          {u.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
                        </div>
                        <div>
                          <p className="font-medium text-hensek-dark">{u.name}</p>
                          <p className="text-[10px] text-gray-400">{u.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600 capitalize">{u.departmentSlug || u.role}</td>
                    <td className="px-4 py-3">
                      <span className={`hensek-badge text-[10px] ${getStatusColor(u.status)}`}>{capitalize(u.status)}</span>
                    </td>
                    <td className="px-4 py-3 relative">
                      <button onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                        <MoreVertical size={14} />
                      </button>
                      {openMenu === u.id && (
                        <div className="absolute right-4 top-10 z-10 bg-white rounded-xl shadow-lg border border-white/60 py-1 min-w-[160px] animate-fade-in">
                          <button onClick={() => { setCommentTarget(u); setOpenMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <MessageSquare size={12} /> Add Comment
                          </button>
                          {u.status !== "active" && (
                            <button onClick={() => updateStatus.mutate({ id: u.id, status: "active" })} className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50">Activate</button>
                          )}
                          {u.status === "active" && (
                            <button onClick={() => updateStatus.mutate({ id: u.id, status: "suspended" })} className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50">Suspend</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {openMenu && <div className="fixed inset-0 z-0" onClick={() => setOpenMenu(null)} />}
    </div>
  );
}
