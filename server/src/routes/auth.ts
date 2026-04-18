import { Router } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "../lib/storage.js";
import { requireAuth } from "../middleware/auth.js";
import { broadcast } from "../lib/websocket.js";
import { sendEmail, buildRegistrationEmail, buildPasswordResetEmail } from "../lib/email.js";
import type { UserRole } from "../types/index.js";

const PASSWORD_RESET_TTL_MINUTES = 60;

function appBaseUrl(req: { protocol: string; get: (h: string) => string | undefined }): string {
  return process.env.APP_URL || `${req.protocol}://${req.get("host") || "localhost"}`;
}

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone, address, departmentSlug, emergencyContact, emergencyPhone } = req.body;

    if (!email || !password || !name || !departmentSlug) {
      return res.status(400).json({ error: "email, password, name, and department are required" });
    }

    const existing = storage.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const dept = storage.getDeptBySlug(departmentSlug);
    if (!dept) return res.status(400).json({ error: "Department not found" });

    // MD and HR are not self-registerable — only staff and standard dept members
    if (dept.type === "md") return res.status(403).json({ error: "Cannot self-register as MD" });

    const passwordHash = await bcrypt.hash(password, 10);

    let role: UserRole = "staff";
    if (dept.type === "hr") role = "hr";
    else if (dept.type === "safety") role = "safety";
    else if (dept.type === "security") role = "security";

    const user = await storage.createUser({
      email,
      passwordHash,
      name,
      role,
      departmentId: dept.id,
      departmentSlug: dept.slug,
      status: "pending",
      phone,
      address,
      emergencyContact,
      emergencyPhone,
    });

    // Notify HR users of new registration
    const base = appBaseUrl(req);
    const hrUsers = storage.getUsersByRole("hr");
    const regEmail = buildRegistrationEmail(name, dept.name, `${base}/hr/approvals`);
    await Promise.all(hrUsers.map(async hr => {
      await storage.createNotification({
        userId: hr.id,
        type: "new_registration",
        title: "New Staff Registration",
        body: `${name} has registered and is awaiting approval.`,
        link: "/hr/approvals",
      });
      if (hr.email) {
        void sendEmail({ to: hr.email, subject: regEmail.subject, html: regEmail.html });
      }
    }));

    // Notify MD
    const mdUsers = storage.getUsersByRole("md");
    const mdRegEmail = buildRegistrationEmail(name, dept.name, `${base}/md/staff`);
    await Promise.all(mdUsers.map(async md => {
      if (md.email) {
        void sendEmail({ to: md.email, subject: mdRegEmail.subject, html: mdRegEmail.html });
      }
      await storage.createNotification({
        userId: md.id,
        type: "new_registration",
        title: "New Staff Registration",
        body: `${name} (${dept.name}) is pending approval.`,
        link: "/md/staff",
      });
    }));

    broadcast({ type: "new_registration", userName: name, dept: dept.name });

    res.status(201).json({ message: "Registration successful. Awaiting HR approval.", userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || "Login failed" });

    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      const fullUser = storage.getUserById(user.id);
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentSlug: user.departmentSlug,
          departmentId: user.departmentId,
          status: user.status,
          avatarUrl: fullUser?.avatarUrl,
          employeeId: fullUser?.employeeId,
        },
      });
    });
  })(req, res, next);
});

// POST /api/auth/logout
router.post("/logout", requireAuth, (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logged out successfully" });
  });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const fullUser = storage.getUserById(req.user!.id);
  if (!fullUser) return res.status(404).json({ error: "User not found" });
  const { passwordHash, ...safe } = fullUser;
  res.json(safe);
});

// PUT /api/auth/profile
router.put("/profile", requireAuth, async (req, res) => {
  const { name, phone, address, emergencyContact, emergencyPhone } = req.body;
  const updated = await storage.updateUser(req.user!.id, { name, phone, address, emergencyContact, emergencyPhone });
  if (!updated) return res.status(404).json({ error: "User not found" });
  const { passwordHash, ...safe } = updated;
  res.json(safe);
});

// PUT /api/auth/change-password
router.put("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = storage.getUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ error: "Current password is incorrect" });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  storage.updateUser(user.id, { passwordHash });
  res.json({ message: "Password changed successfully" });
});

// POST /api/auth/forgot-password — request a password reset email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = storage.getUserByEmail(email);
    // Always respond with success to avoid leaking which emails exist
    if (user && user.status !== "suspended") {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
      await storage.createPasswordReset(user.id, token, expiresAt);

      const base = appBaseUrl(req);
      const resetUrl = `${base}/reset-password?token=${token}`;
      const { subject, html } = buildPasswordResetEmail(user.name, resetUrl, PASSWORD_RESET_TTL_MINUTES);
      void sendEmail({ to: user.email, subject, html });
    }

    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/reset-password — consume a reset token and set a new password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const reset = await storage.getPasswordReset(token);
    if (!reset) return res.status(400).json({ error: "Invalid or expired reset link" });
    if (reset.usedAt) return res.status(400).json({ error: "This reset link has already been used" });
    if (reset.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "This reset link has expired" });
    }

    const user = storage.getUserById(reset.userId);
    if (!user) return res.status(400).json({ error: "Invalid reset link" });

    const passwordHash = await bcrypt.hash(password, 10);
    await storage.updateUser(user.id, { passwordHash });
    await storage.markPasswordResetUsed(reset.id);

    res.json({ message: "Password updated successfully. You can now sign in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
