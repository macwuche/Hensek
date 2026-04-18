import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { FileText, Download, Mail } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";
import EmptyState from "@/components/ui/EmptyState";

interface ReportRow {
  id: number;
  type: string;
  period: string;
  createdAt: string;
  emailSentAt?: string | null;
}

export default function MDReports() {
  const { data: safetyReports = [] } = useQuery<ReportRow[]>({
    queryKey: ["reports", "safety"],
    queryFn: () => apiFetch("/api/reports/safety"),
  });

  const { data: securityReports = [] } = useQuery<ReportRow[]>({
    queryKey: ["reports", "security"],
    queryFn: () => apiFetch("/api/reports/security"),
  });

  const generateSafety = useMutation({
    mutationFn: (type: "weekly" | "monthly") => apiPost("/api/reports/safety/generate", { type }),
    onSuccess: () => toast.success("Safety report generated and emailed"),
    onError: (e: Error) => toast.error(e.message),
  });

  const generateSecurity = useMutation({
    mutationFn: (type: "weekly" | "monthly") => apiPost("/api/reports/security/generate", { type }),
    onSuccess: () => toast.success("Security report generated and emailed"),
    onError: (e: Error) => toast.error(e.message),
  });

  type HistoryRow = ReportRow & { dept: "Safety" | "Security" };

  const history = useMemo<HistoryRow[]>(
    () =>
      [
        ...safetyReports.map((r) => ({ ...r, dept: "Safety" as const })),
        ...securityReports.map((r) => ({ ...r, dept: "Security" as const })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [safetyReports, securityReports],
  );

  return (
    <div className="hensek-page-shell">
      <PageHeader title="Reports" subtitle="Generate and download department reports" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <ChartCard title="Safety Reports" subtitle="Generates PDF and emails safety department">
          <div className="flex gap-2">
            <button onClick={() => generateSafety.mutate("weekly")} disabled={generateSafety.isPending} className="hensek-btn-outline flex-1 justify-center text-xs">Weekly</button>
            <button onClick={() => generateSafety.mutate("monthly")} disabled={generateSafety.isPending} className="hensek-btn-primary flex-1 justify-center text-xs">Monthly</button>
          </div>
        </ChartCard>
        <ChartCard title="Security Reports" subtitle="Generates PDF and emails security department">
          <div className="flex gap-2">
            <button onClick={() => generateSecurity.mutate("weekly")} disabled={generateSecurity.isPending} className="hensek-btn-outline flex-1 justify-center text-xs">Weekly</button>
            <button onClick={() => generateSecurity.mutate("monthly")} disabled={generateSecurity.isPending} className="hensek-btn-primary flex-1 justify-center text-xs">Monthly</button>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Report History" subtitle={`${history.length} report${history.length === 1 ? "" : "s"} on file`}>
        {history.length === 0 ? (
          <EmptyState
            icon={<FileText size={20} />}
            title="No reports yet"
            description="Generated weekly and monthly reports will appear here."
          />
        ) : (
          <ul className="divide-y divide-border/60">
            {history.map((r) => (
              <li key={`${r.dept}-${r.id}`} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-hensek-cream flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-hensek-dark/70" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hensek-dark truncate">{r.dept} — {r.type} report</p>
                    <p className="text-xs text-gray-400">{r.period} · {formatDate(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {r.emailSentAt && <Mail size={12} className="text-green-500" aria-label="Email sent" />}
                  <a href={`/api/reports/${r.dept.toLowerCase()}/${r.id}/download`} target="_blank" rel="noreferrer">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                      <Download size={13} />
                    </button>
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
