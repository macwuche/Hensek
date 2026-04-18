import { Router } from "express";
import { storage } from "../lib/storage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { broadcast, broadcastToRole } from "../lib/websocket.js";

const router = Router();

// POST /api/attendance/clock-in
router.post("/clock-in", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const user = storage.getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.isClockedIn) return res.status(400).json({ error: "Already clocked in" });

  const today = new Date().toISOString().split("T")[0];
  const existing = storage.getTodayAttendanceByUser(userId);
  if (existing && !existing.clockOut) return res.status(400).json({ error: "Already have an open clock-in today" });

  const { siteId } = req.body;
  const clockInTime = new Date();

  const record = await storage.createAttendance({
    userId,
    clockIn: clockInTime,
    date: today,
    siteId: siteId ? parseInt(siteId) : undefined,
    isOvertime: false,
  });

  await storage.updateUser(userId, { isClockedIn: true, clockInTime });

  // Notify safety
  broadcastToRole("safety", {
    type: "staff_clocked_in",
    userId,
    userName: user.name,
    time: clockInTime,
    siteId,
  });

  broadcast({ type: "attendance_update" });

  res.json(record);
});

// POST /api/attendance/clock-out
router.post("/clock-out", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const user = storage.getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!user.isClockedIn) return res.status(400).json({ error: "Not clocked in" });

  const today = new Date().toISOString().split("T")[0];
  const record = storage.getTodayAttendanceByUser(userId);
  if (!record) return res.status(400).json({ error: "No clock-in record found" });

  const clockOut = new Date();
  const totalMinutes = Math.floor((clockOut.getTime() - record.clockIn.getTime()) / 60000);
  const standardMinutes = 8 * 60; // 8 hour standard day
  const isOvertime = totalMinutes > standardMinutes;
  const overtimeMinutes = isOvertime ? totalMinutes - standardMinutes : 0;

  const updated = await storage.updateAttendance(record.id, {
    clockOut,
    totalMinutes,
    isOvertime,
    overtimeMinutes,
  });

  await storage.updateUser(userId, { isClockedIn: false, clockInTime: undefined });

  broadcastToRole("safety", { type: "staff_clocked_out", userId, userName: user.name, time: clockOut, totalMinutes });
  broadcast({ type: "attendance_update" });

  res.json(updated);
});

// POST /api/attendance/break-start
router.post("/break-start", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const record = storage.getTodayAttendanceByUser(userId);
  if (!record || !record.clockIn) return res.status(400).json({ error: "Not clocked in" });
  if (record.breakStart && !record.breakEnd) return res.status(400).json({ error: "Already on break" });

  const updated = await storage.updateAttendance(record.id, { breakStart: new Date() });
  res.json(updated);
});

// POST /api/attendance/break-end
router.post("/break-end", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const record = storage.getTodayAttendanceByUser(userId);
  if (!record || !record.breakStart) return res.status(400).json({ error: "Not on break" });

  const updated = await storage.updateAttendance(record.id, { breakEnd: new Date() });
  res.json(updated);
});

// GET /api/attendance/today — my today record
router.get("/today", requireAuth, (req, res) => {
  const record = storage.getTodayAttendanceByUser(req.user!.id);
  res.json(record || null);
});

// GET /api/attendance/my — all my records
router.get("/my", requireAuth, (req, res) => {
  const records = storage.getAttendanceByUser(req.user!.id);
  res.json(records);
});

// GET /api/attendance/all — HR, Safety, MD
router.get("/all", requireRole("md", "hr", "safety"), (req, res) => {
  const { date } = req.query;
  let records;
  if (date) {
    records = storage.getAttendanceByDate(date as string);
  } else {
    records = storage.getAllAttendance();
  }

  // Enrich with user names
  const enriched = records.map(r => {
    const user = storage.getUserById(r.userId);
    return { ...r, userName: user?.name, departmentSlug: user?.departmentSlug };
  });

  res.json(enriched);
});

// GET /api/attendance/user/:userId — HR + MD + Safety
router.get("/user/:userId", requireRole("md", "hr", "safety"), (req, res) => {
  const records = storage.getAttendanceByUser(parseInt(req.params.userId));
  res.json(records);
});

// GET /api/attendance/stats — dashboard stats
router.get("/stats", requireRole("md", "hr", "safety"), (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const todayRecords = storage.getAttendanceByDate(today);
  const clockedIn = storage.getClockedInStaff();
  const allAttendance = storage.getAllAttendance();
  const overtimeToday = todayRecords.filter(r => r.isOvertime).length;

  res.json({
    clockedInToday: todayRecords.length,
    currentlyClockedIn: clockedIn.length,
    overtimeToday,
    totalRecords: allAttendance.length,
  });
});

export default router;
