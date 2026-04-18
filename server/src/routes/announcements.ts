import { Router } from "express";
import { storage } from "../lib/storage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { broadcast } from "../lib/websocket.js";

const router = Router();

// GET /api/announcements — filtered by role
router.get("/", requireAuth, (req, res) => {
  const anns = storage.getAnnouncementsForRole(req.user!.role);
  res.json(anns);
});

// POST /api/announcements — HR + MD
router.post("/", requireRole("md", "hr"), async (req, res) => {
  const { title, content, targetRoles, priority, expiresAt } = req.body;
  if (!title || !content) return res.status(400).json({ error: "title and content are required" });

  const roles = targetRoles || ["md", "hr", "safety", "security", "staff"];

  const ann = await storage.createAnnouncement({
    title,
    content,
    authorId: req.user!.id,
    targetRoles: roles,
    priority: priority || "normal",
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });

  // Notify all users with matching roles
  const allUsers = storage.getAllUsers().filter(u => roles.includes(u.role) && u.id !== req.user!.id);
  await Promise.all(allUsers.map(u =>
    storage.createNotification({
      userId: u.id,
      type: "announcement",
      title: `Announcement: ${title}`,
      body: content.substring(0, 100),
      link: "/announcements",
    })
  ));

  broadcast({ type: "new_announcement", announcement: ann });
  res.status(201).json(ann);
});

// PUT /api/announcements/:id — HR + MD
router.put("/:id", requireRole("md", "hr"), async (req, res) => {
  const { title, content, targetRoles, priority } = req.body;
  const updated = await storage.updateAnnouncement(parseInt(req.params.id), { title, content, targetRoles, priority });
  if (!updated) return res.status(404).json({ error: "Announcement not found" });
  res.json(updated);
});

// DELETE /api/announcements/:id — HR + MD
router.delete("/:id", requireRole("md", "hr"), async (req, res) => {
  const deleted = await storage.deleteAnnouncement(parseInt(req.params.id));
  if (!deleted) return res.status(404).json({ error: "Announcement not found" });
  broadcast({ type: "announcement_deleted", id: req.params.id });
  res.json({ message: "Announcement deleted" });
});

export default router;
