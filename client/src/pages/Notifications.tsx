import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPatch } from "@/lib/queryClient";
import { formatDateTime, cn } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/api/notifications"),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiPatch("/api/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      toast.success("All marked as read");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: number) => apiPatch(`/api/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="hensek-page-shell">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread`}
        actions={
          unread > 0 ? (
            <button
              className="hensek-btn-outline flex items-center gap-1.5"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck size={14} /> Mark All Read
            </button>
          ) : null
        }
      />

      <div className="hensek-card">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading…</div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={<Bell size={20} />} title="You're all caught up!" description="New notifications will appear here." />
        ) : (
          <ul className="divide-y divide-border/40">
            {notifications.map((n) => (
              <li
                key={n.id}
                onClick={() => { if (!n.read) markOneMutation.mutate(n.id); }}
                className={cn(
                  "py-3 px-1 flex items-start gap-3 cursor-pointer transition-colors hover:bg-hensek-cream/40 rounded-lg",
                  !n.read && "bg-hensek-yellow/5",
                )}
              >
                <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", n.read ? "bg-gray-300" : "bg-hensek-yellow")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-hensek-dark">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
