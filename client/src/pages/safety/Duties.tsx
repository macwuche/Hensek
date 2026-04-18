import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut } from "@/lib/queryClient";
import { getStatusColor, capitalize } from "@/lib/utils";
import { Plus, X, HardHat } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";

interface Duty {
  id: number;
  userId: number;
  siteId: number;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  taskDescription: string;
  status: string;
  user?: { id: number; name: string; avatarUrl?: string } | null;
  site?: { id: number; name: string } | null;
}

interface Site { id: number; name: string; }
interface Staff { id: number; name: string; role: string; status: string; }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-hensek-dark">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function SafetyDuties() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({
    userId: "", siteId: "", date: new Date().toISOString().split("T")[0],
    shiftStart: "08:00", shiftEnd: "16:00", taskDescription: "",
  });

  const { data: duties = [], isLoading } = useQuery<Duty[]>({
    queryKey: ["duties", dateFilter],
    queryFn: () => apiFetch(`/api/duties?date=${dateFilter}`),
  });

  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: () => apiFetch("/api/sites"),
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/users"),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiPost("/api/duties", {
      ...data, userId: parseInt(data.userId), siteId: parseInt(data.siteId),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["duties"] });
      setShowForm(false);
      setForm({ userId: "", siteId: "", date: new Date().toISOString().split("T")[0], shiftStart: "08:00", shiftEnd: "16:00", taskDescription: "" });
      toast.success("Duty assigned");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiPut(`/api/duties/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["duties"] }); toast.success("Status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const activeStaff = staff.filter((s) => s.status === "active" && s.role === "staff");

  const columns: Column<Duty>[] = [
    {
      key: "staff",
      header: "Staff",
      render: (d) => (
        <p className="font-medium text-sm text-hensek-dark">{d.user?.name || `Staff #${d.userId}`}</p>
      ),
    },
    {
      key: "site",
      header: "Site",
      render: (d) => <span className="text-xs text-gray-600">{d.site?.name || `Site #${d.siteId}`}</span>,
    },
    {
      key: "shift",
      header: "Shift",
      render: (d) => <span className="text-xs text-gray-500">{d.shiftStart}–{d.shiftEnd}</span>,
      className: "hidden sm:table-cell",
    },
    {
      key: "task",
      header: "Task",
      render: (d) => <span className="text-xs text-gray-500 line-clamp-1 max-w-[260px] inline-block">{d.taskDescription}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "status",
      header: "Status",
      render: (d) => <span className={`hensek-badge ${getStatusColor(d.status)}`}>{capitalize(d.status.replace(/_/g, " "))}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-28",
      render: (d) => (
        <div className="flex justify-end">
          {d.status === "assigned" && (
            <button
              onClick={() => updateMutation.mutate({ id: d.id, status: "in_progress" })}
              className="text-xs text-blue-600 hover:underline"
            >
              Start
            </button>
          )}
          {d.status === "in_progress" && (
            <button
              onClick={() => updateMutation.mutate({ id: d.id, status: "completed" })}
              className="text-xs text-green-600 hover:underline"
            >
              Complete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="hensek-page-shell">
      <PageHeader
        title="Duty Assignments"
        subtitle="Assign and manage staff duties"
        actions={
          <button className="hensek-btn-primary flex items-center gap-1.5" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Assign Duty
          </button>
        }
      />

      <div className="hensek-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="hensek-input w-40"
            />
          </div>
          <span className="text-xs text-gray-500">{duties.length} duties</span>
        </div>

        <DataTable
          columns={columns}
          rows={duties}
          rowKey={(d) => String(d.id)}
          loading={isLoading}
          empty={
            <EmptyState
              icon={<HardHat size={20} />}
              title={`No duties for ${dateFilter}`}
              description="Assign a duty to get started."
            />
          }
        />
      </div>

      {showForm && (
        <Modal title="Assign Duty" onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Staff Member</label>
              <select className="hensek-input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">Select staff…</option>
                {activeStaff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Work Site</label>
              <select className="hensek-input" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}>
                <option value="">Select site…</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Date</label>
                <input type="date" className="hensek-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Start</label>
                <input type="time" className="hensek-input" value={form.shiftStart} onChange={(e) => setForm({ ...form, shiftStart: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">End</label>
                <input type="time" className="hensek-input" value={form.shiftEnd} onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Task Description</label>
              <textarea
                className="hensek-input h-20 resize-none"
                placeholder="Describe the duty task…"
                value={form.taskDescription}
                onChange={(e) => setForm({ ...form, taskDescription: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button className="hensek-btn-outline flex-1 justify-center" onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className="hensek-btn-primary flex-1 justify-center"
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.userId || !form.siteId || !form.taskDescription}
              >
                {createMutation.isPending ? "Assigning…" : "Assign"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
