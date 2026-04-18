import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { getInitials, getStatusColor, capitalize } from "@/lib/utils";
import { Users, FileText, UserCheck, Search, Briefcase } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ChartCard from "@/components/ui/ChartCard";
import MiniDonut from "@/components/ui/MiniDonut";
import RatingsBars from "@/components/ui/RatingsBars";
import DataTable, { Column } from "@/components/ui/DataTable";

interface DashboardStats {
  totalStaff: number;
  activeStaff: number;
  pendingApprovals: number;
  pendingApplications: number;
  clockedInNow: number;
}

interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: string;
  departmentSlug: string | null;
  status: string;
  employeeId: string;
  isOnline: boolean;
  avatarUrl?: string;
}

const ATTENDANCE_TREND = [
  { month: "Jan", clockIns: 412 },
  { month: "Feb", clockIns: 438 },
  { month: "Mar", clockIns: 461 },
  { month: "Apr", clockIns: 449 },
  { month: "May", clockIns: 478 },
  { month: "Jun", clockIns: 502 },
  { month: "Jul", clockIns: 491 },
  { month: "Aug", clockIns: 515 },
  { month: "Sep", clockIns: 530 },
  { month: "Oct", clockIns: 548 },
  { month: "Nov", clockIns: 561 },
  { month: "Dec", clockIns: 589 },
];

const PERFORMANCE_RATINGS = [
  { label: "Productivity", value: 86, color: "#EAB308" },
  { label: "Punctuality", value: 92, color: "#22C55E" },
  { label: "Quality of Work", value: 78, color: "#3B82F6" },
  { label: "Collaboration", value: 81, color: "#8B5CF6" },
  { label: "Initiative", value: 74, color: "#F97316" },
];

export default function HROverview() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => apiFetch("/api/dashboard/stats"),
  });

  const { data: users = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/users"),
  });

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.employeeId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [users, statusFilter, roleFilter, search]);

  const total = stats?.totalStaff ?? users.length;
  const active = stats?.activeStaff ?? users.filter((u) => u.status === "active").length;
  const attendanceRate = total > 0 ? Math.round(((stats?.clockedInNow ?? 0) / total) * 100) : 0;
  const openApps = stats?.pendingApplications ?? 0;
  const openJobsTotal = openApps + (stats?.pendingApprovals ?? 0);

  const columns: Column<StaffUser>[] = [
    {
      key: "name",
      header: "Employee",
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
    { key: "id", header: "Employee ID", render: (u) => <span className="text-xs text-gray-500">{u.employeeId}</span>, className: "hidden md:table-cell" },
    { key: "role", header: "Role", render: (u) => <span className="text-xs capitalize">{u.departmentSlug || u.role}</span>, className: "hidden sm:table-cell" },
    {
      key: "status",
      header: "Status",
      render: (u) => <span className={`hensek-badge ${getStatusColor(u.status)}`}>{capitalize(u.status)}</span>,
    },
  ];

  return (
    <div className="hensek-page-shell">
      <PageHeader title="HR Dashboard" subtitle="Overview of your workforce, jobs and performance" />

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <StatCard label="Jobs Overview" value={openJobsTotal} hint={`${openApps} pending applications`} icon={<Briefcase size={18} />}>
          <div className="flex items-center gap-3 mt-1">
            <MiniDonut value={openApps} max={Math.max(openJobsTotal, 1)} color="#EAB308" />
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-hensek-yellow" /><span className="text-gray-600">Open · {openApps}</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-hensek-warm" /><span className="text-gray-600">Approvals · {stats?.pendingApprovals ?? 0}</span></div>
            </div>
          </div>
        </StatCard>

        <StatCard label="Attendance Rate" value={`${attendanceRate}%`} hint={`${stats?.clockedInNow ?? 0} clocked in now`} icon={<UserCheck size={18} />}>
          <div className="flex items-center gap-3 mt-1">
            <MiniDonut value={attendanceRate} max={100} color="#22C55E" />
            <div className="text-xs space-y-1 text-gray-600">
              <div>Active: <span className="font-semibold text-hensek-dark">{active}</span></div>
              <div>Total: <span className="font-semibold text-hensek-dark">{total}</span></div>
            </div>
          </div>
        </StatCard>

        <StatCard label="Total Employees" value={total} hint={`${active} active · ${total - active} other`} icon={<Users size={18} />}>
          <div className="flex items-center gap-3 mt-1">
            <MiniDonut value={active} max={Math.max(total, 1)} color="#3B82F6" />
            <div className="text-xs space-y-1 text-gray-600">
              <div>Pending: <span className="font-semibold text-hensek-dark">{stats?.pendingApprovals ?? 0}</span></div>
              <div>Applications: <span className="font-semibold text-hensek-dark">{openApps}</span></div>
            </div>
          </div>
        </StatCard>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <ChartCard title="Attendance Trend" subtitle="Clock-ins per month" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ATTENDANCE_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClockIns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EAB308" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F0E2" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #F3F0E2", fontSize: 12 }}
                  labelStyle={{ color: "#1C1917", fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="clockIns" stroke="#EAB308" strokeWidth={2.5} fill="url(#colorClockIns)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Performance Ratings" subtitle="Aggregated team scores">
          <RatingsBars items={PERFORMANCE_RATINGS} />
        </ChartCard>
      </div>

      {/* Employees list */}
      <div className="hensek-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-hensek-dark">Employees List</h3>
            <p className="text-xs text-gray-500 mt-0.5">{filtered.length} of {users.length} shown</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="hensek-input pl-8 w-56"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="hensek-input w-32">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="hensek-input w-32">
              <option value="all">All Roles</option>
              <option value="staff">Staff</option>
              <option value="hr">HR</option>
              <option value="md">MD</option>
              <option value="safety">Safety</option>
              <option value="security">Security</option>
            </select>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(u) => String(u.id)}
          loading={isLoading}
          empty={
            <div className="flex flex-col items-center gap-2">
              <FileText size={20} className="text-gray-300" />
              <span>No employees match the filters</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
