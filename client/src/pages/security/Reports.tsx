import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/utils";
import { FileText, Mail, Download } from "lucide-react";
import { toast } from "sonner";

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
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Security Reports</h1>
        <p className="text-sm text-gray-500">Generate and download visitor and incident reports</p>
      </div>

      <div className="hensek-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-hensek-dark">Generate New Report</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">From</label>
            <input type="date" className="hensek-input text-sm py-1.5 w-36" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">To</label>
            <input type="date" className="hensek-input text-sm py-1.5 w-36" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button
              className="hensek-btn-primary text-sm flex items-center gap-1.5"
              onClick={() => generateMutation.mutate("weekly")}
              disabled={generateMutation.isPending}
            >
              <FileText size={14} />
              {generateMutation.isPending ? "Generating…" : "Weekly Report"}
            </button>
            <button
              className="hensek-btn-secondary text-sm flex items-center gap-1.5"
              onClick={() => generateMutation.mutate("monthly")}
              disabled={generateMutation.isPending}
            >
              <FileText size={14} /> Monthly Report
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">Reports are generated as PDFs and automatically emailed to the CSO.</p>
      </div>

      <div className="hensek-card p-4">
        <h2 className="text-sm font-semibold text-hensek-dark mb-3">Report History</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No reports generated yet</p>
        ) : (
          <ul className="divide-y divide-border">
            {reports.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <FileText size={16} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-hensek-dark capitalize">{r.type} Security Report</p>
                    <p className="text-xs text-gray-400">
                      {r.period} · {formatDateTime(r.createdAt)}
                      {r.visitorsCount !== undefined && <> · {r.visitorsCount} visitors</>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {r.emailSentAt && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
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
      </div>
    </div>
  );
}
