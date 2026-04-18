import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { getInitials, getStatusColor, capitalize } from "@/lib/utils";
import { Search, Users } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  departmentSlug: string | null;
  status: string;
  employeeId?: string;
  avatarUrl?: string;
  isClockedIn?: boolean;
  isOnline?: boolean;
}

export default function SecurityStaff() {
  const [search, setSearch] = useState("");

  const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/users"),
    refetchInterval: 60000,
  });

  const filtered = useMemo(() => {
    if (!search) return staff;
    const q = search.toLowerCase();
    return staff.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [staff, search]);

  const columns: Column<StaffMember>[] = [
    {
      key: "staff",
      header: "Staff",
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-hensek-yellow/30 flex items-center justify-center text-xs font-bold text-hensek-dark flex-shrink-0">
            {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full rounded-lg object-cover" alt={u.name} /> : getInitials(u.name)}
            {u.isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{u.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "dept",
      header: "Department",
      render: (u) => <span className="text-xs capitalize">{u.departmentSlug || u.role}</span>,
      className: "hidden sm:table-cell",
    },
    {
      key: "status",
      header: "Status",
      render: (u) => <span className={`hensek-badge ${getStatusColor(u.status)}`}>{capitalize(u.status)}</span>,
    },
    {
      key: "clock",
      header: "Clocked In",
      render: (u) =>
        u.isClockedIn ? (
          <span className="hensek-badge hensek-badge-green">In</span>
        ) : (
          <span className="text-gray-400 text-xs">Out</span>
        ),
    },
  ];

  return (
    <div className="hensek-page-shell">
      <PageHeader title="Staff Directory" subtitle="View staff presence and status" />

      <div className="hensek-card">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-xs text-gray-500">{filtered.length} of {staff.length} shown</p>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="hensek-input pl-8 w-full lg:w-64"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(u) => String(u.id)}
          loading={isLoading}
          empty={<EmptyState icon={<Users size={20} />} title="No staff found" />}
        />
      </div>
    </div>
  );
}
