import { Router } from "express";
import { storage } from "../lib/storage.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/chat/rooms — get rooms accessible to this user
router.get("/rooms", requireAuth, async (req, res) => {
  const { role, id: userId } = req.user!;
  let rooms;

  if (role === "md" || role === "hr" || role === "safety" || role === "security") {
    rooms = storage.getRoomsForRole(role);
  } else {
    // Staff gets rooms for their specific conversations
    rooms = storage.getRoomsForUser(userId);

    // Also ensure staff-specific rooms to dept exist
    const staffRooms = await Promise.all(
      ["hr", "safety", "security"].map(async dept => {
        const roomId = `staff-${userId}-${dept}`;
        const existing = storage.getChatRoom(roomId);
        if (existing) return existing;
        return storage.createChatRoom({
          id: roomId,
          name: `Me ↔ ${dept.charAt(0).toUpperCase() + dept.slice(1)}`,
          type: "staff_to_dept",
          participants: [`staff-${userId}`, dept],
          createdAt: new Date(),
        });
      })
    );
    rooms = [...rooms, ...staffRooms];
  }

  res.json(rooms);
});

// GET /api/chat/rooms/:roomId/messages
router.get("/rooms/:roomId/messages", requireAuth, (req, res) => {
  const { roomId } = req.params;
  const { role, id: userId } = req.user!;

  // Verify access
  const room = storage.getChatRoom(roomId);
  if (!room) return res.status(404).json({ error: "Room not found" });

  const userRoomId = `staff-${userId}`;
  const hasAccess =
    room.participants.includes(role) ||
    room.participants.includes(userRoomId) ||
    role === "md";

  if (!hasAccess) return res.status(403).json({ error: "No access to this room" });

  const limit = parseInt(req.query.limit as string) || 50;
  const messages = storage.getMessagesByRoom(roomId, limit);
  res.json(messages);
});

// POST /api/chat/rooms/:roomId/messages — HTTP fallback (WS is primary)
router.post("/rooms/:roomId/messages", requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Content is required" });

  const user = storage.getUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const msg = await storage.createChatMessage({
    roomId: req.params.roomId,
    senderId: req.user!.id,
    senderName: user.name,
    senderRole: user.role,
    content,
  });

  res.status(201).json(msg);
});

// PATCH /api/chat/messages/:id/read
router.patch("/messages/:id/read", requireAuth, async (req, res) => {
  await storage.markMessageRead(parseInt(req.params.id), req.user!.id);
  res.json({ ok: true });
});

export default router;
