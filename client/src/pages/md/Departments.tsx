import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { Plus, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

interface Department {
  id: number;
  name: string;
  slug: string;
  type: string;
  description?: string;
  email?: string;
  createdAt: string;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-hensek-dark">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function MDDepartments() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", email: "" });

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => apiFetch("/api/departments"),
  });

  const create = useMutation({
    mutationFn: (data: typeof form) => apiPost("/api/departments", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created");
      setShowAdd(false);
      setForm({ name: "", description: "", email: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const typeColor: Record<string, string> = {
    md: "hensek-badge-yellow",
    hr: "hensek-badge-blue",
    safety: "hensek-badge-green",
    security: "hensek-badge-red",
    standard: "hensek-badge-gray",
  };

  return (
    <div className="hensek-page-shell">
      <PageHeader
        title="Departments"
        subtitle={`${departments.length} departments registered`}
        actions={
          <button onClick={() => setShowAdd(true)} className="hensek-btn-primary flex items-center gap-1.5">
            <Plus size={14} /> New Dept
          </button>
        }
      />

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      ) : departments.length === 0 ? (
        <div className="hensek-card">
          <EmptyState
            icon={<Building2 size={20} />}
            title="No departments yet"
            description="Create your first department to start grouping staff."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="hensek-card">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-hensek-yellow/20 flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-hensek-dark" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-hensek-dark text-sm truncate">{dept.name}</p>
                    <p className="text-[10px] text-gray-400">/{dept.slug}</p>
                  </div>
                </div>
                <span className={`hensek-badge ${typeColor[dept.type] || "hensek-badge-gray"}`}>{dept.type}</span>
              </div>
              {dept.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{dept.description}</p>}
              {dept.email && <p className="text-[10px] text-gray-400 mb-2 truncate">{dept.email}</p>}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <p className="text-[10px] text-gray-400">Created {formatDate(dept.createdAt)}</p>
                {dept.type === "standard" && (
                  <button
                    onClick={() => { if (confirm(`Delete "${dept.name}"?`)) del.mutate(dept.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="New Department" onClose={() => setShowAdd(false)}>
          <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department Name</label>
              <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="hensek-input w-full" placeholder="e.g., Quality Assurance" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
              <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="hensek-input w-full" placeholder="Brief description" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department Email (optional)</label>
              <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="hensek-input w-full" placeholder="dept@hensek.com" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="hensek-btn-outline flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={create.isPending} className="hensek-btn-primary flex-1 justify-center">
                {create.isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
