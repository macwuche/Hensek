import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { formatDate, getStatusColor, capitalize, cn } from "@/lib/utils";
import { HardHat, MapPin } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";

interface Duty {
  id: number;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  taskDescription: string;
  status: string;
  site?: { id: number; name: string; address?: string } | null;
}

const STATUS_FILTERS = ["all", "assigned", "in_progress", "completed", "missed"] as const;
type Filter = typeof STATUS_FILTERS[number];

export default function StaffDuties() {
  const [filter, setFilter] = useState<Filter>("all");

  const { data: duties = [], isLoading } = useQuery<Duty[]>({
    queryKey: ["duties", "my"],
    queryFn: () => apiFetch("/api/duties/my"),
  });

  const filtered = useMemo(
    () => (filter === "all" ? duties : duties.filter((d) => d.status === filter)),
    [duties, filter],
  );

  const columns: Column<Duty>[] = [
    {
      key: "task",
      header: "Task",
      render: (d) => (
        <div className="min-w-0">
          <p className="font-medium text-sm text-hensek-dark truncate">{d.taskDescription}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {formatDate(d.date)} · {d.shiftStart}–{d.shiftEnd}
          </p>
        </div>
      ),
    },
    {
      key: "site",
      header: "Site",
      render: (d) =>
        d.site ? (
          <div className="text-xs">
            <p className="text-hensek-dark flex items-center gap-1">
              <MapPin size={11} /> {d.site.name}
            </p>
            {d.site.address && <p className="text-gray-400 truncate">{d.site.address}</p>}
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      className: "hidden md:table-cell",
    },
    {
      key: "status",
      header: "Status",
      render: (d) => (
        <span className={`hensek-badge ${getStatusColor(d.status)}`}>
          {capitalize(d.status.replace(/_/g, " "))}
        </span>
      ),
    },
  ];

  return (
    <div className="hensek-page-shell">
      <PageHeader title="My Duties" subtitle="All duty assignments assigned to you" />

      <div className="hensek-card">
        <div className="flex flex-wrap gap-1 mb-4">
          {STATUS_FILTERS.map((f) => {
            const count = f === "all" ? duties.length : duties.filter((d) => d.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 capitalize",
                  filter === f
                    ? "bg-hensek-dark text-white"
                    : "bg-hensek-warm text-gray-600 hover:bg-hensek-warm/70",
                )}
              >
                {f.replace(/_/g, " ")}
                <span
                  className={cn(
                    "text-[10px] rounded-full px-1.5 py-0.5",
                    filter === f ? "bg-hensek-yellow text-hensek-dark" : "bg-white/60 text-gray-500",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(d) => String(d.id)}
          loading={isLoading}
          empty={
            <div className="flex flex-col items-center gap-2">
              <HardHat size={20} className="text-gray-300" />
              <span>No duties in this view</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
