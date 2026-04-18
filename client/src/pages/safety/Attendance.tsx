import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { formatTime, formatMinutes } from "@/lib/utils";
import { Clock, Users, Timer, UserCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import DataTable, { Column } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";

interface AttendanceRecord {
  id: number;
  userId: number;
  userName?: string;
  departmentSlug?: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalMinutes?: number;
  isOvertime: boolean;
  overtimeMinutes?: number;
}

export default function SafetyAttendance() {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const { data: records = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "all", dateFilter],
    queryFn: () => apiFetch(`/api/attendance/all?date=${dateFilter}`),
  });

  const { data: stats } = useQuery<{ clockedInToday: number; currentlyClockedIn: number; overtimeToday: number }>({
    queryKey: ["attendance", "stats"],
    queryFn: () => apiFetch("/api/attendance/stats"),
    refetchInterval: 60000,
  });

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "staff",
      header: "Staff",
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-sm text-hensek-dark truncate">{r.userName || `Staff #${r.userId}`}</p>
          <p className="text-[10px] text-gray-400 capitalize truncate">{r.departmentSlug || "—"}</p>
        </div>
      ),
    },
    {
      key: "in",
      header: "Clock In",
      render: (r) => <span className="text-xs text-gray-600">{formatTime(r.clockIn)}</span>,
    },
    {
      key: "out",
      header: "Clock Out",
      render: (r) =>
        r.clockOut ? (
          <span className="text-xs text-gray-600">{formatTime(r.clockOut)}</span>
        ) : (
          <span className="hensek-badge hensek-badge-green">Active</span>
        ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (r) => <span className="text-xs text-gray-600">{r.totalMinutes ? formatMinutes(r.totalMinutes) : "—"}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "ot",
      header: "Overtime",
      render: (r) =>
        r.isOvertime ? (
          <span className="text-xs text-orange-600 font-medium">+{formatMinutes(r.overtimeMinutes || 0)}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      className: "hidden md:table-cell",
    },
  ];

  return (
    <div className="hensek-page-shell">
      <PageHeader title="Attendance Overview" subtitle="Monitor staff clock-in and clock-out records" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Currently In" value={stats?.currentlyClockedIn ?? "—"} icon={<UserCheck size={18} />} />
        <StatCard label="Today's Records" value={stats?.clockedInToday ?? "—"} icon={<Users size={18} />} />
        <StatCard label="Overtime Today" value={stats?.overtimeToday ?? "—"} icon={<Timer size={18} />} />
      </div>

      <div className="hensek-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="hensek-input w-40"
            />
          </div>
          <span className="text-xs text-gray-500">{records.length} records</span>
        </div>

        <DataTable
          columns={columns}
          rows={records}
          rowKey={(r) => String(r.id)}
          loading={isLoading}
          empty={
            <EmptyState
              icon={<Clock size={20} />}
              title={`No attendance for ${dateFilter}`}
              description="No staff have clocked in on this date."
            />
          }
        />
      </div>
    </div>
  );
}
