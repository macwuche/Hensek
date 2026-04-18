import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import DataTable, { Column } from "@/components/ui/DataTable";
import { Wallet, Banknote, Calendar } from "lucide-react";
import { capitalize, getStatusColor } from "@/lib/utils";

interface Run {
  id: string;
  period: string;
  employees: number;
  gross: string;
  net: string;
  status: string;
  date: string;
}

const RUNS: Run[] = [
  { id: "PR-2026-04", period: "April 2026", employees: 142, gross: "GHS 412,500", net: "GHS 358,310", status: "in_progress", date: "Apr 25, 2026" },
  { id: "PR-2026-03", period: "March 2026", employees: 140, gross: "GHS 408,200", net: "GHS 354,612", status: "completed", date: "Mar 25, 2026" },
  { id: "PR-2026-02", period: "February 2026", employees: 138, gross: "GHS 401,950", net: "GHS 349,118", status: "completed", date: "Feb 25, 2026" },
  { id: "PR-2026-01", period: "January 2026", employees: 136, gross: "GHS 395,400", net: "GHS 343,790", status: "completed", date: "Jan 25, 2026" },
];

export default function HRPayrolls() {
  const cols: Column<Run>[] = [
    { key: "p", header: "Period", render: (r) => <span className="font-medium">{r.period}</span> },
    { key: "e", header: "Employees", render: (r) => <span className="text-xs">{r.employees}</span>, className: "hidden sm:table-cell" },
    { key: "g", header: "Gross", render: (r) => <span className="text-xs text-gray-600">{r.gross}</span>, className: "hidden md:table-cell" },
    { key: "n", header: "Net", render: (r) => <span className="text-xs font-semibold">{r.net}</span> },
    { key: "d", header: "Date", render: (r) => <span className="text-xs text-gray-500">{r.date}</span>, className: "hidden lg:table-cell" },
    { key: "s", header: "Status", render: (r) => <span className={`hensek-badge ${getStatusColor(r.status)}`}>{capitalize(r.status.replace(/_/g, " "))}</span> },
  ];
  return (
    <div className="hensek-page-shell">
      <PageHeader title="Payrolls" subtitle="Monthly pay runs and processing status" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Current Run" value="GHS 412,500" hint="Apr 2026 — gross" icon={<Wallet size={18} />} />
        <StatCard label="YTD Net Paid" value="GHS 1,047k" hint="Year to date" icon={<Banknote size={18} />} />
        <StatCard label="Next Cycle" value="Apr 25" hint="Cutoff in 7 days" icon={<Calendar size={18} />} />
      </div>
      <div className="hensek-card">
        <DataTable columns={cols} rows={RUNS} rowKey={(r) => r.id} />
      </div>
    </div>
  );
}
