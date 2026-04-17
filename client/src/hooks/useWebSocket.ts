import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface WsMessage {
  type: string;
  [key: string]: unknown;
}

export function useWebSocket(userId: number | undefined) {
  const ws = useRef<WebSocket | null>(null);
  const qc = useQueryClient();
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (!userId) return;
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(url);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "auth", userId }));
    };

    socket.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        handleMessage(msg);
      } catch (_) { /* ignore */ }
    };

    socket.onclose = () => {
      // Reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    socket.onerror = () => {
      socket.close();
    };

    ws.current = socket;
  }, [userId]);

  function handleMessage(msg: WsMessage) {
    switch (msg.type) {
      case "chat_message":
        qc.invalidateQueries({ queryKey: ["chat", "messages"] });
        break;
      case "new_announcement":
        qc.invalidateQueries({ queryKey: ["announcements"] });
        toast.info("New Announcement", { description: (msg.announcement as any)?.title });
        break;
      case "notification":
        qc.invalidateQueries({ queryKey: ["notifications"] });
        toast.info((msg as any).title as string, { description: (msg as any).body as string });
        break;
      case "new_application":
        qc.invalidateQueries({ queryKey: ["applications"] });
        break;
      case "application_update":
        qc.invalidateQueries({ queryKey: ["applications"] });
        break;
      case "attendance_update":
        qc.invalidateQueries({ queryKey: ["attendance"] });
        qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
        break;
      case "duty_assigned":
        qc.invalidateQueries({ queryKey: ["duties"] });
        toast.info("New Duty Assignment", { description: "You have a new duty assignment" });
        break;
      case "staff_clocked_in":
      case "staff_clocked_out":
        qc.invalidateQueries({ queryKey: ["dashboard", "stats"] });
        qc.invalidateQueries({ queryKey: ["users", "online"] });
        break;
      case "staff_location":
        qc.invalidateQueries({ queryKey: ["users", "locations"] });
        break;
      case "account_approved":
        toast.success("Account Approved", { description: "Your account has been approved!" });
        qc.invalidateQueries({ queryKey: ["auth", "me"] });
        break;
      case "account_suspended":
        toast.error("Account Suspended", { description: "Your account has been suspended." });
        break;
      case "new_visitor":
        qc.invalidateQueries({ queryKey: ["visitors"] });
        break;
      case "user_status":
        qc.invalidateQueries({ queryKey: ["users", "online"] });
        break;
    }
  }

  const sendMessage = useCallback((msg: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  const sendLocation = useCallback((lat: number, lng: number) => {
    sendMessage({ type: "location_update", lat, lng });
  }, [sendMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeout.current);
      ws.current?.close();
    };
  }, [connect]);

  return { sendMessage, sendLocation, ws: ws.current };
}
