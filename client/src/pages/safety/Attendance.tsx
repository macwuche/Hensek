import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { formatDate, formatTime, formatMinutes } from "@/lib/utils";
import { Clock } from "lucide-react";

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

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Attendance Overview</h1>
        <p className="text-sm text-gray-500">Monitor staff clock-in and clock-out records</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="hensek-stat-card">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-2">
            <Clock size={16} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-hensek-dark">{stats?.currentlyClockedIn ?? "—"}</p>
          <p className="text-xs text-gray-500">Currently In</p>
        </div>
        <div className="hensek-stat-card">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
            <Clock size={16} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-hensek-dark">{stats?.clockedInToday ?? "—"}</p>
          <p className="text-xs text-gray-500">Today's Records</p>
        </div>
        <div className="hensek-stat-card">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center mb-2">
            <Clock size={16} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-hensek-dark">{stats?.overtimeToday ?? "—"}</p>
          <p className="text-xs text-gray-500">Overtime Today</p>
        </div>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">View date:</label>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="hensek-input text-sm py-1.5 w-40"
        />
        <span className="text-sm text-gray-400">{records.length} records</span>
      </div>

      <div className="hensek-card overflow-x-auto">
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No attendance records for {dateFilter}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Dept</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Clock In</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Clock Out</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-hensek-dark">{r.userName || `Staff #${r.userId}`}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{r.departmentSlug || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{formatTime(r.clockIn)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.clockOut ? (
                      formatTime(r.clockOut)
                    ) : (
                      <span className="hensek-badge hensek-badge-green text-[10px]">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {r.totalMinutes ? formatMinutes(r.totalMinutes) : "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {r.isOvertime ? (
                      <span className="text-orange-600 font-medium">+{formatMinutes(r.overtimeMinutes || 0)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
