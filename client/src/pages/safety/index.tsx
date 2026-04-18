import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { getStatusColor } from "@/lib/utils";
import { HardHat, MapPin, Users, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ChartCard from "@/components/ui/ChartCard";
import MiniDonut from "@/components/ui/MiniDonut";
import EmptyState from "@/components/ui/EmptyState";

interface DashboardStats {
  totalStaff: number;
  clockedInNow: number;
  activeSites: number;
  todayDuties: number;
  completedDuties: number;
  missedDuties: number;
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

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-7 h-7 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completed = duties.filter((d: any) => d.status === "completed").length;
  const inProgress = duties.filter((d: any) => d.status === "in_progress").length;
  const missed = duties.filter((d: any) => d.status === "missed").length;
  const completionRate = duties.length > 0 ? Math.round((completed / duties.length) * 100) : 0;

  return (
    <div className="hensek-page-shell">
      <PageHeader title="Safety Dashboard" subtitle="Monitor staff, sites and duty execution" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <StatCard label="Clocked In Now" value={stats?.clockedInNow ?? 0} hint={`${stats?.totalStaff ?? 0} total staff`} icon={<Users size={18} />}>
          <div className="flex items-center gap-3 mt-1">
            <MiniDonut value={stats?.clockedInNow ?? 0} max={Math.max(stats?.totalStaff ?? 1, 1)} color="#22C55E" />
            <div className="text-xs space-y-1 text-gray-600">
              <div>Active Sites: <span className="font-semibold text-hensek-dark">{stats?.activeSites ?? 0}</span></div>
              <div>Total: <span className="font-semibold text-hensek-dark">{stats?.totalStaff ?? 0}</span></div>
            </div>
          </div>
        </StatCard>

        <StatCard label="Today's Duties" value={duties.length} hint={`${completed} completed`} icon={<HardHat size={18} />}>
          <div className="flex items-center gap-3 mt-1">
            <MiniDonut value={completionRate} max={100} color="#EAB308" />
            <div className="text-xs space-y-1 text-gray-600">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /><span>Completed · {completed}</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /><span>In progress · {inProgress}</span></div>
            </div>
          </div>
        </StatCard>

        <StatCard label="Active Sites" value={stats?.activeSites ?? 0} hint={`${missed} missed duties`} icon={<MapPin size={18} />}>
          <div className="flex items-center gap-3 mt-1">
            <MiniDonut value={duties.length - missed} max={Math.max(duties.length, 1)} color="#3B82F6" />
            <div className="text-xs space-y-1 text-gray-600">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /><span>Missed · {missed}</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /><span>On track · {duties.length - missed}</span></div>
            </div>
          </div>
        </StatCard>
      </div>

      <ChartCard title="Today's Duty Assignments" subtitle="Latest duties scheduled for today">
        {duties.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle size={20} />}
            title="No duties assigned"
            description="No duties have been assigned for today yet."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {duties.slice(0, 8).map((d: any) => (
              <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-hensek-yellow/15 flex items-center justify-center text-hensek-dark flex-shrink-0">
                    {d.status === "completed" ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hensek-dark truncate">{d.user?.name || d.staffName || `Staff #${d.userId}`}</p>
                    <p className="text-xs text-gray-500 truncate">{d.site?.name || d.siteName || `Site #${d.siteId}`} · {d.shiftStart}–{d.shiftEnd}</p>
                  </div>
                </div>
                <span className={`hensek-badge ${getStatusColor(d.status)}`}>{d.status.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}
