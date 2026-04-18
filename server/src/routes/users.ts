import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { storage } from "../lib/storage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { broadcastToUser } from "../lib/websocket.js";
import { sendEmail, buildWelcomeEmail } from "../lib/email.js";

function appBaseUrl(req: { protocol: string; get: (h: string) => string | undefined }): string {
  return process.env.APP_URL || `${req.protocol}://${req.get("host") || "localhost"}`;
}

const router = Router();

const avatarStorage = multer.diskStorage({
  destination: "uploads/avatars/",
  filename: (_, file, cb) => cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/users — MD and HR see all, others filtered
router.get("/", requireAuth, (req, res) => {
  const { role } = req.user!;
  let users = storage.getAllUsers();

  if (role !== "md" && role !== "hr") {
    // Other depts see active staff only (no passwords)
    users = users.filter(u => u.status === "active");
  }

  const safe = users.map(({ passwordHash, ...u }) => u);
  res.json(safe);
});

// GET /api/users/pending — HR + MD only
router.get("/pending", requireRole("md", "hr"), (req, res) => {
  const pending = storage.getPendingUsers().map(({ passwordHash, ...u }) => u);
  res.json(pending);
});

// GET /api/users/:id
router.get("/:id", requireAuth, (req, res) => {
  const user = storage.getUserById(parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// PATCH /api/users/:id/approve — HR + MD
router.patch("/:id/approve", requireRole("md", "hr"), async (req, res) => {
  const user = await storage.updateUser(parseInt(req.params.id), { status: "active" });
  if (!user) return res.status(404).json({ error: "User not found" });

  await storage.createNotification({
    userId: user.id,
    type: "account_approved",
    title: "Account Approved",
    body: "Your account has been approved. You can now log in.",
  });
  broadcastToUser(user.id, { type: "account_approved" });

  // Send welcome email with login link
  if (user.email) {
    const dept = user.departmentId ? storage.getDeptById(user.departmentId) : undefined;
    const base = appBaseUrl(req);
    const loginUrl = `${base}/login`;
    const { subject, html } = buildWelcomeEmail(user.name, dept?.name || "your", loginUrl);
    void sendEmail({ to: user.email, subject, html });
  }

  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// PATCH /api/users/:id/reject — HR + MD
router.patch("/:id/reject", requireRole("md", "hr"), async (req, res) => {
  const { reason } = req.body;
  const user = await storage.updateUser(parseInt(req.params.id), { status: "suspended" });
  if (!user) return res.status(404).json({ error: "User not found" });

  await storage.createNotification({
    userId: user.id,
    type: "account_rejected",
    title: "Registration Rejected",
    body: reason || "Your registration was not approved.",
  });

  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// PATCH /api/users/:id/suspend — MD only
router.patch("/:id/suspend", requireRole("md"), async (req, res) => {
  const { reason } = req.body;
  const user = await storage.updateUser(parseInt(req.params.id), { status: "suspended" });
  if (!user) return res.status(404).json({ error: "User not found" });

  await storage.createNotification({
    userId: user.id,
    type: "account_suspended",
    title: "Account Suspended",
    body: reason || "Your account has been suspended. Contact HR for details.",
  });
  broadcastToUser(user.id, { type: "account_suspended" });

  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// PATCH /api/users/:id/activate — MD only
router.patch("/:id/activate", requireRole("md"), async (req, res) => {
  const user = await storage.updateUser(parseInt(req.params.id), { status: "active" });
  if (!user) return res.status(404).json({ error: "User not found" });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// PUT /api/users/:id — MD + HR update user info
router.put("/:id", requireRole("md", "hr"), async (req, res) => {
  const { name, phone, address, departmentSlug, departmentId, emergencyContact, emergencyPhone } = req.body;
  const user = await storage.updateUser(parseInt(req.params.id), {
    name, phone, address, departmentSlug, departmentId, emergencyContact, emergencyPhone,
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// DELETE /api/users/:id — MD only
router.delete("/:id", requireRole("md"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user!.id) return res.status(400).json({ error: "Cannot delete your own account" });
  const deleted = await storage.deleteUser(id);
  if (!deleted) return res.status(404).json({ error: "User not found" });
  res.json({ message: "User deleted" });
});

// POST /api/users/:id/avatar — upload avatar
router.post("/:id/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  const id = parseInt(req.params.id);
  if (req.user!.role !== "md" && req.user!.role !== "hr" && req.user!.id !== id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const user = await storage.updateUser(id, { avatarUrl });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ avatarUrl });
});

// GET /api/users/online/list — Safety can see online staff
router.get("/online/list", requireRole("md", "hr", "safety"), (req, res) => {
  const online = storage.getOnlineStaff().map(({ passwordHash, ...u }) => u);
  res.json(online);
});

// GET /api/users/clocked-in/list — Safety + HR + MD
router.get("/clocked-in/list", requireRole("md", "hr", "safety"), (req, res) => {
  const ci = storage.getClockedInStaff().map(({ passwordHash, ...u }) => u);
  res.json(ci);
});

// POST /api/users/:id/comment — Security adds comment on staff
router.post("/:id/comment", requireRole("security", "md", "hr"), async (req, res) => {
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: "Comment is required" });

  const staffId = parseInt(req.params.id);
  const commenter = storage.getUserById(req.user!.id);
  const staffUser = storage.getUserById(staffId);
  if (!staffUser) return res.status(404).json({ error: "Staff not found" });

  const newComment = await storage.createStaffComment({
    staffId,
    authorId: req.user!.id,
    authorName: commenter?.name || "Unknown",
    comment,
  });

  // Notify HR and MD
  await Promise.all([
    ...storage.getUsersByRole("hr").map(u =>
      storage.createNotification({ userId: u.id, type: "staff_comment", title: "New Staff Comment", body: `Security added a comment on ${staffUser.name}`, link: `/hr/staff/${staffId}` })
    ),
    ...storage.getUsersByRole("md").map(u =>
      storage.createNotification({ userId: u.id, type: "staff_comment", title: "New Staff Comment", body: `Security added a comment on ${staffUser.name}`, link: `/md/staff/${staffId}` })
    ),
  ]);

  res.status(201).json(newComment);
});

// GET /api/users/:id/comments
router.get("/:id/comments", requireRole("md", "hr", "security"), (req, res) => {
  const comments = storage.getCommentsByStaff(parseInt(req.params.id));
  res.json(comments);
});

export default router;
