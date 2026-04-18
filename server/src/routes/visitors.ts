import { Router } from "express";
import { storage } from "../lib/storage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { broadcastToRole } from "../lib/websocket.js";

const router = Router();

// POST /api/visitors — Security logs a visitor
router.post("/", requireRole("security", "md"), async (req, res) => {
  const { name, phone, officeDestination, plateNumber, purpose, hostName } = req.body;
  if (!name) return res.status(400).json({ error: "Visitor name is required" });

  const visitor = await storage.createVisitor({
    name,
    phone,
    officeDestination: officeDestination || "Reception",
    plateNumber,
    purpose,
    hostName,
    timeIn: new Date(),
    registeredBy: req.user!.id,
  });

  broadcastToRole("security", { type: "new_visitor", visitor });
  broadcastToRole("md", { type: "new_visitor", visitor });

  res.status(201).json(visitor);
});

// PATCH /api/visitors/:id/checkout — mark visitor as checked out
router.patch("/:id/checkout", requireRole("security", "md"), async (req, res) => {
  const updated = await storage.updateVisitor(parseInt(req.params.id), { timeOut: new Date() });
  if (!updated) return res.status(404).json({ error: "Visitor not found" });
  broadcastToRole("security", { type: "visitor_checkout", visitorId: updated.id });
  res.json(updated);
});

// GET /api/visitors — Security + MD
router.get("/", requireRole("security", "md", "hr"), (req, res) => {
  const { date } = req.query;
  let visitors;
  if (date === "today") {
    visitors = storage.getTodayVisitors();
  } else if (date) {
    const from = new Date(date as string);
    const to = new Date(date as string);
    to.setDate(to.getDate() + 1);
    visitors = storage.getVisitorsInRange(from, to);
  } else {
    visitors = storage.getAllVisitors();
  }
  res.json(visitors);
});

// GET /api/visitors/today
router.get("/today", requireRole("security", "md", "hr", "safety"), (req, res) => {
  res.json(storage.getTodayVisitors());
});

// GET /api/visitors/active — visitors currently on-site
router.get("/active", requireRole("security", "md"), (req, res) => {
  const active = storage.getAllVisitors().filter(v => !v.timeOut);
  res.json(active);
});

// GET /api/visitors/:id
router.get("/:id", requireRole("security", "md", "hr"), (req, res) => {
  const v = storage.getVisitorById(parseInt(req.params.id));
  if (!v) return res.status(404).json({ error: "Visitor not found" });
  res.json(v);
});

export default router;
