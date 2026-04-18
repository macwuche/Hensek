import { Router } from "express";
import { storage } from "../lib/storage.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/notifications
router.get("/", requireAuth, (req, res) => {
  const notifs = storage.getNotificationsByUser(req.user!.id);
  res.json(notifs);
});

// GET /api/notifications/unread-count
router.get("/unread-count", requireAuth, (req, res) => {
  const count = storage.getUnreadCount(req.user!.id);
  res.json({ count });
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", requireAuth, async (req, res) => {
  await storage.markNotificationRead(parseInt(req.params.id));
  res.json({ ok: true });
});

// PATCH /api/notifications/read-all
router.patch("/read-all", requireAuth, async (req, res) => {
  await storage.markAllNotificationsRead(req.user!.id);
  res.json({ ok: true });
});

export default router;
