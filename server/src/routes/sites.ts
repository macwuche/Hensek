import { Router } from "express";
import { storage } from "../lib/storage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/sites — all authenticated users can see sites
router.get("/", requireAuth, (req, res) => {
  const sites = storage.getActiveSites();
  res.json(sites);
});

// GET /api/sites/all — MD + Safety see all including inactive
router.get("/all", requireRole("md", "safety"), (req, res) => {
  res.json(storage.getAllSites());
});

// GET /api/sites/:id
router.get("/:id", requireAuth, (req, res) => {
  const site = storage.getSiteById(parseInt(req.params.id));
  if (!site) return res.status(404).json({ error: "Site not found" });

  const assignedDuties = storage.getAllDuties().filter(d => d.siteId === site.id);
  const staffOnSite = storage.getClockedInStaff().filter(u => {
    const today = new Date().toISOString().split("T")[0];
    const duty = storage.getDutiesByUser(u.id).find(d => d.date === today && d.siteId === site.id);
    return !!duty;
  });

  res.json({ ...site, staffOnSite: staffOnSite.map(({ passwordHash, ...u }) => u) });
});

// POST /api/sites — Safety + MD registers a work site
router.post("/", requireRole("md", "safety"), async (req, res) => {
  const { name, description, lat, lng, address } = req.body;
  if (!name || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: "name, lat, and lng are required" });
  }

  const site = await storage.createSite({
    name,
    description,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    address,
    registeredBy: req.user!.id,
  });

  res.status(201).json(site);
});

// PUT /api/sites/:id — Safety + MD
router.put("/:id", requireRole("md", "safety"), async (req, res) => {
  const { name, description, address, isActive } = req.body;
  const updated = await storage.updateSite(parseInt(req.params.id), { name, description, address, isActive });
  if (!updated) return res.status(404).json({ error: "Site not found" });
  res.json(updated);
});

// DELETE /api/sites/:id — MD only
router.delete("/:id", requireRole("md"), async (req, res) => {
  const deleted = await storage.deleteSite(parseInt(req.params.id));
  if (!deleted) return res.status(404).json({ error: "Site not found" });
  res.json({ message: "Site deleted" });
});

export default router;
