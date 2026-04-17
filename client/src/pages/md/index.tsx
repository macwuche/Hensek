import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { formatDate, formatMinutes, getStatusColor } from "@/lib/utils";
import { Users, Building2, FileText, UserCheck, Clock, TrendingUp } from "lucide-react";

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

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="hensek-stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color || "bg-hensek-yellow/20"}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-hensek-dark">{value}</p>
      <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
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

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Overview</h1>
        <p className="text-sm text-gray-500">{formatDate(new Date())} — Managing Director Dashboard</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard icon={<Users size={18} className="text-hensek-dark" />} label="Total Staff" value={stats?.totalStaff ?? 0} sub={`${stats?.activeStaff ?? 0} active`} />
        <StatCard icon={<UserCheck size={18} className="text-green-600" />} label="Clocked In Now" value={stats?.clockedInNow ?? 0} color="bg-green-50" />
        <StatCard icon={<Clock size={18} className="text-blue-600" />} label="Pending Approvals" value={stats?.pendingApprovals ?? 0} color="bg-blue-50" />
        <StatCard icon={<Building2 size={18} className="text-purple-600" />} label="Departments" value={stats?.totalDepartments ?? 0} color="bg-purple-50" />
        <StatCard icon={<FileText size={18} className="text-orange-600" />} label="Open Applications" value={stats?.pendingApplications ?? 0} color="bg-orange-50" />
        <StatCard icon={<TrendingUp size={18} className="text-hensek-dark" />} label="Avg. Hours Today" value={formatMinutes(Math.round((stats?.todayAttendanceMinutes ?? 0) / Math.max(stats?.clockedInNow ?? 1, 1)))} />
      </div>

      {/* Recent Activity */}
      <div className="hensek-card p-4">
        <h2 className="text-sm font-semibold text-hensek-dark mb-3">Recent Activity</h2>
        {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
          <p className="text-sm text-gray-400 py-4 text-center">No recent activity</p>
        ) : (
          <ul className="divide-y divide-border">
            {stats.recentActivity.slice(0, 8).map((item) => (
              <li key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`hensek-badge text-[10px] ${getStatusColor(item.type)}`}>{item.type}</span>
                  <p className="text-sm text-gray-700">{item.description}</p>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
