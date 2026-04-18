import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/utils";
import { FileText, Mail, Download } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";
import EmptyState from "@/components/ui/EmptyState";

interface SafetyReport {
  id: number;
  type: "weekly" | "monthly";
  period: string;
  createdAt: string;
  emailSentAt?: string;
  staffOnDutyCount?: number;
  activeSitesCount?: number;
  incidentsCount?: number;
}

export default function SafetyReports() {
  const qc = useQueryClient();
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: reports = [] } = useQuery<SafetyReport[]>({
    queryKey: ["reports", "safety"],
    queryFn: () => apiFetch("/api/reports/safety"),
  });

  const generateMutation = useMutation({
    mutationFn: (type: "weekly" | "monthly") =>
      apiPost("/api/reports/safety/generate", { type, from: fromDate, to: toDate }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports", "safety"] });
      toast.success("Safety report generated and emailed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="hensek-page-shell">
      <PageHeader title="Safety Reports" subtitle="Generate and download department safety reports" />

      <ChartCard title="Generate New Report" subtitle="Reports are emailed to the Safety department" className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">From</label>
            <input type="date" className="hensek-input w-40" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">To</label>
            <input type="date" className="hensek-input w-40" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button
              className="hensek-btn-primary flex items-center gap-1.5"
              onClick={() => generateMutation.mutate("weekly")}
              disabled={generateMutation.isPending}
            >
              <FileText size={14} />
              {generateMutation.isPending ? "Generating…" : "Weekly"}
            </button>
            <button
              className="hensek-btn-outline flex items-center gap-1.5"
              onClick={() => generateMutation.mutate("monthly")}
              disabled={generateMutation.isPending}
            >
              <FileText size={14} /> Monthly
            </button>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Report History" subtitle={`${reports.length} reports`}>
        {reports.length === 0 ? (
          <EmptyState
            icon={<FileText size={20} />}
            title="No reports yet"
            description="Generate your first weekly or monthly safety report above."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {reports.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-hensek-yellow/15 flex items-center justify-center text-hensek-dark flex-shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hensek-dark capitalize truncate">{r.type} Safety Report</p>
                    <p className="text-[10px] text-gray-400 truncate">{r.period} · {formatDateTime(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {r.emailSentAt && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-green-600">
                      <Mail size={12} /> Sent
                    </span>
                  )}
                  <a
                    href={`/api/reports/safety/${r.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-hensek-dark hover:text-hensek-yellow"
                  >
                    <Download size={12} /> PDF
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}
