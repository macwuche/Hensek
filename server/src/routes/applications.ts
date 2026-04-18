import { Router } from "express";
import multer from "multer";
import path from "path";
import { storage } from "../lib/storage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { broadcastToRole, broadcastToUser } from "../lib/websocket.js";

const router = Router();

const docStorage = multer.diskStorage({
  destination: "uploads/documents/",
  filename: (_, file, cb) => cb(null, `doc-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage: docStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// HR_JURISDICTION types — HR can approve directly
const HR_TYPES = ["leave", "schedule_change", "training"];

// POST /api/applications — any authenticated staff
router.post("/", requireAuth, upload.single("attachment"), async (req, res) => {
  const { type, title, description, startDate, endDate } = req.body;

  if (!type || !title || !description) {
    return res.status(400).json({ error: "type, title, and description are required" });
  }

  const attachmentUrl = req.file ? `/uploads/documents/${req.file.filename}` : undefined;

  const app = await storage.createApplication({
    userId: req.user!.id,
    type,
    title,
    description,
    status: "pending",
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    attachmentUrl,
  });

  const user = storage.getUserById(req.user!.id);

  // Notify HR
  await Promise.all(storage.getUsersByRole("hr").map(hr =>
    storage.createNotification({
      userId: hr.id,
      type: "new_application",
      title: "New Application",
      body: `${user?.name} submitted a ${type} application.`,
      link: "/hr/applications",
    })
  ));
  broadcastToRole("hr", { type: "new_application", application: app, userName: user?.name });

  res.status(201).json(app);
});

// GET /api/applications/my
router.get("/my", requireAuth, (req, res) => {
  const apps = storage.getApplicationsByUser(req.user!.id);
  res.json(apps);
});

// GET /api/applications — HR + MD see all
router.get("/", requireRole("md", "hr"), (req, res) => {
  const { status } = req.query;
  let apps = storage.getAllApplications();

  if (req.user!.role === "hr") {
    // HR only sees non-escalated or pending
    apps = apps.filter(a => a.status !== "escalated_to_md" || HR_TYPES.includes(a.type));
  }

  if (status) apps = apps.filter(a => a.status === status);

  // Enrich with user info
  const enriched = apps.map(a => ({
    ...a,
    user: (() => { const u = storage.getUserById(a.userId); return u ? { id: u.id, name: u.name, departmentSlug: u.departmentSlug, employeeId: u.employeeId } : null; })(),
  }));

  res.json(enriched);
});

// GET /api/applications/escalated — MD only
router.get("/escalated", requireRole("md"), (req, res) => {
  const apps = storage.getEscalatedApplications().map(a => ({
    ...a,
    user: (() => { const u = storage.getUserById(a.userId); return u ? { id: u.id, name: u.name, departmentSlug: u.departmentSlug } : null; })(),
  }));
  res.json(apps);
});

// GET /api/applications/:id
router.get("/:id", requireAuth, (req, res) => {
  const app = storage.getApplicationById(parseInt(req.params.id));
  if (!app) return res.status(404).json({ error: "Application not found" });
  // Staff can only see their own
  if (req.user!.role === "staff" && app.userId !== req.user!.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json(app);
});

// PATCH /api/applications/:id/review — HR reviews (can approve HR types or escalate others)
router.patch("/:id/review", requireRole("hr", "md"), async (req, res) => {
  const { action, comment } = req.body;
  const app = storage.getApplicationById(parseInt(req.params.id));
  if (!app) return res.status(404).json({ error: "Application not found" });

  let newStatus = app.status;
  const isHrType = HR_TYPES.includes(app.type);

  if (req.user!.role === "hr") {
    if (action === "approve" && isHrType) newStatus = "approved";
    else if (action === "reject" && isHrType) newStatus = "rejected";
    else if (action === "escalate" || (!isHrType && action === "approve")) newStatus = "escalated_to_md";
    else newStatus = "hr_review";
  } else if (req.user!.role === "md") {
    if (action === "approve") newStatus = "md_approved";
    else if (action === "reject") newStatus = "md_rejected";
  }

  const updated = await storage.updateApplication(app.id, {
    status: newStatus,
    hrComment: req.user!.role === "hr" ? comment : app.hrComment,
    mdComment: req.user!.role === "md" ? comment : app.mdComment,
    reviewedBy: req.user!.id,
  });

  // Notify applicant
  const statusMessages: Record<string, string> = {
    approved: "Your application has been approved by HR.",
    rejected: "Your application has been rejected by HR.",
    escalated_to_md: "Your application has been forwarded to the MD for review.",
    md_approved: "Your application has been approved by the Managing Director.",
    md_rejected: "Your application has been rejected by the Managing Director.",
  };

  if (statusMessages[newStatus]) {
    await storage.createNotification({
      userId: app.userId,
      type: "application_update",
      title: "Application Update",
      body: statusMessages[newStatus],
      link: "/dashboard/applications",
    });
    broadcastToUser(app.userId, { type: "application_update", status: newStatus });
  }

  // If escalated, notify MD
  if (newStatus === "escalated_to_md") {
    await Promise.all(storage.getUsersByRole("md").map(md =>
      storage.createNotification({
        userId: md.id,
        type: "escalated_application",
        title: "Application Escalated",
        body: `HR escalated a ${app.type} application for your review.`,
        link: "/md/applications",
      })
    ));
    broadcastToRole("md", { type: "escalated_application" });
  }

  res.json(updated);
});

export default router;
