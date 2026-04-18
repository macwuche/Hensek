import "dotenv/config";
import express from "express";
import { createServer } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import passport from "passport";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
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
const IS_PROD = process.env.NODE_ENV === "production";

// Trust the deployment proxy (required for secure cookies + req.secure)
app.set("trust proxy", 1);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads
app.use("/uploads", express.static(path.resolve("uploads")));

// Session store — Postgres in production, in-memory in dev
let sessionStore: session.Store | undefined;
if (IS_PROD && process.env.DATABASE_URL) {
  const PgStore = connectPgSimple(session);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  sessionStore = new PgStore({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: true,
  });
}

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "hensek-dev-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: IS_PROD,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: IS_PROD ? "lax" : "lax",
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
if (IS_PROD) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // server source lives at server/src/index.ts; built client at client/dist
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get(/^\/(?!api|ws|uploads).*/, (_req, res) =>
    res.sendFile(path.join(clientDist, "index.html"))
  );
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Error]", err.message);
  res.status(500).json({ error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
});

const BIND_HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
server.listen(PORT, BIND_HOST, () => {
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
