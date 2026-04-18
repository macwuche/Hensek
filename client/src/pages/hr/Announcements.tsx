import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPost } from "@/lib/queryClient";
import { formatDateTime, cn } from "@/lib/utils";
import { Plus, Megaphone } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: "normal" | "urgent";
  targetRoles: string[];
  createdAt: string;
  authorName?: string;
}

const ALL_ROLES = ["md", "hr", "safety", "security", "staff"];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-hensek-dark">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function HRAnnouncements() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "normal" as "normal" | "urgent", targetRoles: ["staff"] as string[] });

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: () => apiFetch("/api/announcements"),
  });

  const create = useMutation({
    mutationFn: (data: typeof form) => apiPost("/api/announcements", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement published");
      setShowAdd(false);
      setForm({ title: "", content: "", priority: "normal", targetRoles: ["staff"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRole = (role: string) => {
    setForm((f) => ({
      ...f,
      targetRoles: f.targetRoles.includes(role) ? f.targetRoles.filter((r) => r !== role) : [...f.targetRoles, role],
    }));
  };

  return (
    <div className="hensek-page-shell">
      <PageHeader
        title="Announcements"
        subtitle={`${announcements.length} published`}
        actions={
          <button onClick={() => setShowAdd(true)} className="hensek-btn-primary flex items-center gap-1.5">
            <Plus size={14} /> New
          </button>
        }
      />

      {isLoading ? (
        <div className="hensek-card py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="hensek-card">
          <EmptyState icon={<Megaphone size={20} />} title="No announcements yet" description="Use New to publish updates to selected roles." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {announcements.map((a) => (
            <div key={a.id} className={cn("hensek-card border-l-4", a.priority === "urgent" ? "border-red-400" : "border-hensek-yellow")}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="font-semibold text-hensek-dark">{a.title}</h3>
                {a.priority === "urgent" && <span className="hensek-badge hensek-badge-red">Urgent</span>}
              </div>
              <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{a.content}</p>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-1 flex-wrap">
                  {a.targetRoles.map((r) => (
                    <span key={r} className="hensek-badge hensek-badge-gray capitalize">{r}</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400">{a.authorName ? `By ${a.authorName} · ` : ""}{formatDateTime(a.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="New Announcement" onClose={() => setShowAdd(false)}>
          <form onSubmit={(e) => { e.preventDefault(); if (form.targetRoles.length === 0) { toast.error("Select at least one target"); return; } create.mutate(form); }} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="hensek-input w-full" placeholder="Announcement title" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
              <textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} className="hensek-input w-full h-28 resize-none" placeholder="Write the announcement…" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Priority</label>
              <div className="flex gap-2">
                {(["normal", "urgent"] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))} className={cn("px-4 py-1.5 rounded-lg text-xs font-medium capitalize", form.priority === p ? "bg-hensek-dark text-white" : "bg-gray-100 text-gray-600")}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Target Roles</label>
              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map((r) => (
                  <button key={r} type="button" onClick={() => toggleRole(r)} className={cn("px-3 py-1 rounded-lg text-xs font-medium capitalize", form.targetRoles.includes(r) ? "bg-hensek-yellow text-hensek-dark" : "bg-gray-100 text-gray-500")}>{r}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowAdd(false)} className="hensek-btn-outline flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={create.isPending} className="hensek-btn-primary flex-1 justify-center">{create.isPending ? "Publishing…" : "Publish"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
