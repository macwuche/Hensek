import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { FileText, Download, Mail } from "lucide-react";
import { toast } from "sonner";

export default function MDReports() {
  const { data: safetyReports = [] } = useQuery<any[]>({
    queryKey: ["reports", "safety"],
    queryFn: () => apiFetch("/api/reports/safety"),
  });

  const { data: securityReports = [] } = useQuery<any[]>({
    queryKey: ["reports", "security"],
    queryFn: () => apiFetch("/api/reports/security"),
  });

  const generateSafety = useMutation({
    mutationFn: (type: "weekly" | "monthly") => apiPost("/api/reports/safety/generate", { type }),
    onSuccess: () => toast.success("Safety report generated and emailed"),
    onError: (e: any) => toast.error(e.message),
  });

  const generateSecurity = useMutation({
    mutationFn: (type: "weekly" | "monthly") => apiPost("/api/reports/security/generate", { type }),
    onSuccess: () => toast.success("Security report generated and emailed"),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Reports</h1>
        <p className="text-sm text-gray-500">Generate and download department reports</p>
      </div>

      {/* Generate */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="hensek-card p-4">
          <h2 className="text-sm font-semibold text-hensek-dark mb-1">Safety Reports</h2>
          <p className="text-xs text-gray-500 mb-3">Generates PDF and emails safety department</p>
          <div className="flex gap-2">
            <button onClick={() => generateSafety.mutate("weekly")} disabled={generateSafety.isPending} className="hensek-btn-outline flex-1 justify-center text-xs">Weekly</button>
            <button onClick={() => generateSafety.mutate("monthly")} disabled={generateSafety.isPending} className="hensek-btn-primary flex-1 justify-center text-xs">Monthly</button>
          </div>
        </div>
        <div className="hensek-card p-4">
          <h2 className="text-sm font-semibold text-hensek-dark mb-1">Security Reports</h2>
          <p className="text-xs text-gray-500 mb-3">Generates PDF and emails security department</p>
          <div className="flex gap-2">
            <button onClick={() => generateSecurity.mutate("weekly")} disabled={generateSecurity.isPending} className="hensek-btn-outline flex-1 justify-center text-xs">Weekly</button>
            <button onClick={() => generateSecurity.mutate("monthly")} disabled={generateSecurity.isPending} className="hensek-btn-primary flex-1 justify-center text-xs">Monthly</button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="hensek-card p-4">
        <h2 className="text-sm font-semibold text-hensek-dark mb-3">Report History</h2>
        {[...safetyReports.map(r => ({ ...r, dept: "Safety" })), ...securityReports.map(r => ({ ...r, dept: "Security" }))].length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No reports generated yet</p>
        ) : (
          <ul className="divide-y divide-border">
            {[...safetyReports.map(r => ({ ...r, dept: "Safety" })), ...securityReports.map(r => ({ ...r, dept: "Security" }))]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((r) => (
                <li key={`${r.dept}-${r.id}`} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-hensek-dark">{r.dept} — {r.type} report</p>
                      <p className="text-xs text-gray-400">{r.period} · {formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.emailSentAt && <Mail size={12} className="text-green-500" title="Email sent" />}
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
      </div>
    </div>
  );
}
