import { Router } from "express";
import { storage } from "../lib/storage.js";
import { requireRole } from "../middleware/auth.js";
import { generateSecurityReportPDF, generateSafetyReportPDF } from "../lib/pdf.js";
import { sendEmail, buildReportEmail } from "../lib/email.js";

const router = Router();

// POST /api/reports/security/generate — Security + MD
router.post("/security/generate", requireRole("security", "md"), async (req, res) => {
  const { type, from, to } = req.body;
  if (!type || !from || !to) return res.status(400).json({ error: "type, from, and to are required" });

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const visitors = storage.getVisitorsInRange(fromDate, toDate);
  const usersMap = new Map(storage.getAllUsers().map(u => [u.id, u]));

  const period = `${fromDate.toLocaleDateString()} – ${toDate.toLocaleDateString()}`;

  const report = await storage.createSecurityReport({
    type,
    period,
    generatedBy: req.user!.id,
    visitorsCount: visitors.length,
    incidentsCount: 0,
  });

  const pdfBuffer = await generateSecurityReportPDF(visitors, period, type, usersMap);

  // Auto-email to CSO
  const securityDept = storage.getDeptBySlug("security");
  const csoEmail = securityDept?.csoEmail || securityDept?.email;
  if (csoEmail) {
    const emailSent = await sendEmail({
      to: csoEmail,
      subject: `Hensek Security ${type === "weekly" ? "Weekly" : "Monthly"} Report — ${period}`,
      html: buildReportEmail(`Security ${type === "weekly" ? "Weekly" : "Monthly"}`, period),
      attachments: [{ filename: `security-report-${period}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
    });
    if (emailSent) {
      await storage.updateDept(securityDept!.id, {});
    }
  }

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="security-report-${period}.pdf"`,
    "X-Report-Id": report.id.toString(),
  });
  res.send(pdfBuffer);
});

// GET /api/reports/security — list past security reports
router.get("/security", requireRole("security", "md", "hr"), (req, res) => {
  res.json(storage.getAllSecurityReports());
});

// POST /api/reports/safety/generate — Safety + MD
router.post("/safety/generate", requireRole("safety", "md"), async (req, res) => {
  const { type, from, to } = req.body;
  if (!type || !from || !to) return res.status(400).json({ error: "type, from, and to are required" });

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const period = `${fromDate.toLocaleDateString()} – ${toDate.toLocaleDateString()}`;

  const allAttendance = storage.getAllAttendance().filter(a => {
    const d = new Date(a.date);
    return d >= fromDate && d <= toDate;
  });

  const staffIds = [...new Set(allAttendance.map(a => a.userId))];
  const staffOnDuty = staffIds.map(id => storage.getUserById(id)).filter(Boolean) as any[];

  const duties = storage.getAllDuties().filter(d => {
    const date = new Date(d.date);
    return date >= fromDate && date <= toDate;
  });

  const sites = storage.getActiveSites();

  const enrichedDuties = duties.map(d => {
    const user = storage.getUserById(d.userId);
    const site = storage.getSiteById(d.siteId);
    return {
      siteName: site?.name || "Unknown",
      date: d.date,
      shiftStart: d.shiftStart,
      shiftEnd: d.shiftEnd,
      taskDescription: d.taskDescription,
      staffName: user?.name || "Unknown",
      status: d.status,
    };
  });

  const report = await storage.createSafetyReport({
    type,
    period,
    generatedBy: req.user!.id,
    staffOnDutyCount: staffOnDuty.length,
    sitesActiveCount: sites.length,
    incidentsCount: 0,
  });

  const pdfBuffer = await generateSafetyReportPDF({
    period,
    type,
    staffOnDuty,
    duties: enrichedDuties,
    sites: sites.map(s => ({ name: s.name, address: s.address })),
  });

  // Auto-email safety email
  const safetyDept = storage.getDeptBySlug("safety");
  const safetyEmail = safetyDept?.safetyEmail || safetyDept?.email;
  if (safetyEmail) {
    await sendEmail({
      to: safetyEmail,
      subject: `Hensek Safety ${type === "weekly" ? "Weekly" : "Monthly"} Report — ${period}`,
      html: buildReportEmail(`Safety ${type === "weekly" ? "Weekly" : "Monthly"}`, period),
      attachments: [{ filename: `safety-report-${period}.pdf`, content: pdfBuffer, contentType: "application/pdf" }],
    });
  }

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="safety-report-${period}.pdf"`,
    "X-Report-Id": report.id.toString(),
  });
  res.send(pdfBuffer);
});

// GET /api/reports/safety — list past safety reports
router.get("/safety", requireRole("safety", "md", "hr"), (req, res) => {
  res.json(storage.getAllSafetyReports());
});

export default router;
