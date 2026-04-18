import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/utils";
import { FileText, Mail, Download } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";
import EmptyState from "@/components/ui/EmptyState";

interface SecurityReport {
  id: number;
  type: "weekly" | "monthly";
  period: string;
  createdAt: string;
  emailSentAt?: string;
  visitorsCount?: number;
  incidentsCount?: number;
}

export default function SecurityReports() {
  const qc = useQueryClient();
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: reports = [] } = useQuery<SecurityReport[]>({
    queryKey: ["reports", "security"],
    queryFn: () => apiFetch("/api/reports/security"),
  });

  const generateMutation = useMutation({
    mutationFn: (type: "weekly" | "monthly") =>
      apiPost("/api/reports/security/generate", { type, from: fromDate, to: toDate }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports", "security"] });
      toast.success("Security report generated and emailed to CSO");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="hensek-page-shell">
      <PageHeader title="Security Reports" subtitle="Generate and download visitor and incident reports" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Generate New Report" subtitle="Reports are emailed to the CSO as PDFs">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">From</label>
                <input type="date" className="hensek-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">To</label>
                <input type="date" className="hensek-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                className="hensek-btn-primary flex-1 justify-center flex items-center gap-1.5"
                onClick={() => generateMutation.mutate("weekly")}
                disabled={generateMutation.isPending}
              >
                <FileText size={14} />
                {generateMutation.isPending ? "Generating…" : "Weekly Report"}
              </button>
              <button
                className="hensek-btn-outline flex-1 justify-center flex items-center gap-1.5"
                onClick={() => generateMutation.mutate("monthly")}
                disabled={generateMutation.isPending}
              >
                <FileText size={14} /> Monthly Report
              </button>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Report History" subtitle={`${reports.length} reports`}>
          {reports.length === 0 ? (
            <EmptyState icon={<FileText size={20} />} title="No reports yet" description="Generated reports will appear here." />
          ) : (
            <ul className="divide-y divide-border/40">
              {reports.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-hensek-yellow/15 flex items-center justify-center flex-shrink-0">
                      <FileText size={15} className="text-hensek-dark" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-hensek-dark capitalize truncate">{r.type} Security Report</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {r.period} · {formatDateTime(r.createdAt)}
                        {r.visitorsCount !== undefined && <> · {r.visitorsCount} visitors</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {r.emailSentAt && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] text-green-600">
                        <Mail size={12} /> Sent
                      </span>
                    )}
                    <a
                      href={`/api/reports/security/${r.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
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
    </div>
  );
}
