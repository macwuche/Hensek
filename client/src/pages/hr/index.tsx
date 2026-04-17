import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { formatDate, getStatusColor, capitalize } from "@/lib/utils";
import { Users, FileText, UserCheck, Bell } from "lucide-react";

interface DashboardStats {
  totalStaff: number;
  activeStaff: number;
  pendingApprovals: number;
  pendingApplications: number;
  clockedInNow: number;
  recentActivity: Array<{ id: number; type: string; description: string; createdAt: string }>;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color?: string }) {
  return (
    <div className="hensek-stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color || "bg-hensek-yellow/20"}`}>{icon}</div>
      <p className="text-2xl font-bold text-hensek-dark">{value}</p>
      <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
    </div>
  );
}

export default function HROverview() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => apiFetch("/api/dashboard/stats"),
  });

  if (isLoading) return (
    <div className="py-12 flex justify-center">
      <div className="w-7 h-7 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">HR Dashboard</h1>
        <p className="text-sm text-gray-500">{formatDate(new Date())} — Human Resources</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18} className="text-hensek-dark" />} label="Total Staff" value={stats?.totalStaff ?? 0} />
        <StatCard icon={<UserCheck size={18} className="text-green-600" />} label="Pending Approvals" value={stats?.pendingApprovals ?? 0} color="bg-green-50" />
        <StatCard icon={<FileText size={18} className="text-blue-600" />} label="Open Applications" value={stats?.pendingApplications ?? 0} color="bg-blue-50" />
        <StatCard icon={<Bell size={18} className="text-orange-500" />} label="Clocked In Now" value={stats?.clockedInNow ?? 0} color="bg-orange-50" />
      </div>

      <div className="hensek-card p-4">
        <h2 className="text-sm font-semibold text-hensek-dark mb-3">Recent Activity</h2>
        {(!stats?.recentActivity || stats.recentActivity.length === 0) ? (
          <p className="text-sm text-gray-400 py-4 text-center">No recent activity</p>
        ) : (
          <ul className="divide-y divide-border">
            {stats.recentActivity.slice(0, 8).map((item) => (
              <li key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`hensek-badge text-[10px] ${getStatusColor(item.type)}`}>{capitalize(item.type)}</span>
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
