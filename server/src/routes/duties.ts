import { Router } from "express";
import { storage } from "../lib/storage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { broadcastToUser, broadcastToRole } from "../lib/websocket.js";

const router = Router();

// GET /api/duties/my — staff sees their duties
router.get("/my", requireAuth, (req, res) => {
  const duties = storage.getDutiesByUser(req.user!.id).map(d => {
    const site = storage.getSiteById(d.siteId);
    return { ...d, site };
  });
  res.json(duties);
});

// GET /api/duties/today — today's duties for all
router.get("/today", requireRole("md", "safety", "hr"), (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const duties = storage.getDutiesByDate(today).map(d => {
    const user = storage.getUserById(d.userId);
    const site = storage.getSiteById(d.siteId);
    return { ...d, user: user ? { id: user.id, name: user.name, departmentSlug: user.departmentSlug } : null, site };
  });
  res.json(duties);
});

// GET /api/duties — all duties (Safety + MD)
router.get("/", requireRole("md", "safety"), (req, res) => {
  const { date, userId, siteId } = req.query;
  let duties = storage.getAllDuties();

  if (date) duties = duties.filter(d => d.date === date);
  if (userId) duties = duties.filter(d => d.userId === parseInt(userId as string));
  if (siteId) duties = duties.filter(d => d.siteId === parseInt(siteId as string));

  const enriched = duties.map(d => {
    const user = storage.getUserById(d.userId);
    const site = storage.getSiteById(d.siteId);
    return { ...d, user: user ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl } : null, site };
  });

  res.json(enriched);
});

// POST /api/duties — Safety assigns duty
router.post("/", requireRole("md", "safety"), async (req, res) => {
  const { userId, siteId, date, shiftStart, shiftEnd, taskDescription } = req.body;
  if (!userId || !siteId || !date || !shiftStart || !shiftEnd || !taskDescription) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const user = storage.getUserById(parseInt(userId));
  const site = storage.getSiteById(parseInt(siteId));
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!site) return res.status(404).json({ error: "Site not found" });

  const duty = await storage.createDuty({
    userId: parseInt(userId),
    siteId: parseInt(siteId),
    date,
    shiftStart,
    shiftEnd,
    taskDescription,
    assignedBy: req.user!.id,
    status: "assigned",
  });

  // Notify the staff member
  await storage.createNotification({
    userId: parseInt(userId),
    type: "duty_assigned",
    title: "Duty Assignment",
    body: `You have been assigned to ${site.name} on ${date} (${shiftStart} - ${shiftEnd})`,
    link: "/dashboard/duties",
  });
  broadcastToUser(parseInt(userId), { type: "duty_assigned", duty: { ...duty, site } });

  res.status(201).json({ ...duty, site, user: { id: user.id, name: user.name } });
});

// PATCH /api/duties/:id/status — staff updates duty status
router.patch("/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  const duty = storage.getDutyById(parseInt(req.params.id));
  if (!duty) return res.status(404).json({ error: "Duty not found" });

  // Staff can only update their own duties
  if (req.user!.role === "staff" && duty.userId !== req.user!.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updated = await storage.updateDuty(duty.id, { status });
  broadcastToRole("safety", { type: "duty_status_update", dutyId: duty.id, status, userId: duty.userId });
  res.json(updated);
});

// DELETE /api/duties/:id — Safety + MD
router.delete("/:id", requireRole("md", "safety"), async (req, res) => {
  const duty = storage.getDutyById(parseInt(req.params.id));
  if (!duty) return res.status(404).json({ error: "Duty not found" });
  await storage.updateDuty(duty.id, { status: "missed" });
  broadcastToUser(duty.userId, { type: "duty_cancelled", dutyId: duty.id });
  res.json({ message: "Duty cancelled" });
});

export default router;
