import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { formatDate, formatMinutes, getStatusColor } from "@/lib/utils";
import { HardHat, MapPin, Users, Clock, CheckCircle2 } from "lucide-react";

interface DashboardStats {
  totalStaff: number;
  clockedInNow: number;
  activeSites: number;
  todayDuties: number;
  completedDuties: number;
  missedDuties: number;
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

export default function SafetyOverview() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => apiFetch("/api/dashboard/stats"),
  });

  const { data: duties = [] } = useQuery<any[]>({
    queryKey: ["duties", "today"],
    queryFn: () => apiFetch("/api/duties?date=" + new Date().toISOString().split("T")[0]),
  });

  if (isLoading) return (
    <div className="py-12 flex justify-center">
      <div className="w-7 h-7 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Safety Dashboard</h1>
        <p className="text-sm text-gray-500">{formatDate(new Date())} — Safety Department</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard icon={<Users size={18} className="text-hensek-dark" />} label="Clocked In Now" value={stats?.clockedInNow ?? 0} />
        <StatCard icon={<MapPin size={18} className="text-blue-600" />} label="Active Sites" value={stats?.activeSites ?? 0} color="bg-blue-50" />
        <StatCard icon={<HardHat size={18} className="text-orange-600" />} label="Today's Duties" value={duties.length} color="bg-orange-50" />
        <StatCard icon={<CheckCircle2 size={18} className="text-green-600" />} label="Completed" value={duties.filter((d: any) => d.status === "completed").length} color="bg-green-50" />
        <StatCard icon={<Clock size={18} className="text-yellow-600" />} label="In Progress" value={duties.filter((d: any) => d.status === "in_progress").length} color="bg-yellow-50" />
        <StatCard icon={<Clock size={18} className="text-red-500" />} label="Missed" value={duties.filter((d: any) => d.status === "missed").length} color="bg-red-50" />
      </div>

      {/* Today's duties summary */}
      <div className="hensek-card p-4">
        <h2 className="text-sm font-semibold text-hensek-dark mb-3">Today's Duty Assignments</h2>
        {duties.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No duties assigned for today</p>
        ) : (
          <ul className="divide-y divide-border">
            {duties.slice(0, 8).map((d: any) => (
              <li key={d.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hensek-dark">{d.staffName || `Staff #${d.userId}`}</p>
                  <p className="text-xs text-gray-400">{d.siteName || `Site #${d.siteId}`} · {d.shiftStart}–{d.shiftEnd}</p>
                </div>
                <span className={`hensek-badge text-[10px] ${getStatusColor(d.status)}`}>{d.status.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
