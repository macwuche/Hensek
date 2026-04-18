import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { formatDate, formatMinutes, getStatusColor, capitalize } from "@/lib/utils";
import { Users, Building2, FileText, UserCheck, Clock, TrendingUp } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ChartCard from "@/components/ui/ChartCard";
import MiniDonut from "@/components/ui/MiniDonut";
import EmptyState from "@/components/ui/EmptyState";

interface DashboardStats {
  totalStaff: number;
  activeStaff: number;
  pendingApprovals: number;
  totalDepartments: number;
  clockedInNow: number;
  pendingApplications: number;
  todayAttendanceMinutes: number;
  recentActivity: Array<{ id: number; type: string; description: string; createdAt: string }>;
}

export default function MDOverview() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => apiFetch("/api/dashboard/stats"),
  });

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-7 h-7 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const total = stats?.totalStaff ?? 0;
  const active = stats?.activeStaff ?? 0;
  const clockedIn = stats?.clockedInNow ?? 0;
  const attendanceRate = total > 0 ? Math.round((clockedIn / total) * 100) : 0;
  const avgMinutes = Math.round((stats?.todayAttendanceMinutes ?? 0) / Math.max(clockedIn, 1));

  return (
    <div className="hensek-page-shell">
      <PageHeader
        title="Overview"
        subtitle={`${formatDate(new Date())} — Managing Director Dashboard`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <StatCard
          label="Total Staff"
          value={total}
          hint={`${active} active`}
          icon={<Users size={18} />}
        >
          <div className="flex items-center gap-3 mt-1">
            <MiniDonut value={active} max={Math.max(total, 1)} color="#3B82F6" />
            <div className="text-xs space-y-1 text-gray-600">
              <div>Active: <span className="font-semibold text-hensek-dark">{active}</span></div>
              <div>Other: <span className="font-semibold text-hensek-dark">{total - active}</span></div>
            </div>
          </div>
        </StatCard>

        <StatCard
          label="Attendance"
          value={`${attendanceRate}%`}
          hint={`${clockedIn} clocked in now`}
          icon={<UserCheck size={18} />}
        >
          <div className="flex items-center gap-3 mt-1">
            <MiniDonut value={attendanceRate} max={100} color="#22C55E" />
            <div className="text-xs space-y-1 text-gray-600">
              <div>Clocked: <span className="font-semibold text-hensek-dark">{clockedIn}</span></div>
              <div>Total: <span className="font-semibold text-hensek-dark">{total}</span></div>
            </div>
          </div>
        </StatCard>

        <StatCard
          label="Pending Approvals"
          value={stats?.pendingApprovals ?? 0}
          hint="Awaiting MD review"
          icon={<Clock size={18} />}
        />

        <StatCard
          label="Departments"
          value={stats?.totalDepartments ?? 0}
          hint="Active organisational units"
          icon={<Building2 size={18} />}
        />

        <StatCard
          label="Open Applications"
          value={stats?.pendingApplications ?? 0}
          hint="Across all stages"
          icon={<FileText size={18} />}
        />

        <StatCard
          label="Avg. Hours Today"
          value={formatMinutes(avgMinutes)}
          hint="Per clocked-in staff"
          icon={<TrendingUp size={18} />}
        />
      </div>

      <ChartCard title="Recent Activity" subtitle="Latest events across the organisation">
        {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
          <EmptyState
            icon={<FileText size={20} />}
            title="No recent activity"
            description="Activity from staff, attendance and applications will appear here."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {stats.recentActivity.slice(0, 8).map((item) => (
              <li key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`hensek-badge text-[10px] ${getStatusColor(item.type)}`}>{capitalize(item.type)}</span>
                  <p className="text-sm text-gray-700 truncate">{item.description}</p>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}
