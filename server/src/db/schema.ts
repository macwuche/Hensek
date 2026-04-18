import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
  date,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  departmentId: integer("department_id"),
  departmentSlug: varchar("department_slug", { length: 64 }),
  status: varchar("status", { length: 32 }).notNull(),
  employeeId: varchar("employee_id", { length: 32 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  address: text("address"),
  avatarUrl: text("avatar_url"),
  hireDate: timestamp("hire_date", { withTimezone: true }),
  emergencyContact: varchar("emergency_contact", { length: 256 }),
  emergencyPhone: varchar("emergency_phone", { length: 64 }),
  lastLat: doublePrecision("last_lat"),
  lastLng: doublePrecision("last_lng"),
  lastLocationUpdate: timestamp("last_location_update", { withTimezone: true }),
  isOnline: boolean("is_online").notNull().default(false),
  isClockedIn: boolean("is_clocked_in").notNull().default(false),
  clockInTime: timestamp("clock_in_time", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  type: varchar("type", { length: 32 }).notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
  email: varchar("email", { length: 256 }),
  csoEmail: varchar("cso_email", { length: 256 }),
  safetyEmail: varchar("safety_email", { length: 256 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clockIn: timestamp("clock_in", { withTimezone: true }).notNull(),
  clockOut: timestamp("clock_out", { withTimezone: true }),
  breakStart: timestamp("break_start", { withTimezone: true }),
  breakEnd: timestamp("break_end", { withTimezone: true }),
  siteId: integer("site_id"),
  date: varchar("date", { length: 16 }).notNull(),
  totalMinutes: integer("total_minutes"),
  isOvertime: boolean("is_overtime").notNull().default(false),
  overtimeMinutes: integer("overtime_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  hrComment: text("hr_comment"),
  mdComment: text("md_comment"),
  reviewedBy: integer("reviewed_by"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  officeDestination: varchar("office_destination", { length: 256 }).notNull(),
  plateNumber: varchar("plate_number", { length: 64 }),
  purpose: text("purpose"),
  timeIn: timestamp("time_in", { withTimezone: true }).notNull(),
  timeOut: timestamp("time_out", { withTimezone: true }),
  registeredBy: integer("registered_by").notNull(),
  hostName: varchar("host_name", { length: 256 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  targetRoles: jsonb("target_roles").notNull().$type<string[]>(),
  priority: varchar("priority", { length: 16 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const workSites = pgTable("work_sites", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  address: text("address"),
  registeredBy: integer("registered_by").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const duties = pgTable("duties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  siteId: integer("site_id").notNull(),
  date: varchar("date", { length: 16 }).notNull(),
  shiftStart: varchar("shift_start", { length: 16 }).notNull(),
  shiftEnd: varchar("shift_end", { length: 16 }).notNull(),
  taskDescription: text("task_description").notNull(),
  assignedBy: integer("assigned_by").notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id", { length: 128 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  participants: jsonb("participants").notNull().$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 128 }).notNull(),
  senderId: integer("sender_id").notNull(),
  senderName: varchar("sender_name", { length: 256 }).notNull(),
  senderRole: varchar("sender_role", { length: 32 }).notNull(),
  content: text("content").notNull(),
  readBy: jsonb("read_by").notNull().$type<number[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staffComments = pgTable("staff_comments", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull(),
  authorId: integer("author_id").notNull(),
  authorName: varchar("author_name", { length: 256 }).notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const securityReports = pgTable("security_reports", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 16 }).notNull(),
  period: varchar("period", { length: 64 }).notNull(),
  generatedBy: integer("generated_by").notNull(),
  visitorsCount: integer("visitors_count").notNull(),
  incidentsCount: integer("incidents_count").notNull(),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const safetyReports = pgTable("safety_reports", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 16 }).notNull(),
  period: varchar("period", { length: 64 }).notNull(),
  generatedBy: integer("generated_by").notNull(),
  staffOnDutyCount: integer("staff_on_duty_count").notNull(),
  sitesActiveCount: integer("sites_active_count").notNull(),
  incidentsCount: integer("incidents_count").notNull(),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
