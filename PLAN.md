# Hensek Company Management System — Implementation Plan

> Generated: 2026-04-16
> Project root: `C:\Users\user\Downloads\henseck`
> Stack: Node.js + Express + TypeScript | React + Vite | PostgreSQL + Drizzle ORM

---

## Phase 0: Documentation Discovery ✅ COMPLETE

### Verified APIs

| Library | Verified Pattern | Source |
|---|---|---|
| drizzle-orm | `drizzle(pool)` + `pgTable()` | npm README |
| drizzle-kit | `push:pg` (dev), `generate:pg` + `migrate` (prod) | CLI docs |
| drizzle-zod | `createInsertSchema(table, overrides?)` | npm README |
| connect-pg-simple | `new (pgSession(session))({ pool, tableName, createTableIfMissing: true })` | GitHub README |
| passport-local | `new LocalStrategy(options, verify)` — order: session → passport.initialize() → passport.session() | npm README |
| ws | `new WebSocketServer({ server })` — broadcast via `wss.clients` Set | GitHub README |
| TanStack Query v5 | `useQuery({ queryKey, queryFn })`, `gcTime` (not `cacheTime`) | Official docs |
| Wouter v3 | `Switch`, `Route`, `Link`, `useLocation`, `useRoute`, `Redirect` | npm README |
| shadcn/ui | `npx shadcn@latest init` → `npx shadcn@latest add <component>` | Official docs |

### Anti-patterns to avoid
- ❌ `cacheTime` in TanStack Query v5 — use `gcTime`
- ❌ `isLoading` in TanStack Query v5 — use `isPending`
- ❌ `npx shadcn-ui@latest` (old) — use `npx shadcn@latest`
- ❌ Calling `passport.session()` before `express-session` — always session first
- ❌ `drizzle-kit push` in production — use `generate` + `migrate`

---

## Phase 1: Project Scaffold & Configuration

### Goal
Stand up the monorepo skeleton with all configs wired together. No features yet — just zero-error startup.

### Directory structure to create
```
henseck/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/           # shadcn/ui components go here
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── components.json       # shadcn/ui config
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts     # All Drizzle table definitions
│   │   │   └── index.ts      # drizzle(pool) export
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── lib/
│   │   └── index.ts          # Express app entry
│   └── tsconfig.json
├── drizzle/                  # Generated migration files
├── drizzle.config.ts
├── package.json              # Root — scripts only
├── .env
├── .env.example
└── PLAN.md
```

### Files to create

**Root `package.json`** — workspace scripts:
```json
{
  "name": "hensek",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npx tsx watch src/index.ts",
    "dev:client": "cd client && npx vite",
    "build": "npm run build:server && npm run build:client",
    "build:server": "cd server && npx tsc",
    "build:client": "cd client && npx vite build",
    "db:push": "npx drizzle-kit push",
    "db:generate": "npx drizzle-kit generate",
    "db:migrate": "npx drizzle-kit migrate",
    "db:studio": "npx drizzle-kit studio"
  }
}
```

**Root `drizzle.config.ts`**:
```typescript
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./server/src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

**`client/vite.config.ts`**:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
      "/ws": { target: "ws://localhost:5000", ws: true },
    },
  },
});
```

**`client/tailwind.config.ts`** — Hensek cream/yellow theme:
```typescript
import type { Config } from "tailwindcss";
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "hensek-cream": "#FEFCE8",
        "hensek-warm": "#F5F0DC",
        "hensek-yellow": "#EAB308",
        "hensek-dark": "#1C1917",
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem", "3xl": "1.5rem" },
      backgroundImage: {
        "hensek-gradient": "linear-gradient(135deg, #F5F0DC 0%, #FEFCE8 50%, #FEF9C3 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

**`client/src/index.css`** — CSS variables for shadcn/ui + Hensek palette:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 55 100% 97%;        /* cream */
    --foreground: 20 14% 10%;
    --card: 0 0% 100%;
    --card-foreground: 20 14% 10%;
    --primary: 47 97% 48%;            /* yellow */
    --primary-foreground: 20 14% 10%;
    --secondary: 55 90% 93%;
    --secondary-foreground: 20 14% 10%;
    --muted: 55 50% 93%;
    --muted-foreground: 20 14% 45%;
    --accent: 47 97% 48%;
    --accent-foreground: 20 14% 10%;
    --border: 55 30% 85%;
    --input: 55 30% 85%;
    --ring: 47 97% 48%;
    --radius: 1rem;
  }
}

body {
  background: linear-gradient(135deg, #F5F0DC 0%, #FEFCE8 50%, #FEF9C3 100%);
  min-height: 100vh;
}
```

**`.env.example`**:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/hensek
SESSION_SECRET=change-me-in-production-use-random-64-chars
NODE_ENV=development
PORT=5000
RESEND_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### Server dependencies to install
```bash
# Server
cd server
npm install express express-session passport passport-local connect-pg-simple
npm install drizzle-orm drizzle-zod pg ws nodemailer multer
npm install @types/express @types/express-session @types/passport @types/passport-local
npm install @types/connect-pg-simple @types/pg @types/ws @types/nodemailer @types/multer
npm install -D typescript tsx drizzle-kit zod
npm install resend

# Client
cd client
npm install react react-dom wouter @tanstack/react-query lucide-react
npm install -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer tailwindcss-animate typescript
npm install class-variance-authority clsx tailwind-merge
npx shadcn@latest init   # interactive — choose: Default style, Yes to CSS variables, Slate base
npx shadcn@latest add button card badge avatar dropdown-menu dialog input label select tabs progress separator scroll-area table tooltip popover calendar
```

### Verification checklist
- [ ] `npm run dev:server` starts on port 5000, logs "Server running"
- [ ] `npm run dev:client` starts Vite on port 5173
- [ ] `GET http://localhost:5173` returns React app (no console errors)
- [ ] `GET http://localhost:5173/api/health` proxies to server and returns `{ ok: true }`

---

## Phase 2: Database Schema

### Goal
Define all Drizzle tables, relations, and drizzle-zod validation schemas. Run `db:push` to create tables.

### Tables to define in `server/src/db/schema.ts`

```typescript
// --- Users & Auth ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("employee"),
  // "admin" | "hr" | "manager" | "employee"
  avatarUrl: varchar("avatar_url", { length: 500 }),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  hireDate: timestamp("hire_date"),
  isApproved: boolean("is_approved").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- Departments ---
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  managerId: integer("manager_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Hiring: Job Postings ---
export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  department: varchar("department", { length: 100 }),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("open"),
  // "open" | "closed" | "draft"
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Hiring: Applicants ---
export const applicants = pgTable("applicants", {
  id: serial("id").primaryKey(),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  resumeUrl: varchar("resume_url", { length: 500 }),
  stage: varchar("stage", { length: 50 }).default("applied"),
  // "applied" | "screening" | "interview" | "offer" | "hired" | "rejected"
  notes: text("notes"),
  appliedAt: timestamp("applied_at").defaultNow(),
});

// --- Devices ---
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }),
  // "laptop" | "phone" | "tablet" | "monitor" | "other"
  serialNumber: varchar("serial_number", { length: 100 }),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  condition: varchar("condition", { length: 50 }).default("good"),
  assignedAt: timestamp("assigned_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Apps / Software ---
export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  licenseCount: integer("license_count").default(0),
  iconUrl: varchar("icon_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appAssignments = pgTable("app_assignments", {
  id: serial("id").primaryKey(),
  appId: integer("app_id").references(() => apps.id),
  userId: integer("user_id").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// --- Salary / Payroll ---
export const salaryRecords = pgTable("salary_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  baseSalary: integer("base_salary").notNull(),     // in cents
  currency: varchar("currency", { length: 10 }).default("USD"),
  effectiveDate: timestamp("effective_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payrollRuns = pgTable("payroll_runs", {
  id: serial("id").primaryKey(),
  period: varchar("period", { length: 20 }).notNull(),  // "2025-09"
  status: varchar("status", { length: 50 }).default("draft"),
  totalAmount: integer("total_amount"),
  runAt: timestamp("run_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Calendar Events ---
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  attendees: text("attendees"),   // JSON array of user IDs
  color: varchar("color", { length: 50 }).default("yellow"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Performance Reviews ---
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  revieweeId: integer("reviewee_id").references(() => users.id),
  reviewerId: integer("reviewer_id").references(() => users.id),
  period: varchar("period", { length: 20 }),          // "Q3-2025"
  rating: integer("rating"),                           // 1-5
  feedback: text("feedback"),
  status: varchar("status", { length: 50 }).default("pending"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Onboarding Tasks ---
export const onboardingTasks = pgTable("onboarding_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- Notifications ---
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Drizzle-zod schemas to export
```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  role: z.enum(["admin", "hr", "manager", "employee"]),
});
// ... one per table used in API routes
```

### Verification checklist
- [ ] `npm run db:push` exits without error
- [ ] `npm run db:studio` opens Drizzle Studio showing all tables
- [ ] All FK references resolve (no missing table errors)

---

## Phase 3: Backend Auth & Core Server

### Goal
Working Express server with session auth, Passport.js, WebSocket, and health endpoints.

### `server/src/index.ts` structure
```typescript
import express from "express";
import { createServer } from "http";
import session from "express-session";
import pgSession from "connect-pg-simple";
import passport from "passport";
import { WebSocketServer } from "ws";
import { pool } from "./db";
import { configurePassport } from "./lib/passport";
import { setupWebSocket } from "./lib/websocket";
import { authRouter } from "./routes/auth";
// ... other routers

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session store (connect-pg-simple)
const PgStore = pgSession(session);
app.use(session({
  store: new PgStore({ pool, tableName: "session", createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production", httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// Passport — order is critical
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// WebSocket
const wss = new WebSocketServer({ server });
setupWebSocket(wss);

// Routes
app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
// ... mount all routers

server.listen(process.env.PORT || 5000, () =>
  console.log(`Hensek server running on port ${process.env.PORT || 5000}`)
);
```

### `server/src/lib/passport.ts`
```typescript
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export function configurePassport() {
  passport.use(new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) return done(null, false, { message: "User not found" });
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return done(null, false, { message: "Invalid password" });
        return done(null, user);
      } catch (err) { return done(err); }
    }
  ));
  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      done(null, user ?? false);
    } catch (err) { done(err); }
  });
}
```

### Auth routes: `server/src/routes/auth.ts`
- `POST /api/auth/login` → `passport.authenticate("local")`
- `POST /api/auth/logout` → `req.logout()`
- `GET /api/auth/me` → return `req.user` or 401
- `POST /api/auth/register` → hash password, insert user (admin-only or open)

### Role middleware: `server/src/middleware/auth.ts`
```typescript
export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Not authenticated" });
}
export function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
```

### WebSocket: `server/src/lib/websocket.ts`
```typescript
import { WebSocketServer, WebSocket } from "ws";
export function setupWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ type: "connected" }));
    ws.on("message", (data) => {
      // Handle message types: ping, subscribe, etc.
    });
  });
}
export function broadcast(wss: WebSocketServer, payload: object) {
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}
```

### Verification checklist
- [ ] `POST /api/auth/login` with valid credentials returns 200 + user object
- [ ] `GET /api/auth/me` with valid session returns user
- [ ] `GET /api/auth/me` without session returns 401
- [ ] WebSocket client connects and receives `{ type: "connected" }`

---

## Phase 4: Backend API Routes

### Goal
All CRUD routes for every module, multer for avatar uploads.

### Routes to implement

| Router file | Endpoints |
|---|---|
| `routes/employees.ts` | `GET /api/employees`, `GET /api/employees/:id`, `POST /api/employees`, `PUT /api/employees/:id`, `DELETE /api/employees/:id`, `POST /api/employees/:id/avatar` |
| `routes/hiring.ts` | `GET /api/hiring/jobs`, `POST /api/hiring/jobs`, `GET /api/hiring/jobs/:id/applicants`, `POST /api/hiring/applicants`, `PUT /api/hiring/applicants/:id/stage` |
| `routes/devices.ts` | `GET /api/devices`, `POST /api/devices`, `PUT /api/devices/:id`, `DELETE /api/devices/:id` |
| `routes/apps.ts` | `GET /api/apps`, `POST /api/apps`, `PUT /api/apps/:id/assign` |
| `routes/salary.ts` | `GET /api/salary/records`, `POST /api/salary/records`, `GET /api/salary/payroll` |
| `routes/calendar.ts` | `GET /api/calendar/events`, `POST /api/calendar/events`, `PUT /api/calendar/events/:id`, `DELETE /api/calendar/events/:id` |
| `routes/reviews.ts` | `GET /api/reviews`, `POST /api/reviews`, `PUT /api/reviews/:id` |
| `routes/notifications.ts` | `GET /api/notifications`, `PUT /api/notifications/:id/read` |
| `routes/dashboard.ts` | `GET /api/dashboard/stats` (employee count, hiring count, projects count) |

### Multer setup for avatar uploads
```typescript
import multer from "multer";
const storage = multer.diskStorage({
  destination: "uploads/avatars/",
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
export const avatarUpload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
```

### Verification checklist
- [ ] `GET /api/employees` returns array (empty ok)
- [ ] `POST /api/employees` with valid body creates record
- [ ] `GET /api/dashboard/stats` returns `{ employees, hirings, projects }`
- [ ] File upload endpoint saves file and returns URL

---

## Phase 5: Frontend Foundation

### Goal
React shell with routing, auth context, layout components, and Hensek visual theme.

### `client/src/App.tsx` structure
```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import DashboardLayout from "./components/layout/DashboardLayout";
// page imports...

function ProtectedApp() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullscreenLoader />;
  if (!user) return <Redirect href="/login" />;
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/people" component={PeoplePage} />
        <Route path="/hiring" component={HiringPage} />
        <Route path="/devices" component={DevicesPage} />
        <Route path="/apps" component={AppsPage} />
        <Route path="/salary" component={SalaryPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/reviews" component={ReviewsPage} />
        <Route path="/settings" component={SettingsPage} />
      </Switch>
    </DashboardLayout>
  );
}
```

### `useAuth` hook
```typescript
// GET /api/auth/me on mount, expose user, login(), logout()
export function useAuth() {
  const { data: user, isPending: isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => fetch("/api/auth/me").then(r => r.ok ? r.json() : null),
    retry: false,
    staleTime: Infinity,
  });
  return { user, isLoading };
}
```

### `DashboardLayout` component
```
┌─────────────────────────────────────────────────────┐
│  TopNav: [Hensek logo] [nav pills] [notif] [avatar] │
├─────────────────────────────────────────────────────┤
│  <children> (full page, cream/yellow gradient bg)   │
└─────────────────────────────────────────────────────┘
```

- **TopNav**: Dark pill-shaped navigation (matching Crextio design)
  - Links: Dashboard, People, Hiring, Devices, Apps, Salary, Calendar, Reviews
  - Right side: Settings icon, notification bell, user avatar
- **No sidebar** — top nav only (matching reference design)

### Hensek card component pattern
```tsx
// All cards use: bg-white rounded-2xl shadow-sm p-4 (or p-6)
// shadcn Card with custom className
<Card className="bg-white rounded-2xl shadow-sm border-0">
  <CardContent className="p-6">...</CardContent>
</Card>
```

### Verification checklist
- [ ] `/login` shows login form; invalid creds show error
- [ ] Valid login redirects to `/`
- [ ] TopNav renders all links; active link is visually distinct
- [ ] Body has cream/yellow gradient background
- [ ] Cards are white with rounded corners and soft shadow

---

## Phase 6: Dashboard Page

### Goal
Pixel-faithful recreation of the Crextio-inspired dashboard.

### Layout (CSS Grid)
```
Row 1: [Stats bar: Welcome text + Interviews/Hired/Project time/Output progress bars]  [Employees 78] [Hirings 56] [Projects 203]
Row 2: [Employee card (avatar + name + role + salary)]  [Progress chart]  [Time tracker]  [Onboarding % + progress bars]
Row 3: [Accordion (Pension/Devices/Compensation/Benefits)]  [Calendar (week view)]  [Onboarding task list]
```

### Components to build
1. **StatsBar** — horizontal bar with 4 metrics + mini progress bars
2. **KPICard** — icon + large number + label (Employees, Hirings, Projects)
3. **EmployeeSpotlight** — featured employee card with avatar, name, role, salary badge
4. **ProgressChart** — bar chart (S/M/T/W/T/F/S) with yellow highlight bar — use plain SVG or a simple recharts bar
5. **TimeTracker** — circular countdown display (02:35) with play/pause
6. **OnboardingProgress** — percentage + stacked progress bar (yellow/dark/gray segments)
7. **AccordionPanel** — shadcn Accordion for Pension contributions / Devices / Compensation / Benefits
8. **WeekCalendar** — 5-day week grid with event pills (yellow highlighted)
9. **OnboardingTaskList** — numbered task list with dates and status dots

### Data hooks
```typescript
useQuery({ queryKey: ["dashboard", "stats"], queryFn: () => fetch("/api/dashboard/stats").then(r => r.json()) })
useQuery({ queryKey: ["onboarding-tasks"], queryFn: ... })
useQuery({ queryKey: ["calendar", "events", weekRange], queryFn: ... })
```

### Verification checklist
- [ ] Stats show live data from API
- [ ] Progress chart renders without errors
- [ ] Calendar shows current week
- [ ] Onboarding tasks list with completion count (e.g. "2/8")

---

## Phase 7: Module Pages

### People page
- Employee grid/table with avatar, name, role, department
- "Add Employee" dialog (shadcn Dialog + form)
- Click employee → detail panel / modal
- Role filter tabs (All / HR / Manager / Employee)

### Hiring page
- Job postings list with status badges
- Kanban-style applicant pipeline per job (columns: Applied → Screening → Interview → Offer → Hired)
- "Post New Job" form
- Applicant card with drag-to-stage (or simple button progression)

### Devices page
- Table: Device name, type, assigned to, condition
- Assign/unassign controls
- Status badge (Available / Assigned / Maintenance)

### Apps page
- App grid cards with icon, name, license count, assigned users
- Assign app to employee

### Salary page
- Table of employees with salary, last updated
- "Pension contributions" accordion (matching dashboard)
- "Compensation Summary" section
- "Employee Benefits" section

### Calendar page
- Full month/week calendar view
- Create event dialog (title, date/time, attendees)
- Events shown as colored pills

### Reviews page
- Review list: reviewee, reviewer, period, rating stars, status
- "Start Review" form
- Status badges: Pending / In Progress / Completed

### Verification checklist
- [ ] Each page loads without errors
- [ ] CRUD operations update the list without full page reload (TanStack Query invalidation)
- [ ] Forms use drizzle-zod-derived validation (via zod on client)

---

## Phase 8: Real-time Features (WebSocket)

### Goal
Live notifications and dashboard stat updates via WebSocket.

### `useWebSocket` hook
```typescript
export function useWebSocket() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const ws = new WebSocket(`ws://${location.host}/ws`);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "employee:added") queryClient.invalidateQueries({ queryKey: ["employees"] });
      if (msg.type === "notification") queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // etc.
    };
    return () => ws.close();
  }, [queryClient]);
}
```

### Server-side broadcast triggers
- After `POST /api/employees` → broadcast `{ type: "employee:added" }`
- After creating notification → broadcast to specific user connection
- After hiring stage change → broadcast to HR users

### Notification bell
- Badge count from `GET /api/notifications` (unread count)
- Dropdown list of recent notifications
- Mark as read on click → `PUT /api/notifications/:id/read`

### Verification checklist
- [ ] Opening two browser tabs — action in tab 1 reflects in tab 2 within 1s
- [ ] Notification bell count updates on new notification
- [ ] No WebSocket connection errors in browser console

---

## Phase 9: Polish & Verification

### Final checks
- [ ] All pages are responsive (works at 1280px and 1440px)
- [ ] Login page has Hensek branding and gradient background
- [ ] 404 page exists
- [ ] All API errors surface as toast notifications (shadcn Toaster)
- [ ] File uploads (avatars) work end-to-end
- [ ] `npm run build` (both client and server) exits without TypeScript errors
- [ ] No `any` types in critical paths (schema, routes, hooks)
- [ ] `.env.example` documents all variables
- [ ] `README.md` has setup instructions: clone → npm install → set .env → db:push → npm run dev

### Anti-pattern grep checks
```bash
grep -r "cacheTime" client/src/      # should return nothing (use gcTime)
grep -r "isLoading" client/src/       # flag — should be isPending in TanStack Query v5
grep -r "any" server/src/routes/      # flag obvious type gaps
```

---

## Execution Order Summary

| Phase | What | Key files |
|---|---|---|
| 1 | Scaffold + configs | package.json, vite.config.ts, tailwind.config.ts, tsconfig.json, .env |
| 2 | DB schema | server/src/db/schema.ts, drizzle.config.ts |
| 3 | Auth + server | server/src/index.ts, lib/passport.ts, lib/websocket.ts, routes/auth.ts |
| 4 | API routes | server/src/routes/*.ts |
| 5 | Frontend shell | client/src/App.tsx, hooks/useAuth.ts, components/layout/* |
| 6 | Dashboard | client/src/pages/DashboardPage.tsx + widgets |
| 7 | Module pages | client/src/pages/*.tsx |
| 8 | Real-time | hooks/useWebSocket.ts + server broadcast |
| 9 | Polish | build check, responsive, error states |
