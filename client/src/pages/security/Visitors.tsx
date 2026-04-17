import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPatch } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/utils";
import { Plus, X, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Visitor {
  id: number;
  name: string;
  phone?: string;
  officeDestination: string;
  purpose?: string;
  hostName?: string;
  plateNumber?: string;
  timeIn: string;
  timeOut?: string;
}

export default function SecurityVisitors() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [dateFilter, setDateFilter] = useState("today");
  const [form, setForm] = useState({ name: "", phone: "", officeDestination: "", purpose: "", hostName: "", plateNumber: "" });

  const { data: visitors = [], isLoading } = useQuery<Visitor[]>({
    queryKey: ["visitors", dateFilter],
    queryFn: () => apiFetch(`/api/visitors?date=${dateFilter}`),
    refetchInterval: 30000,
  });

  const logMutation = useMutation({
    mutationFn: (data: typeof form) => apiPost("/api/visitors", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitors"] });
      setShowForm(false);
      setForm({ name: "", phone: "", officeDestination: "", purpose: "", hostName: "", plateNumber: "" });
      toast.success("Visitor logged");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkoutMutation = useMutation({
    mutationFn: (id: number) => apiPatch(`/api/visitors/${id}/checkout`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["visitors"] }); toast.success("Visitor checked out"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hensek-dark">Visitor Log</h1>
          <p className="text-sm text-gray-500">Log and manage visitor access</p>
        </div>
        <button className="hensek-btn-primary flex items-center gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Log Visitor
        </button>
      </div>

      {/* Log visitor modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="hensek-card w-full max-w-md p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-hensek-dark">Log New Visitor</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Full Name *</label>
                <input className="hensek-input text-sm" placeholder="Visitor's full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
                  <input className="hensek-input text-sm" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Plate Number</label>
                  <input className="hensek-input text-sm" placeholder="Vehicle plate (opt)" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Office / Destination *</label>
                <input className="hensek-input text-sm" placeholder="e.g. HR Office, Reception" value={form.officeDestination} onChange={(e) => setForm({ ...form, officeDestination: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Host Name</label>
                  <input className="hensek-input text-sm" placeholder="Who they're visiting" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Purpose</label>
                  <input className="hensek-input text-sm" placeholder="Meeting, Delivery…" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button className="hensek-btn-secondary text-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className="hensek-btn-primary text-sm"
                onClick={() => logMutation.mutate(form)}
                disabled={logMutation.isPending || !form.name || !form.officeDestination}
              >
                {logMutation.isPending ? "Logging…" : "Log Visitor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        {["today", "all"].map((f) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${dateFilter === f ? "bg-hensek-dark text-white" : "bg-white border border-border text-gray-600 hover:bg-gray-50"}`}
            onClick={() => setDateFilter(f)}
          >
            {f === "today" ? "Today" : "All Records"}
          </button>
        ))}
        <span className="text-sm text-gray-400 ml-2">{visitors.length} entries</span>
      </div>

      {/* Visitors table */}
      <div className="hensek-card overflow-x-auto">
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visitors.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No visitor records</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Visitor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Purpose</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Time In</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Time Out</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visitors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-hensek-dark">{v.name}</p>
                    {v.phone && <p className="text-xs text-gray-400">{v.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                    {v.officeDestination}
                    {v.hostName && <p className="text-xs text-gray-400">Host: {v.hostName}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{v.purpose || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{formatDateTime(v.timeIn)}</td>
                  <td className="px-4 py-3 text-xs">
                    {v.timeOut ? (
                      <span className="text-gray-500">{formatDateTime(v.timeOut)}</span>
                    ) : (
                      <span className="hensek-badge hensek-badge-green text-[10px]">On-Site</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!v.timeOut && (
                      <button
                        className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                        onClick={() => checkoutMutation.mutate(v.id)}
                        disabled={checkoutMutation.isPending}
                      >
                        <LogOut size={12} /> Check Out
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
