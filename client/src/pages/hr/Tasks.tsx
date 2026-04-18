import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";
import { capitalize, getStatusColor } from "@/lib/utils";

interface Task {
  id: number;
  title: string;
  assignee: string;
  due: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "completed";
}

const ROWS: Task[] = [
  { id: 1, title: "Onboard new safety hires", assignee: "Sarah Mensah", due: "Apr 22, 2026", priority: "high", status: "in_progress" },
  { id: 2, title: "Quarterly performance reviews", assignee: "Kojo Asante", due: "Apr 30, 2026", priority: "high", status: "open" },
  { id: 3, title: "Update employee handbook", assignee: "Ama Owusu", due: "May 05, 2026", priority: "medium", status: "open" },
  { id: 4, title: "Renew payroll service contract", assignee: "Yaw Boateng", due: "May 12, 2026", priority: "medium", status: "open" },
  { id: 5, title: "Audit PPE inventory", assignee: "Akua Mensah", due: "Apr 28, 2026", priority: "low", status: "completed" },
];

const PRIORITY_BADGE: Record<string, string> = {
  high: "hensek-badge-red",
  medium: "hensek-badge-yellow",
  low: "hensek-badge-blue",
};

export default function HRTasks() {
  const cols: Column<Task>[] = [
    { key: "t", header: "Task", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "a", header: "Assignee", render: (r) => <span className="text-xs text-gray-600">{r.assignee}</span>, className: "hidden md:table-cell" },
    { key: "d", header: "Due", render: (r) => <span className="text-xs text-gray-500">{r.due}</span>, className: "hidden sm:table-cell" },
    { key: "p", header: "Priority", render: (r) => <span className={`hensek-badge ${PRIORITY_BADGE[r.priority]}`}>{capitalize(r.priority)}</span> },
    { key: "s", header: "Status", render: (r) => <span className={`hensek-badge ${getStatusColor(r.status)}`}>{capitalize(r.status.replace(/_/g, " "))}</span> },
  ];
  return (
    <div className="hensek-page-shell">
      <PageHeader title="Tasks" subtitle="Track ongoing HR initiatives" />
      <div className="hensek-card">
        <DataTable columns={cols} rows={ROWS} rowKey={(r) => String(r.id)} />
      </div>
    </div>
  );
}
