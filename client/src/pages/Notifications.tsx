import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiPut } from "@/lib/queryClient";
import { formatDateTime } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function Notifications() {
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/api/notifications"),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiPut("/api/notifications/read-all", {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["notifications", "unread"] }); toast.success("All marked as read"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: number) => apiPut(`/api/notifications/${id}/read`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["notifications", "unread"] }); },
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hensek-dark">Notifications</h1>
          <p className="text-sm text-gray-500">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button
            className="hensek-btn-secondary text-sm flex items-center gap-1.5"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            <CheckCheck size={15} /> Mark All Read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="hensek-card p-12 text-center">
          <Bell size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`hensek-card p-4 flex items-start gap-3 cursor-pointer transition-colors ${!n.isRead ? "border-l-4 border-l-hensek-yellow" : "opacity-70"}`}
              onClick={() => { if (!n.isRead) markOneMutation.mutate(n.id); }}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? "bg-gray-300" : "bg-hensek-yellow"}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-hensek-dark">{n.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
