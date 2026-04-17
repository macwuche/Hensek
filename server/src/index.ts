import "dotenv/config";
import express from "express";
import { createServer } from "http";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import path from "path";
import { WebSocketServer } from "ws";
import { configurePassport } from "./lib/passport.js";
import { setupWebSocket } from "./lib/websocket.js";

// Routes
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import departmentsRouter from "./routes/departments.js";
import attendanceRouter from "./routes/attendance.js";
import applicationsRouter from "./routes/applications.js";
import visitorsRouter from "./routes/visitors.js";
import announcementsRouter from "./routes/announcements.js";
import sitesRouter from "./routes/sites.js";
import dutiesRouter from "./routes/duties.js";
import chatRouter from "./routes/chat.js";
import notificationsRouter from "./routes/notifications.js";
import reportsRouter from "./routes/reports.js";
import dashboardRouter from "./routes/dashboard.js";

const app = express();
const server = createServer(app);
const PORT = parseInt(process.env.PORT || "5000");

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads
app.use("/uploads", express.static(path.resolve("uploads")));

// Session (in-memory for now — will swap to connect-pg-simple on Replit)
app.use(session({
  secret: process.env.SESSION_SECRET || "hensek-dev-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  },
}));

// Passport — order is critical
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// ─── WebSocket ────────────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: "/ws" });
setupWebSocket(wss);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api/visitors", visitorsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/sites", sitesRouter);
app.use("/api/duties", dutiesRouter);
app.use("/api/chat", chatRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/dashboard", dashboardRouter);

// ─── Serve React in Production ────────────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve("../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_, res) => res.sendFile(path.join(clientDist, "index.html")));
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Error]", err.message);
  res.status(500).json({ error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Hensek server running on http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📋 Default accounts:`);
    console.log(`   MD:       admin@hensek.com    /  HensekAdmin2024!`);
    console.log(`   HR:       hr@hensek.com        /  HRPassword123!`);
    console.log(`   Safety:   safety@hensek.com   /  Safety123!`);
    console.log(`   Security: security@hensek.com /  Security123!`);
    console.log(`   Staff:    john.doe@hensek.com /  Staff123!\n`);
  }
});

export default app;
