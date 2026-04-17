import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { formatDateTime, getStatusColor } from "@/lib/utils";
import { ShieldCheck, Users, UserCheck, LogOut } from "lucide-react";

interface Visitor {
  id: number;
  name: string;
  phone?: string;
  officeDestination: string;
  purpose?: string;
  hostName?: string;
  plateNumber?: string;
  timeIn: string;
  timeOut?: string;
}

interface DashboardStats {
  totalStaff: number;
  clockedInNow: number;
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

export default function SecurityOverview() {
  const { data: visitors = [], isLoading } = useQuery<Visitor[]>({
    queryKey: ["visitors", "today"],
    queryFn: () => apiFetch("/api/visitors/today"),
    refetchInterval: 30000,
  });

  const { data: activeVisitors = [] } = useQuery<Visitor[]>({
    queryKey: ["visitors", "active"],
    queryFn: () => apiFetch("/api/visitors/active"),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => apiFetch("/api/dashboard/stats"),
  });

  if (isLoading)
    return (
      <div className="py-12 flex justify-center">
        <div className="w-7 h-7 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Security Dashboard</h1>
        <p className="text-sm text-gray-500">Real-time security and visitor monitoring</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Users size={18} className="text-hensek-dark" />} label="Visitors Today" value={visitors.length} />
        <StatCard icon={<UserCheck size={18} className="text-green-600" />} label="On-Site Now" value={activeVisitors.length} color="bg-green-50" />
        <StatCard icon={<LogOut size={18} className="text-blue-600" />} label="Checked Out" value={visitors.filter(v => v.timeOut).length} color="bg-blue-50" />
        <StatCard icon={<ShieldCheck size={18} className="text-orange-600" />} label="Staff Clocked In" value={stats?.clockedInNow ?? 0} color="bg-orange-50" />
      </div>

      {/* Active visitors */}
      <div className="hensek-card p-4">
        <h2 className="text-sm font-semibold text-hensek-dark mb-3">Currently On-Site</h2>
        {activeVisitors.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No visitors currently on-site</p>
        ) : (
          <ul className="divide-y divide-border">
            {activeVisitors.map((v) => (
              <li key={v.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hensek-dark">{v.name}</p>
                  <p className="text-xs text-gray-400">{v.officeDestination}{v.hostName ? ` · Host: ${v.hostName}` : ""}</p>
                </div>
                <div className="text-right">
                  <span className="hensek-badge hensek-badge-green text-[10px]">On-Site</span>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(v.timeIn)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Today's log */}
      <div className="hensek-card p-4">
        <h2 className="text-sm font-semibold text-hensek-dark mb-3">Today's Visitor Log</h2>
        {visitors.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No visitors logged today</p>
        ) : (
          <ul className="divide-y divide-border">
            {visitors.slice(0, 10).map((v) => (
              <li key={v.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hensek-dark">{v.name}</p>
                  <p className="text-xs text-gray-400">{v.purpose || "—"} · {v.officeDestination}</p>
                </div>
                <div className="text-right">
                  <span className={`hensek-badge text-[10px] ${v.timeOut ? "hensek-badge-gray" : "hensek-badge-green"}`}>
                    {v.timeOut ? "Out" : "On-Site"}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(v.timeIn)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
