import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { storage } from "./storage.js";

interface WsClient {
  ws: WebSocket;
  userId: number;
  role: string;
  departmentSlug: string | null;
}

const clients = new Map<number, WsClient>();

export function setupWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    let userId: number | null = null;

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "auth") {
          userId = msg.userId;
          const user = storage.getUserById(userId!);
          if (!user) { ws.close(); return; }
          clients.set(userId!, { ws, userId: userId!, role: user.role, departmentSlug: user.departmentSlug });
          await storage.updateUser(userId!, { isOnline: true });
          broadcastUserStatus(userId!, true);
          ws.send(JSON.stringify({ type: "auth_ok", userId }));
        }

        if (!userId) return;

        if (msg.type === "location_update") {
          await storage.updateUser(userId, {
            lastLat: msg.lat,
            lastLng: msg.lng,
            lastLocationUpdate: new Date(),
          });
          broadcastToRole("safety", { type: "staff_location", userId, lat: msg.lat, lng: msg.lng, name: storage.getUserById(userId)?.name });
        }

        if (msg.type === "chat_message") {
          const user = storage.getUserById(userId);
          if (!user) return;
          const chatMsg = await storage.createChatMessage({
            roomId: msg.roomId,
            senderId: userId,
            senderName: user.name,
            senderRole: user.role,
            content: msg.content,
          });
          broadcastToRoom(msg.roomId, { type: "chat_message", message: chatMsg });
        }

        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (err) {
        console.error("[ws:message]", err);
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId);
        storage.updateUser(userId, { isOnline: false }).catch(err => console.error("[ws:close]", err));
        broadcastUserStatus(userId, false);
      }
    });

    ws.on("error", () => {
      if (userId) {
        clients.delete(userId);
        storage.updateUser(userId, { isOnline: false }).catch(err => console.error("[ws:error]", err));
      }
    });
  });
}

export function broadcast(payload: object) {
  const msg = JSON.stringify(payload);
  clients.forEach(({ ws }) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

export function broadcastToUser(userId: number, payload: object) {
  const client = clients.get(userId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(payload));
  }
}

export function broadcastToRole(role: string, payload: object) {
  const msg = JSON.stringify(payload);
  clients.forEach(({ ws, role: r }) => {
    if (r === role && ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

export function broadcastToRoom(roomId: string, payload: object) {
  const room = storage.getChatRoom(roomId);
  if (!room) return;
  const msg = JSON.stringify(payload);
  clients.forEach(({ ws, role, userId }) => {
    const userRoomId = `staff-${userId}`;
    if (
      (room.participants.includes(role) || room.participants.includes(userRoomId)) &&
      ws.readyState === WebSocket.OPEN
    ) {
      ws.send(msg);
    }
  });
}

function broadcastUserStatus(userId: number, online: boolean) {
  broadcast({ type: "user_status", userId, online });
}

export function notifyUser(userId: number, notification: object) {
  broadcastToUser(userId, { type: "notification", ...notification });
}

export function getConnectedClients() {
  return Array.from(clients.values()).map(c => ({ userId: c.userId, role: c.role }));
}
