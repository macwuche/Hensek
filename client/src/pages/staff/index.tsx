import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatTime, formatMinutes, getStatusColor } from "@/lib/utils";
import { Clock, HardHat, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: number;
  clockIn: string;
  clockOut?: string;
  totalMinutes?: number;
  isOvertime: boolean;
  breakStart?: string;
  breakEnd?: string;
}

interface Duty {
  id: number;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  taskDescription: string;
  status: string;
  site?: { id: number; name: string } | null;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <div className="hensek-stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color || "bg-hensek-yellow/20"}`}>{icon}</div>
      <p className="text-2xl font-bold text-hensek-dark">{value}</p>
      <p className="text-xs font-medium text-gray-600 mt-0.5">{label}</p>
    </div>
  );
}

export default function StaffOverview() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: todayRecord } = useQuery<AttendanceRecord | null>({
    queryKey: ["attendance", "today"],
    queryFn: () => apiFetch("/api/attendance/today"),
    refetchInterval: 60000,
  });

  const { data: duties = [] } = useQuery<Duty[]>({
    queryKey: ["duties", "my"],
    queryFn: () => apiFetch("/api/duties/my"),
  });

  const clockInMutation = useMutation({
    mutationFn: () => apiPost("/api/attendance/clock-in", {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance", "today"] }); qc.invalidateQueries({ queryKey: ["auth", "me"] }); toast.success("Clocked in!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => apiPost("/api/attendance/clock-out", {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance", "today"] }); qc.invalidateQueries({ queryKey: ["auth", "me"] }); toast.success("Clocked out"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const today = new Date().toISOString().split("T")[0];
  const todayDuties = duties.filter((d) => d.date === today);

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Welcome, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-gray-500">{formatDate(new Date())} · {user?.departmentSlug || "Staff"}</p>
      </div>

      {/* Clock in/out card */}
      <div className="hensek-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-hensek-dark">Today's Attendance</p>
            {todayRecord ? (
              <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                <p>Clock In: <span className="font-medium text-hensek-dark">{formatTime(todayRecord.clockIn)}</span></p>
                {todayRecord.clockOut && <p>Clock Out: <span className="font-medium text-hensek-dark">{formatTime(todayRecord.clockOut)}</span></p>}
                {todayRecord.totalMinutes && <p>Duration: <span className="font-medium text-hensek-dark">{formatMinutes(todayRecord.totalMinutes)}</span></p>}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Not clocked in today</p>
            )}
          </div>
          <div>
            {!user?.isClockedIn ? (
              <button
                className="hensek-btn-primary flex items-center gap-1.5"
                onClick={() => clockInMutation.mutate()}
                disabled={clockInMutation.isPending || !!todayRecord?.clockOut}
              >
                <Clock size={15} />
                {clockInMutation.isPending ? "…" : "Clock In"}
              </button>
            ) : (
              <button
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                onClick={() => clockOutMutation.mutate()}
                disabled={clockOutMutation.isPending}
              >
                <Clock size={15} />
                {clockOutMutation.isPending ? "…" : "Clock Out"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<HardHat size={18} className="text-orange-600" />} label="Today's Duties" value={todayDuties.length} color="bg-orange-50" />
        <StatCard icon={<CheckCircle2 size={18} className="text-green-600" />} label="Completed" value={todayDuties.filter(d => d.status === "completed").length} color="bg-green-50" />
        <StatCard icon={<FileText size={18} className="text-blue-600" />} label="Total Duties" value={duties.length} color="bg-blue-50" />
        <StatCard icon={<Clock size={18} className="text-hensek-dark" />} label="Status" value={user?.isClockedIn ? "In" : "Out"} color={user?.isClockedIn ? "bg-green-50" : "bg-gray-50"} />
      </div>

      {/* Today's duties */}
      {todayDuties.length > 0 && (
        <div className="hensek-card p-4">
          <h2 className="text-sm font-semibold text-hensek-dark mb-3">Today's Duties</h2>
          <ul className="divide-y divide-border">
            {todayDuties.map((d) => (
              <li key={d.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hensek-dark">{d.taskDescription}</p>
                  <p className="text-xs text-gray-400">{d.site?.name || "—"} · {d.shiftStart}–{d.shiftEnd}</p>
                </div>
                <span className={`hensek-badge text-[10px] ${getStatusColor(d.status)}`}>{d.status.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
