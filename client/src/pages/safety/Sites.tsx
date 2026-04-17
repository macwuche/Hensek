import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost, apiPut } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Plus, X, MapPin } from "lucide-react";
import { toast } from "sonner";

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
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hensek-dark">Work Sites</h1>
          <p className="text-sm text-gray-500">Manage and monitor active work sites</p>
        </div>
        <button className="hensek-btn-primary flex items-center gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Site
        </button>
      </div>

      {/* Create site modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="hensek-card w-full max-w-md p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-hensek-dark">Register Work Site</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Site Name *</label>
                <input className="hensek-input text-sm" placeholder="e.g. Lekki Construction Site" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Latitude *</label>
                  <input className="hensek-input text-sm" placeholder="6.5244" type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Longitude *</label>
                  <input className="hensek-input text-sm" placeholder="3.3792" type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Address</label>
                <input className="hensek-input text-sm" placeholder="Physical address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                <textarea className="hensek-input text-sm resize-none" rows={2} placeholder="Site details (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button className="hensek-btn-secondary text-sm" onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className="hensek-btn-primary text-sm"
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.name || !form.lat || !form.lng}
              >
                {createMutation.isPending ? "Saving…" : "Create Site"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sites grid */}
      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div key={site.id} className={`hensek-card p-4 space-y-2 ${!site.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <MapPin size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-hensek-dark">{site.name}</p>
                    <p className="text-xs text-gray-400">{site.lat.toFixed(4)}, {site.lng.toFixed(4)}</p>
                  </div>
                </div>
                <span className={`hensek-badge text-[10px] ${site.isActive ? "hensek-badge-green" : "hensek-badge-gray"}`}>
                  {site.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {site.address && <p className="text-xs text-gray-500">{site.address}</p>}
              {site.description && <p className="text-xs text-gray-400 line-clamp-2">{site.description}</p>}
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <p className="text-xs text-gray-400">{formatDate(site.createdAt)}</p>
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => toggleMutation.mutate({ id: site.id, isActive: !site.isActive })}
                  disabled={toggleMutation.isPending}
                >
                  {site.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
          {sites.length === 0 && (
            <p className="col-span-full text-sm text-gray-400 text-center py-10">No sites registered</p>
          )}
        </div>
      )}
    </div>
  );
}
