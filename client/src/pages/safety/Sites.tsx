import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut } from "@/lib/queryClient";
import { formatDate, cn } from "@/lib/utils";
import { Plus, X, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

interface Site {
  id: number;
  name: string;
  description?: string;
  address?: string;
  lat: number;
  lng: number;
  isActive: boolean;
  createdAt: string;
  staffOnSite?: number;
}

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

export default function SafetySites() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", address: "", lat: "", lng: "" });

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["sites", "all"],
    queryFn: () => apiFetch("/api/sites/all"),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiPost("/api/sites", {
      ...data,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sites"] });
      setShowForm(false);
      setForm({ name: "", description: "", address: "", lat: "", lng: "" });
      toast.success("Site created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiPut(`/api/sites/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sites"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="hensek-page-shell">
      <PageHeader
        title="Work Sites"
        subtitle="Manage and monitor active work sites"
        actions={
          <button className="hensek-btn-primary flex items-center gap-1.5" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Add Site
          </button>
        }
      />

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sites.length === 0 ? (
        <div className="hensek-card">
          <EmptyState
            icon={<Building2 size={20} />}
            title="No sites registered"
            description="Add a work site to start scheduling duties."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div key={site.id} className={cn("hensek-card flex flex-col gap-3", !site.isActive && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-hensek-yellow/15 flex items-center justify-center text-hensek-dark flex-shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-hensek-dark truncate">{site.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{site.lat.toFixed(4)}, {site.lng.toFixed(4)}</p>
                  </div>
                </div>
                <span className={`hensek-badge ${site.isActive ? "hensek-badge-green" : "hensek-badge-gray"}`}>
                  {site.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {site.address && <p className="text-xs text-gray-600">{site.address}</p>}
              {site.description && <p className="text-xs text-gray-500 line-clamp-2">{site.description}</p>}
              <div className="flex items-center justify-between pt-3 mt-auto border-t border-border/60">
                <p className="text-[10px] text-gray-400">Added {formatDate(site.createdAt)}</p>
                <button
                  className="text-xs font-medium text-hensek-dark hover:text-hensek-yellow"
                  onClick={() => toggleMutation.mutate({ id: site.id, isActive: !site.isActive })}
                  disabled={toggleMutation.isPending}
                >
                  {site.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Register Work Site" onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Site Name *</label>
              <input className="hensek-input" placeholder="e.g. Lekki Construction Site" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Latitude *</label>
                <input className="hensek-input" placeholder="6.5244" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Longitude *</label>
                <input className="hensek-input" placeholder="3.3792" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Address</label>
              <input className="hensek-input" placeholder="Physical address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Description</label>
              <textarea className="hensek-input h-20 resize-none" placeholder="Site details (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-1">
              <button className="hensek-btn-outline flex-1 justify-center" onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className="hensek-btn-primary flex-1 justify-center"
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.name || !form.lat || !form.lng}
              >
                {createMutation.isPending ? "Saving…" : "Create Site"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
