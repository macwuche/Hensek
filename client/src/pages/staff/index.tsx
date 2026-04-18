import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatTime, formatMinutes, getStatusColor, capitalize } from "@/lib/utils";
import { Clock, HardHat, FileText, CheckCircle2, MapPin } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ChartCard from "@/components/ui/ChartCard";
import EmptyState from "@/components/ui/EmptyState";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance", "today"] });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Clocked in!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => apiPost("/api/attendance/clock-out", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance", "today"] });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Clocked out");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const today = new Date().toISOString().split("T")[0];
  const todayDuties = duties.filter((d) => d.date === today);
  const completed = todayDuties.filter((d) => d.status === "completed").length;

  return (
    <div className="hensek-page-shell">
      <PageHeader
        title={`Welcome, ${user?.name?.split(" ")[0] ?? ""}`}
        subtitle={`${formatDate(new Date())} · ${capitalize(user?.departmentSlug || "Staff")}`}
        actions={
          !user?.isClockedIn ? (
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
              className="hensek-btn-danger flex items-center gap-1.5"
              onClick={() => clockOutMutation.mutate()}
              disabled={clockOutMutation.isPending}
            >
              <Clock size={15} />
              {clockOutMutation.isPending ? "…" : "Clock Out"}
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Today's Duties"
          value={todayDuties.length}
          hint={`${completed} completed`}
          icon={<HardHat size={18} />}
        />
        <StatCard
          label="Completed"
          value={completed}
          hint={`of ${todayDuties.length} today`}
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          label="Total Duties"
          value={duties.length}
          hint="all time assignments"
          icon={<FileText size={18} />}
        />
        <StatCard
          label="Status"
          value={user?.isClockedIn ? "Clocked In" : "Clocked Out"}
          hint={todayRecord?.totalMinutes ? formatMinutes(todayRecord.totalMinutes) : "Not clocked in today"}
          icon={<Clock size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Today's Attendance" subtitle="Your clock-in record for today" className="lg:col-span-1">
          {todayRecord ? (
            <ul className="space-y-2.5 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-500">Clock In</span>
                <span className="font-medium text-hensek-dark">{formatTime(todayRecord.clockIn)}</span>
              </li>
              {todayRecord.clockOut && (
                <li className="flex justify-between">
                  <span className="text-gray-500">Clock Out</span>
                  <span className="font-medium text-hensek-dark">{formatTime(todayRecord.clockOut)}</span>
                </li>
              )}
              {todayRecord.totalMinutes != null && (
                <li className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium text-hensek-dark">{formatMinutes(todayRecord.totalMinutes)}</span>
                </li>
              )}
              {todayRecord.isOvertime && (
                <li className="flex justify-between">
                  <span className="text-gray-500">Overtime</span>
                  <span className="hensek-badge hensek-badge-yellow">Yes</span>
                </li>
              )}
            </ul>
          ) : (
            <EmptyState
              icon={<Clock size={18} />}
              title="Not clocked in"
              description="Use the Clock In button above to start your shift."
            />
          )}
        </ChartCard>

        <ChartCard title="Today's Duties" subtitle="Scheduled tasks for today" className="lg:col-span-2">
          {todayDuties.length === 0 ? (
            <EmptyState
              icon={<HardHat size={18} />}
              title="No duties scheduled"
              description="You have no assigned duties for today."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {todayDuties.map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hensek-dark truncate">{d.taskDescription}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      {d.site?.name && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {d.site.name}
                        </span>
                      )}
                      <span>{d.shiftStart}–{d.shiftEnd}</span>
                    </p>
                  </div>
                  <span className={`hensek-badge ${getStatusColor(d.status)}`}>
                    {capitalize(d.status.replace(/_/g, " "))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
