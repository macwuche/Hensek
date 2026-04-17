import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPut } from "@/lib/queryClient";
import { formatDate, getInitials, getStatusColor } from "@/lib/utils";
import { Search, MoreVertical, ShieldAlert } from "lucide-react";
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
  hireDate?: string;
  avatarUrl?: string;
}

export default function MDStaff() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "suspended">("all");
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/users"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiPut(`/api/users/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Status updated");
      setOpenMenu(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = users.filter((u) => {
    if (filter !== "all" && u.status !== filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) &&
        !u.email.toLowerCase().includes(search.toLowerCase()) &&
        !u.employeeId.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hensek-dark">Staff</h1>
          <p className="text-sm text-gray-500">{users.length} total employees</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or ID…"
            className="hensek-input w-full pl-8"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "pending", "suspended"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-hensek-dark text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="hensek-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No staff found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Employee</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden sm:table-cell">Dept / Role</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 hidden md:table-cell">Hired</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-8 h-8 rounded-lg bg-hensek-yellow/40 flex items-center justify-center text-xs font-bold text-hensek-dark flex-shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} className="w-full h-full rounded-lg object-cover" alt={u.name} />
                          ) : getInitials(u.name)}
                          {u.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-hensek-dark">{u.name}</p>
                          <p className="text-[10px] text-gray-400">{u.email} · {u.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="capitalize text-gray-700">{u.role}</p>
                      <p className="text-[10px] text-gray-400">{u.departmentSlug || "—"}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                      {u.hireDate ? formatDate(u.hireDate) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`hensek-badge text-[10px] ${getStatusColor(u.status)}`}>{u.status}</span>
                        {u.isClockedIn && <span className="hensek-badge text-[10px] hensek-badge-green">Clocked In</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {openMenu === u.id && (
                        <div className="absolute right-4 top-10 z-10 bg-white rounded-xl shadow-lg border border-white/60 py-1 min-w-[160px] animate-fade-in">
                          {u.status !== "active" && (
                            <button onClick={() => updateStatus.mutate({ id: u.id, status: "active" })} className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50">Activate</button>
                          )}
                          {u.status !== "suspended" && (
                            <button onClick={() => updateStatus.mutate({ id: u.id, status: "suspended" })} className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                              <ShieldAlert size={12} /> Suspend
                            </button>
                          )}
                          {u.status !== "pending" && (
                            <button onClick={() => updateStatus.mutate({ id: u.id, status: "pending" })} className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50">Set Pending</button>
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

      {openMenu && <div className="fixed inset-0 z-0" onClick={() => setOpenMenu(null)} />}
    </div>
  );
}
