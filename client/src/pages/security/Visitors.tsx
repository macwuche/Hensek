import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPatch } from "@/lib/queryClient";
import { formatDateTime, cn } from "@/lib/utils";
import { Plus, X, LogOut, Users } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";

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

  const columns: Column<Visitor>[] = [
    {
      key: "visitor",
      header: "Visitor",
      render: (v) => (
        <div className="min-w-0">
          <p className="font-medium text-sm text-hensek-dark truncate">{v.name}</p>
          {v.phone && <p className="text-[10px] text-gray-400 truncate">{v.phone}</p>}
        </div>
      ),
    },
    {
      key: "destination",
      header: "Destination",
      render: (v) => (
        <div className="min-w-0">
          <p className="text-xs text-gray-700 truncate">{v.officeDestination}</p>
          {v.hostName && <p className="text-[10px] text-gray-400 truncate">Host: {v.hostName}</p>}
        </div>
      ),
      className: "hidden sm:table-cell",
    },
    {
      key: "purpose",
      header: "Purpose",
      render: (v) => <span className="text-xs text-gray-500">{v.purpose || "—"}</span>,
      className: "hidden md:table-cell",
    },
    {
      key: "in",
      header: "Time In",
      render: (v) => <span className="text-xs text-gray-600">{formatDateTime(v.timeIn)}</span>,
    },
    {
      key: "out",
      header: "Time Out",
      render: (v) =>
        v.timeOut ? (
          <span className="text-xs text-gray-500">{formatDateTime(v.timeOut)}</span>
        ) : (
          <span className="hensek-badge hensek-badge-green">On-Site</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-28",
      render: (v) =>
        !v.timeOut ? (
          <button
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
            onClick={() => checkoutMutation.mutate(v.id)}
            disabled={checkoutMutation.isPending}
          >
            <LogOut size={12} /> Check Out
          </button>
        ) : null,
    },
  ];

  return (
    <div className="hensek-page-shell">
      <PageHeader
        title="Visitor Log"
        subtitle="Log and manage visitor access"
        actions={
          <button className="hensek-btn-primary flex items-center gap-1.5" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Log Visitor
          </button>
        }
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-hensek-dark">Log New Visitor</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={18} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Full Name *</label>
                <input className="hensek-input" placeholder="Visitor's full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
                  <input className="hensek-input" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Plate Number</label>
                  <input className="hensek-input" placeholder="Vehicle plate (opt)" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Office / Destination *</label>
                <input className="hensek-input" placeholder="e.g. HR Office, Reception" value={form.officeDestination} onChange={(e) => setForm({ ...form, officeDestination: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Host Name</label>
                  <input className="hensek-input" placeholder="Who they're visiting" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Purpose</label>
                  <input className="hensek-input" placeholder="Meeting, Delivery…" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="hensek-btn-outline flex-1 justify-center" onClick={() => setShowForm(false)}>Cancel</button>
                <button
                  className="hensek-btn-primary flex-1 justify-center"
                  onClick={() => logMutation.mutate(form)}
                  disabled={logMutation.isPending || !form.name || !form.officeDestination}
                >
                  {logMutation.isPending ? "Logging…" : "Log Visitor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hensek-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex bg-hensek-warm rounded-xl p-1 self-start">
            {["today", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  dateFilter === f ? "bg-white text-hensek-dark shadow-sm" : "text-gray-600 hover:text-hensek-dark",
                )}
              >
                {f === "today" ? "Today" : "All Records"}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500">{visitors.length} entries</span>
        </div>

        <DataTable
          columns={columns}
          rows={visitors}
          rowKey={(v) => String(v.id)}
          loading={isLoading}
          empty={<EmptyState icon={<Users size={20} />} title="No visitor records" description="Logged visitors will appear here." />}
        />
      </div>
    </div>
  );
}
