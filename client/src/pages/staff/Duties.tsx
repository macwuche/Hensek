import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { formatDate, getStatusColor } from "@/lib/utils";

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

export default function StaffDuties() {
  const [filter, setFilter] = useState<string>("all");

  const { data: duties = [], isLoading } = useQuery<Duty[]>({
    queryKey: ["duties", "my"],
    queryFn: () => apiFetch("/api/duties/my"),
  });

  const filtered = filter === "all" ? duties : duties.filter((d) => d.status === filter);

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">My Duties</h1>
        <p className="text-sm text-gray-500">All duty assignments assigned to you</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const count = f === "all" ? duties.length : duties.filter((d) => d.status === f).length;
          return (
            <button
              key={f}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? "bg-hensek-dark text-white" : "bg-white border border-border text-gray-600 hover:bg-gray-50"}`}
              onClick={() => setFilter(f)}
            >
              {f.replace(/_/g, " ")} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="hensek-card p-8 text-center">
          <p className="text-sm text-gray-400">No {filter !== "all" ? filter.replace(/_/g, " ") : ""} duties found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <div key={d.id} className="hensek-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-hensek-dark">{d.taskDescription}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <p className="text-xs text-gray-500">{formatDate(d.date)}</p>
                    <p className="text-xs text-gray-500">{d.shiftStart}–{d.shiftEnd}</p>
                    {d.site && <p className="text-xs text-blue-600">{d.site.name}</p>}
                    {d.site?.address && <p className="text-xs text-gray-400">{d.site.address}</p>}
                  </div>
                </div>
                <span className={`hensek-badge text-[10px] shrink-0 ${getStatusColor(d.status)}`}>
                  {d.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
