import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut } from "@/lib/queryClient";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

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

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hensek-dark">Duty Assignments</h1>
          <p className="text-sm text-gray-500">Assign and manage staff duties</p>
        </div>
        <button className="hensek-btn-primary flex items-center gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Assign Duty
        </button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">Date:</label>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="hensek-input text-sm py-1.5 w-40"
        />
      </div>

      {/* Assign form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="hensek-card w-full max-w-md p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-hensek-dark">Assign Duty</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Staff Member</label>
                <select className="hensek-input text-sm" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                  <option value="">Select staff...</option>
                  {activeStaff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Work Site</label>
                <select className="hensek-input text-sm" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })}>
                  <option value="">Select site...</option>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
                  <input type="date" className="hensek-input text-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Start</label>
                  <input type="time" className="hensek-input text-sm" value={form.shiftStart} onChange={(e) => setForm({ ...form, shiftStart: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">End</label>
                  <input type="time" className="hensek-input text-sm" value={form.shiftEnd} onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Task Description</label>
                <textarea
                  className="hensek-input text-sm resize-none"
                  rows={3}
                  placeholder="Describe the duty task..."
                  value={form.taskDescription}
                  onChange={(e) => setForm({ ...form, taskDescription: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button className="hensek-btn-secondary text-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className="hensek-btn-primary text-sm"
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.userId || !form.siteId || !form.taskDescription}
              >
                {createMutation.isPending ? "Assigning…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duties list */}
      <div className="hensek-card overflow-hidden">
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : duties.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No duties for {dateFilter}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Site</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Shift</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Task</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {duties.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-hensek-dark">{d.user?.name || `Staff #${d.userId}`}</td>
                  <td className="px-4 py-3 text-gray-600">{d.site?.name || `Site #${d.siteId}`}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{d.shiftStart}–{d.shiftEnd}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-[200px] truncate">{d.taskDescription}</td>
                  <td className="px-4 py-3">
                    <span className={`hensek-badge text-[10px] ${getStatusColor(d.status)}`}>{d.status.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-4 py-3">
                    {d.status === "assigned" && (
                      <button
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => updateMutation.mutate({ id: d.id, status: "in_progress" })}
                      >
                        Start
                      </button>
                    )}
                    {d.status === "in_progress" && (
                      <button
                        className="text-xs text-green-600 hover:underline"
                        onClick={() => updateMutation.mutate({ id: d.id, status: "completed" })}
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
