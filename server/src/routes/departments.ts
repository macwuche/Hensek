import { Router } from "express";
import { storage } from "../lib/storage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/departments — anyone can see department list (for registration)
router.get("/", (req, res) => {
  const depts = storage.getAllDepts();
  res.json(depts);
});

// GET /api/departments/:slug
router.get("/:slug", requireAuth, (req, res) => {
  const dept = storage.getDeptBySlug(req.params.slug);
  if (!dept) return res.status(404).json({ error: "Department not found" });
  const staff = storage.getUsersByDeptSlug(dept.slug).map(({ passwordHash, ...u }) => u);
  res.json({ ...dept, staff });
});

// POST /api/departments — MD or HR only
router.post("/", requireRole("md", "hr"), (req, res) => {
  const { name, description, email } = req.body;
  if (!name) return res.status(400).json({ error: "Department name is required" });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const existing = storage.getDeptBySlug(slug);
  if (existing) return res.status(409).json({ error: "Department with this name already exists" });

  const dept = storage.createDept({
    name,
    slug,
    type: "standard",
    description,
    email,
    createdBy: req.user!.id,
  });

  res.status(201).json(dept);
});

// PUT /api/departments/:id — MD only
router.put("/:id", requireRole("md"), (req, res) => {
  const { name, description, email, csoEmail, safetyEmail } = req.body;
  const updated = storage.updateDept(parseInt(req.params.id), { name, description, email, csoEmail, safetyEmail });
  if (!updated) return res.status(404).json({ error: "Department not found" });
  res.json(updated);
});

// DELETE /api/departments/:id — MD only
router.delete("/:id", requireRole("md"), (req, res) => {
  const dept = storage.getDeptById(parseInt(req.params.id));
  if (!dept) return res.status(404).json({ error: "Department not found" });
  if (["md", "hr", "safety", "security"].includes(dept.type)) {
    return res.status(400).json({ error: "Cannot delete core system departments" });
  }
  const deleted = storage.deleteDept(parseInt(req.params.id));
  res.json({ message: "Department deleted", deleted });
});

export default router;
