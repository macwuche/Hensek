import { Router } from "express";
import { storage } from "../lib/storage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/dashboard/stats — role-specific stats
router.get("/stats", requireAuth, (req, res) => {
  const { role, id: userId } = req.user!;

  if (role === "md") {
    const stats = storage.getDashboardStats();
    const allUsers = storage.getAllUsers();
    const overtimeToday = storage.getAttendanceByDate(new Date().toISOString().split("T")[0]).filter(a => a.isOvertime);
    res.json({
      ...stats,
      overtimeToday: overtimeToday.length,
      suspendedAccounts: allUsers.filter(u => u.status === "suspended").length,
      totalDepts: storage.getAllDepts().length,
    });
  } else if (role === "hr") {
    const pending = storage.getPendingUsers();
    const apps = storage.getAllApplications();
    const today = new Date().toISOString().split("T")[0];
    res.json({
      totalStaff: storage.getActiveStaff().length,
      pendingApprovals: pending.length,
      pendingApplications: apps.filter(a => a.status === "pending").length,
      approvedToday: apps.filter(a => a.status === "approved" && a.updatedAt.toISOString().split("T")[0] === today).length,
      escalatedToMD: apps.filter(a => a.status === "escalated_to_md").length,
      recentApplications: apps.slice(0, 5).map(a => ({
        ...a,
        user: (() => { const u = storage.getUserById(a.userId); return u ? { name: u.name } : null; })(),
      })),
    });
  } else if (role === "safety") {
    const today = new Date().toISOString().split("T")[0];
    const todayDuties = storage.getDutiesByDate(today);
    const clockedIn = storage.getClockedInStaff();
    const online = storage.getOnlineStaff();
    res.json({
      clockedInToday: clockedIn.length,
      onlineNow: online.length,
      activeSites: storage.getActiveSites().length,
      todayDuties: todayDuties.length,
      staffOnSite: clockedIn.map(({ passwordHash, ...u }) => ({
        ...u,
        site: (() => {
          const duty = todayDuties.find(d => d.userId === u.id);
          return duty ? storage.getSiteById(duty.siteId) : null;
        })(),
      })),
    });
  } else if (role === "security") {
    const todayVisitors = storage.getTodayVisitors();
    const activeVisitors = todayVisitors.filter(v => !v.timeOut);
    res.json({
      todayVisitors: todayVisitors.length,
      currentlyOnSite: activeVisitors.length,
      checkedOut: todayVisitors.filter(v => v.timeOut).length,
      recentVisitors: todayVisitors.slice(0, 10),
    });
  } else {
    // Staff
    const myDuties = storage.getDutiesByUser(userId);
    const today = new Date().toISOString().split("T")[0];
    const todayDuty = myDuties.find(d => d.date === today);
    const myApps = storage.getApplicationsByUser(userId);
    const todayAttendance = storage.getTodayAttendanceByUser(userId);

    res.json({
      isClockedIn: storage.getUserById(userId)?.isClockedIn || false,
      todayDuty: todayDuty ? { ...todayDuty, site: storage.getSiteById(todayDuty.siteId) } : null,
      pendingApplications: myApps.filter(a => a.status === "pending").length,
      totalApplications: myApps.length,
      todayAttendance,
      recentDuties: myDuties.slice(0, 5).map(d => ({ ...d, site: storage.getSiteById(d.siteId) })),
    });
  }
});

export default router;
