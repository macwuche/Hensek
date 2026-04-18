import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import DataTable, { Column } from "@/components/ui/DataTable";
import { FolderKanban, Users, AlertCircle } from "lucide-react";
import { capitalize, getStatusColor } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  client: string;
  staff: number;
  budget: string;
  status: string;
}

const PROJECTS: Project[] = [
  { id: "P-201", name: "Tema Port Security", client: "GPHA", staff: 24, budget: "GHS 1.2M", status: "in_progress" },
  { id: "P-202", name: "Accra Mall Patrol", client: "AccraMall Ltd.", staff: 11, budget: "GHS 480k", status: "in_progress" },
  { id: "P-203", name: "Ashanti Site Safety", client: "Newgold Mines", staff: 19, budget: "GHS 920k", status: "open" },
  { id: "P-204", name: "Eastern Region Audit", client: "Cocobod", staff: 7, budget: "GHS 210k", status: "completed" },
];

export default function HRProjectData() {
  const cols: Column<Project>[] = [
    { key: "n", header: "Project", render: (p) => <div><p className="font-medium">{p.name}</p><p className="text-[10px] text-gray-400">{p.id} · {p.client}</p></div> },
    { key: "s", header: "Staff", render: (p) => <span className="text-xs">{p.staff}</span>, className: "hidden sm:table-cell" },
    { key: "b", header: "Budget", render: (p) => <span className="text-xs font-semibold">{p.budget}</span>, className: "hidden md:table-cell" },
    { key: "st", header: "Status", render: (p) => <span className={`hensek-badge ${getStatusColor(p.status)}`}>{capitalize(p.status.replace(/_/g, " "))}</span> },
  ];
  return (
    <div className="hensek-page-shell">
      <PageHeader title="Project-specific Data" subtitle="Per-project staffing and budgets" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Active Projects" value={PROJECTS.filter((p) => p.status !== "completed").length} icon={<FolderKanban size={18} />} />
        <StatCard label="Staff Allocated" value={PROJECTS.reduce((s, p) => s + p.staff, 0)} icon={<Users size={18} />} />
        <StatCard label="Issues Flagged" value={2} hint="Across all projects" icon={<AlertCircle size={18} />} />
      </div>
      <div className="hensek-card">
        <DataTable columns={cols} rows={PROJECTS} rowKey={(p) => p.id} />
      </div>
    </div>
  );
}
