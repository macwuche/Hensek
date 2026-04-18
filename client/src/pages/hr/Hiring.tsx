import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import DataTable, { Column } from "@/components/ui/DataTable";
import { Briefcase, UserPlus, Hourglass } from "lucide-react";
import { capitalize, getStatusColor } from "@/lib/utils";

interface Opening {
  id: string;
  role: string;
  department: string;
  applicants: number;
  status: string;
  posted: string;
}

const OPENINGS: Opening[] = [
  { id: "JOB-014", role: "Site Safety Officer", department: "Safety", applicants: 12, status: "open", posted: "Apr 02, 2026" },
  { id: "JOB-013", role: "Security Supervisor", department: "Security", applicants: 7, status: "open", posted: "Apr 08, 2026" },
  { id: "JOB-012", role: "HR Generalist", department: "HR", applicants: 19, status: "in_progress", posted: "Mar 21, 2026" },
  { id: "JOB-011", role: "Logistics Coordinator", department: "Operations", applicants: 22, status: "closed", posted: "Mar 04, 2026" },
];

export default function HRHiring() {
  const cols: Column<Opening>[] = [
    { key: "r", header: "Role", render: (r) => <span className="font-medium">{r.role}</span> },
    { key: "d", header: "Department", render: (r) => <span className="text-xs text-gray-600">{r.department}</span>, className: "hidden sm:table-cell" },
    { key: "a", header: "Applicants", render: (r) => <span className="text-xs font-semibold">{r.applicants}</span> },
    { key: "p", header: "Posted", render: (r) => <span className="text-xs text-gray-500">{r.posted}</span>, className: "hidden md:table-cell" },
    { key: "s", header: "Status", render: (r) => <span className={`hensek-badge ${getStatusColor(r.status)}`}>{capitalize(r.status.replace(/_/g, " "))}</span> },
  ];
  return (
    <div className="hensek-page-shell">
      <PageHeader title="Hiring" subtitle="Open roles and applicants" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Open Roles" value={3} icon={<Briefcase size={18} />} />
        <StatCard label="New Applicants" value={41} hint="Last 30 days" icon={<UserPlus size={18} />} />
        <StatCard label="Avg Time-to-Hire" value="18d" icon={<Hourglass size={18} />} />
      </div>
      <div className="hensek-card">
        <DataTable columns={cols} rows={OPENINGS} rowKey={(r) => r.id} />
      </div>
    </div>
  );
}
