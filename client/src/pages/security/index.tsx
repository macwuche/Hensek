import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/utils";
import { ShieldCheck, Users, UserCheck, LogOut } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ChartCard from "@/components/ui/ChartCard";
import DataTable, { Column } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";

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

  const checkedOut = visitors.filter((v) => v.timeOut).length;

  const activeCols: Column<Visitor>[] = [
    {
      key: "visitor",
      header: "Visitor",
      render: (v) => (
        <div className="min-w-0">
          <p className="font-medium text-sm text-hensek-dark truncate">{v.name}</p>
          <p className="text-[10px] text-gray-400 truncate">
            {v.officeDestination}
            {v.hostName ? ` · Host: ${v.hostName}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: () => <span className="hensek-badge hensek-badge-green">On-Site</span>,
      className: "hidden sm:table-cell",
    },
    {
      key: "time",
      header: "Time In",
      render: (v) => <span className="text-xs text-gray-500">{formatDateTime(v.timeIn)}</span>,
      className: "text-right",
    },
  ];

  const logCols: Column<Visitor>[] = [
    {
      key: "visitor",
      header: "Visitor",
      render: (v) => (
        <div className="min-w-0">
          <p className="font-medium text-sm text-hensek-dark truncate">{v.name}</p>
          <p className="text-[10px] text-gray-400 truncate">{v.purpose || "—"} · {v.officeDestination}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (v) => (
        <span className={`hensek-badge ${v.timeOut ? "hensek-badge-gray" : "hensek-badge-green"}`}>
          {v.timeOut ? "Out" : "On-Site"}
        </span>
      ),
      className: "hidden sm:table-cell",
    },
    {
      key: "time",
      header: "Time In",
      render: (v) => <span className="text-xs text-gray-500">{formatDateTime(v.timeIn)}</span>,
      className: "text-right",
    },
  ];

  return (
    <div className="hensek-page-shell">
      <PageHeader title="Security Dashboard" subtitle="Real-time security and visitor monitoring" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Visitors Today" value={visitors.length} icon={<Users size={18} />} />
        <StatCard label="On-Site Now" value={activeVisitors.length} icon={<UserCheck size={18} />} />
        <StatCard label="Checked Out" value={checkedOut} icon={<LogOut size={18} />} />
        <StatCard label="Staff Clocked In" value={stats?.clockedInNow ?? 0} icon={<ShieldCheck size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Currently On-Site" subtitle={`${activeVisitors.length} visitors`}>
          <DataTable
            columns={activeCols}
            rows={activeVisitors}
            rowKey={(v) => String(v.id)}
            loading={isLoading}
            empty={<EmptyState icon={<UserCheck size={20} />} title="No visitors on-site" description="Active visitors will appear here as they sign in." />}
          />
        </ChartCard>

        <ChartCard title="Today's Visitor Log" subtitle={`${visitors.length} entries`}>
          <DataTable
            columns={logCols}
            rows={visitors.slice(0, 10)}
            rowKey={(v) => String(v.id)}
            loading={isLoading}
            empty={<EmptyState icon={<Users size={20} />} title="No visitors logged today" />}
          />
        </ChartCard>
      </div>
    </div>
  );
}
