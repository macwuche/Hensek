import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPatch } from "@/lib/queryClient";
import { formatDate, getInitials, getStatusColor, capitalize, cn } from "@/lib/utils";
import { Search, MoreVertical, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";

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

type Filter = "all" | "active" | "pending" | "suspended";

export default function MDStaff() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/users"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "active" | "suspended" }) => {
      const action = status === "active" ? "activate" : "suspend";
      return apiPatch(`/api/users/${id}/${action}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Status updated");
      setOpenMenu(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filter !== "all" && u.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.employeeId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [users, filter, search]);

  const counts: Record<Filter, number> = {
    all: users.length,
    active: users.filter((u) => u.status === "active").length,
    pending: users.filter((u) => u.status === "pending").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  const columns: Column<StaffUser>[] = [
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
            <p className="text-[10px] text-gray-400 truncate">{u.email} · {u.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "dept",
      header: "Dept / Role",
      render: (u) => (
        <div>
          <p className="capitalize text-xs text-gray-700">{u.role}</p>
          <p className="text-[10px] text-gray-400">{u.departmentSlug || "—"}</p>
        </div>
      ),
      className: "hidden sm:table-cell",
    },
    {
      key: "hired",
      header: "Hired",
      render: (u) => <span className="text-xs text-gray-500">{u.hireDate ? formatDate(u.hireDate) : "—"}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <span className={`hensek-badge ${getStatusColor(u.status)}`}>{capitalize(u.status)}</span>
          {u.isClockedIn && <span className="hensek-badge hensek-badge-green">In</span>}
        </div>
      ),
    },
    {
      key: "menu",
      header: "",
      className: "w-12",
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
              {u.status !== "active" && (
                <button onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: u.id, status: "active" }); }} className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50">Activate</button>
              )}
              {u.status !== "suspended" && (
                <button onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: u.id, status: "suspended" }); }} className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                  <ShieldAlert size={12} /> Suspend
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  const tabs: Filter[] = ["all", "active", "pending", "suspended"];

  return (
    <div className="hensek-page-shell">
      <PageHeader title="Staff" subtitle={`${users.length} total employees`} />

      <div className="hensek-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex bg-hensek-warm rounded-xl p-1 self-start">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors flex items-center gap-1.5",
                  filter === t ? "bg-white text-hensek-dark shadow-sm" : "text-gray-600 hover:text-hensek-dark",
                )}
              >
                {t}
                <span className={cn("text-[10px] rounded-full px-1.5 py-0.5", filter === t ? "bg-hensek-yellow text-hensek-dark" : "bg-white/60 text-gray-500")}>
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or ID…"
              className="hensek-input pl-8 w-full lg:w-64"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(u) => String(u.id)}
          loading={isLoading}
          empty="No staff found"
        />
      </div>

      {openMenu && <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />}
    </div>
  );
}
