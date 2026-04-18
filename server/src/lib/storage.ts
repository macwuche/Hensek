import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { db, pool } from "../db/index.js";
import * as s from "../db/schema.js";
import type {
  User, UserRole, UserStatus, Department, DeptType,
  AttendanceRecord, Application, ApplicationType, ApplicationStatus,
  Visitor, Announcement, WorkSite, DutyAssignment,
  ChatMessage, StaffComment, Notification,
  SecurityReport, SafetyReport, ChatRoom,
} from "../types/index.js";

// ─── Row → Domain mappers (typed; no `any`) ─────────────────────────────────
type UserRow = typeof s.users.$inferSelect;
type DepartmentRow = typeof s.departments.$inferSelect;
type AttendanceRow = typeof s.attendance.$inferSelect;
type ApplicationRow = typeof s.applications.$inferSelect;
type VisitorRow = typeof s.visitors.$inferSelect;
type AnnouncementRow = typeof s.announcements.$inferSelect;
type WorkSiteRow = typeof s.workSites.$inferSelect;
type DutyRow = typeof s.duties.$inferSelect;
type ChatRoomRow = typeof s.chatRooms.$inferSelect;
type ChatMessageRow = typeof s.chatMessages.$inferSelect;
type StaffCommentRow = typeof s.staffComments.$inferSelect;
type NotificationRow = typeof s.notifications.$inferSelect;
type SecurityReportRow = typeof s.securityReports.$inferSelect;
type SafetyReportRow = typeof s.safetyReports.$inferSelect;

const toUser = (r: UserRow): User => ({
  id: r.id,
  email: r.email,
  passwordHash: r.passwordHash,
  name: r.name,
  role: r.role as UserRole,
  departmentId: r.departmentId,
  departmentSlug: r.departmentSlug,
  status: r.status as UserStatus,
  employeeId: r.employeeId,
  phone: r.phone ?? undefined,
  address: r.address ?? undefined,
  avatarUrl: r.avatarUrl ?? undefined,
  hireDate: r.hireDate ?? undefined,
  emergencyContact: r.emergencyContact ?? undefined,
  emergencyPhone: r.emergencyPhone ?? undefined,
  lastLat: r.lastLat ?? undefined,
  lastLng: r.lastLng ?? undefined,
  lastLocationUpdate: r.lastLocationUpdate ?? undefined,
  isOnline: r.isOnline,
  isClockedIn: r.isClockedIn,
  clockInTime: r.clockInTime ?? undefined,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const toDept = (r: DepartmentRow): Department => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  type: r.type as DeptType,
  description: r.description ?? undefined,
  createdBy: r.createdBy,
  email: r.email ?? undefined,
  csoEmail: r.csoEmail ?? undefined,
  safetyEmail: r.safetyEmail ?? undefined,
  createdAt: r.createdAt,
});

const toAttendance = (r: AttendanceRow): AttendanceRecord => ({
  id: r.id,
  userId: r.userId,
  clockIn: r.clockIn,
  clockOut: r.clockOut ?? undefined,
  breakStart: r.breakStart ?? undefined,
  breakEnd: r.breakEnd ?? undefined,
  siteId: r.siteId ?? undefined,
  date: r.date,
  totalMinutes: r.totalMinutes ?? undefined,
  isOvertime: r.isOvertime,
  overtimeMinutes: r.overtimeMinutes ?? undefined,
  createdAt: r.createdAt,
});

const toApplication = (r: ApplicationRow): Application => ({
  id: r.id,
  userId: r.userId,
  type: r.type as ApplicationType,
  title: r.title,
  description: r.description,
  status: r.status as ApplicationStatus,
  startDate: r.startDate ?? undefined,
  endDate: r.endDate ?? undefined,
  hrComment: r.hrComment ?? undefined,
  mdComment: r.mdComment ?? undefined,
  reviewedBy: r.reviewedBy ?? undefined,
  attachmentUrl: r.attachmentUrl ?? undefined,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const toVisitor = (r: VisitorRow): Visitor => ({
  id: r.id,
  name: r.name,
  phone: r.phone ?? undefined,
  officeDestination: r.officeDestination,
  plateNumber: r.plateNumber ?? undefined,
  purpose: r.purpose ?? undefined,
  timeIn: r.timeIn,
  timeOut: r.timeOut ?? undefined,
  registeredBy: r.registeredBy,
  hostName: r.hostName ?? undefined,
  createdAt: r.createdAt,
});

const toAnnouncement = (r: AnnouncementRow): Announcement => ({
  id: r.id,
  title: r.title,
  content: r.content,
  authorId: r.authorId,
  targetRoles: r.targetRoles,
  priority: r.priority as Announcement["priority"],
  createdAt: r.createdAt,
  expiresAt: r.expiresAt ?? undefined,
});

const toSite = (r: WorkSiteRow): WorkSite => ({
  id: r.id,
  name: r.name,
  description: r.description ?? undefined,
  lat: r.lat,
  lng: r.lng,
  address: r.address ?? undefined,
  registeredBy: r.registeredBy,
  isActive: r.isActive,
  createdAt: r.createdAt,
});

const toDuty = (r: DutyRow): DutyAssignment => ({
  id: r.id,
  userId: r.userId,
  siteId: r.siteId,
  date: r.date,
  shiftStart: r.shiftStart,
  shiftEnd: r.shiftEnd,
  taskDescription: r.taskDescription,
  assignedBy: r.assignedBy,
  status: r.status as DutyAssignment["status"],
  createdAt: r.createdAt,
});

const toChatRoom = (r: ChatRoomRow): ChatRoom => ({
  id: r.id,
  name: r.name,
  type: r.type as ChatRoom["type"],
  participants: r.participants,
  createdAt: r.createdAt,
});

const toChatMessage = (r: ChatMessageRow): ChatMessage => ({
  id: r.id,
  roomId: r.roomId,
  senderId: r.senderId,
  senderName: r.senderName,
  senderRole: r.senderRole,
  content: r.content,
  readBy: r.readBy,
  createdAt: r.createdAt,
});

const toStaffComment = (r: StaffCommentRow): StaffComment => ({
  id: r.id,
  staffId: r.staffId,
  authorId: r.authorId,
  authorName: r.authorName,
  comment: r.comment,
  createdAt: r.createdAt,
});

const toNotification = (r: NotificationRow): Notification => ({
  id: r.id,
  userId: r.userId,
  type: r.type,
  title: r.title,
  body: r.body,
  read: r.read,
  link: r.link ?? undefined,
  createdAt: r.createdAt,
});

const toSecurityReport = (r: SecurityReportRow): SecurityReport => ({
  id: r.id,
  type: r.type as SecurityReport["type"],
  period: r.period,
  generatedBy: r.generatedBy,
  visitorsCount: r.visitorsCount,
  incidentsCount: r.incidentsCount,
  emailSentAt: r.emailSentAt ?? undefined,
  createdAt: r.createdAt,
});

const toSafetyReport = (r: SafetyReportRow): SafetyReport => ({
  id: r.id,
  type: r.type as SafetyReport["type"],
  period: r.period,
  generatedBy: r.generatedBy,
  staffOnDutyCount: r.staffOnDutyCount,
  sitesActiveCount: r.sitesActiveCount,
  incidentsCount: r.incidentsCount,
  emailSentAt: r.emailSentAt ?? undefined,
  createdAt: r.createdAt,
});

class Storage {
  // In-memory read caches, hydrated from Postgres at boot and kept in sync
  // by mutation methods that await the DB write before updating the cache.
  private users = new Map<number, User>();
  private departments = new Map<number, Department>();
  private attendance = new Map<number, AttendanceRecord>();
  private applications = new Map<number, Application>();
  private visitors = new Map<number, Visitor>();
  private announcements = new Map<number, Announcement>();
  private workSites = new Map<number, WorkSite>();
  private duties = new Map<number, DutyAssignment>();
  private chatMessages = new Map<number, ChatMessage>();
  private chatRooms = new Map<string, ChatRoom>();
  private staffComments = new Map<number, StaffComment>();
  private notifications = new Map<number, Notification>();
  private securityReports = new Map<number, SecurityReport>();
  private safetyReports = new Map<number, SafetyReport>();

  async init(): Promise<void> {
    const [
      uRows, dRows, aRows, appRows, vRows, anRows, wsRows,
      dtRows, crRows, cmRows, scRows, nRows, srRows, fRows,
    ] = await Promise.all([
      db.select().from(s.users),
      db.select().from(s.departments),
      db.select().from(s.attendance),
      db.select().from(s.applications),
      db.select().from(s.visitors),
      db.select().from(s.announcements),
      db.select().from(s.workSites),
      db.select().from(s.duties),
      db.select().from(s.chatRooms),
      db.select().from(s.chatMessages),
      db.select().from(s.staffComments),
      db.select().from(s.notifications),
      db.select().from(s.securityReports),
      db.select().from(s.safetyReports),
    ]);

    uRows.forEach(r => this.users.set(r.id, toUser(r)));
    dRows.forEach(r => this.departments.set(r.id, toDept(r)));
    aRows.forEach(r => this.attendance.set(r.id, toAttendance(r)));
    appRows.forEach(r => this.applications.set(r.id, toApplication(r)));
    vRows.forEach(r => this.visitors.set(r.id, toVisitor(r)));
    anRows.forEach(r => this.announcements.set(r.id, toAnnouncement(r)));
    wsRows.forEach(r => this.workSites.set(r.id, toSite(r)));
    dtRows.forEach(r => this.duties.set(r.id, toDuty(r)));
    crRows.forEach(r => this.chatRooms.set(r.id, toChatRoom(r)));
    cmRows.forEach(r => this.chatMessages.set(r.id, toChatMessage(r)));
    scRows.forEach(r => this.staffComments.set(r.id, toStaffComment(r)));
    nRows.forEach(r => this.notifications.set(r.id, toNotification(r)));
    srRows.forEach(r => this.securityReports.set(r.id, toSecurityReport(r)));
    fRows.forEach(r => this.safetyReports.set(r.id, toSafetyReport(r)));

    if (this.departments.size === 0 && this.users.size === 0) {
      await this.seed();
    }

    await this.syncSerialSequences();

    console.log(`[storage] Loaded ${this.users.size} users, ${this.departments.size} depts, ${this.attendance.size} attendance, ${this.applications.size} applications, ${this.visitors.size} visitors, ${this.announcements.size} announcements, ${this.workSites.size} sites, ${this.duties.size} duties, ${this.chatRooms.size} rooms, ${this.chatMessages.size} messages, ${this.notifications.size} notifications.`);
  }

  private async syncSerialSequences(): Promise<void> {
    const tables = [
      "users", "departments", "attendance", "applications", "visitors",
      "announcements", "work_sites", "duties", "chat_messages",
      "staff_comments", "notifications", "security_reports", "safety_reports",
      "password_resets",
    ];
    for (const t of tables) {
      await pool.query(
        `SELECT setval(pg_get_serial_sequence($1,'id'), COALESCE((SELECT MAX(id) FROM ${t}), 0) + 1, false)`,
        [t],
      );
    }
  }

  private async seed(): Promise<void> {
    const mdDept = await this.createDept({ name: "Managing Director", slug: "md", type: "md", createdBy: 0 });
    const hrDept = await this.createDept({ name: "Human Resources", slug: "hr", type: "hr", createdBy: 0 });
    const safetyDept = await this.createDept({ name: "Safety", slug: "safety", type: "safety", createdBy: 0 });
    const securityDept = await this.createDept({ name: "Security", slug: "security", type: "security", createdBy: 0 });
    const mediaDept = await this.createDept({ name: "Media", slug: "media", type: "standard", createdBy: 0 });

    const mk = async (
      email: string, password: string, name: string,
      role: UserRole, dept: Department, extras: Partial<User> = {},
    ): Promise<User> => {
      const passwordHash = await bcrypt.hash(password, 10);
      return this.createUser({
        email, passwordHash, name, role,
        departmentId: dept.id, departmentSlug: dept.slug, status: "active",
        ...extras,
      });
    };

    await mk("admin@hensek.com", "HensekAdmin2024!", "Managing Director", "md", mdDept);
    const hrUser = await mk("hr@hensek.com", "HRPassword123!", "HR Manager", "hr", hrDept, { phone: "+234 801 234 5678" });
    const safetyUser = await mk("safety@hensek.com", "Safety123!", "Safety Officer", "safety", safetyDept);
    await mk("security@hensek.com", "Security123!", "Security Officer", "security", securityDept);
    await mk("john.doe@hensek.com", "Staff123!", "John Doe", "staff", mediaDept, {
      phone: "+234 802 345 6789",
      address: "12 Victoria Island, Lagos",
      hireDate: new Date("2023-06-01"),
    });

    await this.createSite({
      name: "Main Office - Lagos",
      lat: 6.5244, lng: 3.3792,
      address: "1 Hensek Plaza, Victoria Island, Lagos",
      registeredBy: safetyUser.id,
    });
    await this.createSite({
      name: "Abuja Branch",
      lat: 9.0579, lng: 7.4951,
      address: "Plot 15, Garki, Abuja",
      registeredBy: safetyUser.id,
    });

    await this.createAnnouncement({
      title: "Welcome to Hensek Portal",
      content: "Welcome to the new Hensek Company Management System. Please ensure your profile is up to date.",
      authorId: hrUser.id,
      targetRoles: ["md", "hr", "safety", "security", "staff"],
      priority: "normal",
    });

    const rooms: Array<Omit<ChatRoom, "createdAt">> = [
      { id: "dept-md-hr", name: "MD ↔ HR", type: "dept_to_dept", participants: ["md", "hr"] },
      { id: "dept-md-safety", name: "MD ↔ Safety", type: "dept_to_dept", participants: ["md", "safety"] },
      { id: "dept-md-security", name: "MD ↔ Security", type: "dept_to_dept", participants: ["md", "security"] },
      { id: "dept-hr-safety", name: "HR ↔ Safety", type: "dept_to_dept", participants: ["hr", "safety"] },
      { id: "dept-hr-security", name: "HR ↔ Security", type: "dept_to_dept", participants: ["hr", "security"] },
      { id: "dept-safety-security", name: "Safety ↔ Security", type: "dept_to_dept", participants: ["safety", "security"] },
    ];
    for (const r of rooms) {
      await this.createChatRoom({ ...r, createdAt: new Date() });
    }
  }

  // ─── USERS ────────────────────────────────────────────────────────────────
  getUserById(id: number): User | undefined { return this.users.get(id); }
  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  getAllUsers(): User[] { return Array.from(this.users.values()); }
  getUsersByDeptSlug(slug: string): User[] { return Array.from(this.users.values()).filter(u => u.departmentSlug === slug); }
  getUsersByRole(role: string): User[] { return Array.from(this.users.values()).filter(u => u.role === role); }
  getPendingUsers(): User[] { return Array.from(this.users.values()).filter(u => u.status === "pending"); }
  getActiveStaff(): User[] { return Array.from(this.users.values()).filter(u => u.status === "active"); }
  getOnlineStaff(): User[] { return Array.from(this.users.values()).filter(u => u.isOnline && u.role === "staff"); }
  getClockedInStaff(): User[] { return Array.from(this.users.values()).filter(u => u.isClockedIn); }

  async createUser(
    data: Omit<User, "id" | "createdAt" | "updatedAt" | "isOnline" | "isClockedIn" | "employeeId">,
  ): Promise<User> {
    const insertValues = {
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      role: data.role,
      departmentId: data.departmentId,
      departmentSlug: data.departmentSlug,
      status: data.status,
      employeeId: "PENDING", // overwritten below using the assigned id
      phone: data.phone,
      address: data.address,
      avatarUrl: data.avatarUrl,
      hireDate: data.hireDate,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone,
      isOnline: false,
      isClockedIn: false,
    };
    const [inserted] = await db.insert(s.users).values(insertValues).returning();
    const employeeId = `EMP-${String(inserted.id).padStart(4, "0")}`;
    const [withEmp] = await db.update(s.users)
      .set({ employeeId })
      .where(eq(s.users.id, inserted.id))
      .returning();
    const user = toUser(withEmp);
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    if (!this.users.has(id)) return undefined;
    const [row] = await db.update(s.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(s.users.id, id))
      .returning();
    if (!row) return undefined;
    const user = toUser(row);
    this.users.set(id, user);
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(s.users).where(eq(s.users.id, id)).returning({ id: s.users.id });
    const ok = result.length > 0;
    if (ok) this.users.delete(id);
    return ok;
  }

  // ─── DEPARTMENTS ──────────────────────────────────────────────────────────
  getDeptById(id: number): Department | undefined { return this.departments.get(id); }
  getDeptBySlug(slug: string): Department | undefined {
    return Array.from(this.departments.values()).find(d => d.slug === slug);
  }
  getAllDepts(): Department[] { return Array.from(this.departments.values()); }

  async createDept(data: Omit<Department, "id" | "createdAt">): Promise<Department> {
    const [row] = await db.insert(s.departments).values(data).returning();
    const dept = toDept(row);
    this.departments.set(dept.id, dept);
    return dept;
  }

  async updateDept(id: number, data: Partial<Department>): Promise<Department | undefined> {
    if (!this.departments.has(id)) return undefined;
    const [row] = await db.update(s.departments).set(data).where(eq(s.departments.id, id)).returning();
    if (!row) return undefined;
    const dept = toDept(row);
    this.departments.set(id, dept);
    return dept;
  }

  async deleteDept(id: number): Promise<boolean> {
    const result = await db.delete(s.departments).where(eq(s.departments.id, id)).returning({ id: s.departments.id });
    const ok = result.length > 0;
    if (ok) this.departments.delete(id);
    return ok;
  }

  // ─── ATTENDANCE ───────────────────────────────────────────────────────────
  getAttendanceById(id: number): AttendanceRecord | undefined { return this.attendance.get(id); }
  getAttendanceByUser(userId: number): AttendanceRecord[] {
    return Array.from(this.attendance.values()).filter(a => a.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  getTodayAttendanceByUser(userId: number): AttendanceRecord | undefined {
    const today = new Date().toISOString().split("T")[0];
    return Array.from(this.attendance.values()).find(a => a.userId === userId && a.date === today);
  }
  getAllAttendance(): AttendanceRecord[] { return Array.from(this.attendance.values()); }
  getAttendanceByDate(date: string): AttendanceRecord[] {
    return Array.from(this.attendance.values()).filter(a => a.date === date);
  }

  async createAttendance(data: Omit<AttendanceRecord, "id" | "createdAt">): Promise<AttendanceRecord> {
    const [row] = await db.insert(s.attendance).values(data).returning();
    const rec = toAttendance(row);
    this.attendance.set(rec.id, rec);
    return rec;
  }

  async updateAttendance(id: number, data: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    if (!this.attendance.has(id)) return undefined;
    const [row] = await db.update(s.attendance).set(data).where(eq(s.attendance.id, id)).returning();
    if (!row) return undefined;
    const rec = toAttendance(row);
    this.attendance.set(id, rec);
    return rec;
  }

  // ─── APPLICATIONS ─────────────────────────────────────────────────────────
  getApplicationById(id: number): Application | undefined { return this.applications.get(id); }
  getApplicationsByUser(userId: number): Application[] {
    return Array.from(this.applications.values()).filter(a => a.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  getAllApplications(): Application[] {
    return Array.from(this.applications.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  getPendingApplications(): Application[] {
    return Array.from(this.applications.values()).filter(a => a.status === "pending" || a.status === "hr_review");
  }
  getEscalatedApplications(): Application[] {
    return Array.from(this.applications.values()).filter(a => a.status === "escalated_to_md");
  }

  async createApplication(data: Omit<Application, "id" | "createdAt" | "updatedAt">): Promise<Application> {
    const [row] = await db.insert(s.applications).values(data).returning();
    const app = toApplication(row);
    this.applications.set(app.id, app);
    return app;
  }

  async updateApplication(id: number, data: Partial<Application>): Promise<Application | undefined> {
    if (!this.applications.has(id)) return undefined;
    const [row] = await db.update(s.applications).set({ ...data, updatedAt: new Date() }).where(eq(s.applications.id, id)).returning();
    if (!row) return undefined;
    const app = toApplication(row);
    this.applications.set(id, app);
    return app;
  }

  // ─── VISITORS ─────────────────────────────────────────────────────────────
  getVisitorById(id: number): Visitor | undefined { return this.visitors.get(id); }
  getAllVisitors(): Visitor[] {
    return Array.from(this.visitors.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  getTodayVisitors(): Visitor[] {
    const today = new Date().toISOString().split("T")[0];
    return Array.from(this.visitors.values()).filter(v => v.createdAt.toISOString().split("T")[0] === today);
  }
  getVisitorsInRange(from: Date, to: Date): Visitor[] {
    return Array.from(this.visitors.values()).filter(v => v.timeIn >= from && v.timeIn <= to);
  }

  async createVisitor(data: Omit<Visitor, "id" | "createdAt">): Promise<Visitor> {
    const [row] = await db.insert(s.visitors).values(data).returning();
    const v = toVisitor(row);
    this.visitors.set(v.id, v);
    return v;
  }

  async updateVisitor(id: number, data: Partial<Visitor>): Promise<Visitor | undefined> {
    if (!this.visitors.has(id)) return undefined;
    const [row] = await db.update(s.visitors).set(data).where(eq(s.visitors.id, id)).returning();
    if (!row) return undefined;
    const v = toVisitor(row);
    this.visitors.set(id, v);
    return v;
  }

  // ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────
  getAnnouncementById(id: number): Announcement | undefined { return this.announcements.get(id); }
  getAllAnnouncements(): Announcement[] {
    return Array.from(this.announcements.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  getAnnouncementsForRole(role: string): Announcement[] {
    return Array.from(this.announcements.values())
      .filter(a => a.targetRoles.includes(role) || a.targetRoles.includes("all"))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAnnouncement(data: Omit<Announcement, "id" | "createdAt">): Promise<Announcement> {
    const [row] = await db.insert(s.announcements).values(data).returning();
    const ann = toAnnouncement(row);
    this.announcements.set(ann.id, ann);
    return ann;
  }

  async updateAnnouncement(id: number, data: Partial<Announcement>): Promise<Announcement | undefined> {
    if (!this.announcements.has(id)) return undefined;
    const [row] = await db.update(s.announcements).set(data).where(eq(s.announcements.id, id)).returning();
    if (!row) return undefined;
    const ann = toAnnouncement(row);
    this.announcements.set(id, ann);
    return ann;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(s.announcements).where(eq(s.announcements.id, id)).returning({ id: s.announcements.id });
    const ok = result.length > 0;
    if (ok) this.announcements.delete(id);
    return ok;
  }

  // ─── WORK SITES ───────────────────────────────────────────────────────────
  getSiteById(id: number): WorkSite | undefined { return this.workSites.get(id); }
  getAllSites(): WorkSite[] { return Array.from(this.workSites.values()); }
  getActiveSites(): WorkSite[] { return Array.from(this.workSites.values()).filter(site => site.isActive); }

  async createSite(data: Omit<WorkSite, "id" | "isActive" | "createdAt">): Promise<WorkSite> {
    const [row] = await db.insert(s.workSites).values({ ...data, isActive: true }).returning();
    const site = toSite(row);
    this.workSites.set(site.id, site);
    return site;
  }

  async updateSite(id: number, data: Partial<WorkSite>): Promise<WorkSite | undefined> {
    if (!this.workSites.has(id)) return undefined;
    const [row] = await db.update(s.workSites).set(data).where(eq(s.workSites.id, id)).returning();
    if (!row) return undefined;
    const site = toSite(row);
    this.workSites.set(id, site);
    return site;
  }

  async deleteSite(id: number): Promise<boolean> {
    const result = await db.delete(s.workSites).where(eq(s.workSites.id, id)).returning({ id: s.workSites.id });
    const ok = result.length > 0;
    if (ok) this.workSites.delete(id);
    return ok;
  }

  // ─── DUTY ASSIGNMENTS ─────────────────────────────────────────────────────
  getDutyById(id: number): DutyAssignment | undefined { return this.duties.get(id); }
  getDutiesByUser(userId: number): DutyAssignment[] {
    return Array.from(this.duties.values()).filter(d => d.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  getDutiesByDate(date: string): DutyAssignment[] {
    return Array.from(this.duties.values()).filter(d => d.date === date);
  }
  getAllDuties(): DutyAssignment[] { return Array.from(this.duties.values()); }

  async createDuty(data: Omit<DutyAssignment, "id" | "createdAt">): Promise<DutyAssignment> {
    const [row] = await db.insert(s.duties).values(data).returning();
    const duty = toDuty(row);
    this.duties.set(duty.id, duty);
    return duty;
  }

  async updateDuty(id: number, data: Partial<DutyAssignment>): Promise<DutyAssignment | undefined> {
    if (!this.duties.has(id)) return undefined;
    const [row] = await db.update(s.duties).set(data).where(eq(s.duties.id, id)).returning();
    if (!row) return undefined;
    const duty = toDuty(row);
    this.duties.set(id, duty);
    return duty;
  }

  // ─── CHAT ─────────────────────────────────────────────────────────────────
  getChatRoom(roomId: string): ChatRoom | undefined { return this.chatRooms.get(roomId); }
  getAllChatRooms(): ChatRoom[] { return Array.from(this.chatRooms.values()); }
  getRoomsForRole(role: string): ChatRoom[] {
    return Array.from(this.chatRooms.values()).filter(r => r.participants.includes(role));
  }
  getRoomsForUser(userId: number): ChatRoom[] {
    const roomId = `staff-${userId}`;
    return Array.from(this.chatRooms.values()).filter(r => r.participants.includes(roomId) || r.type === "dept_to_dept");
  }

  async createChatRoom(data: ChatRoom): Promise<ChatRoom> {
    const [row] = await db.insert(s.chatRooms)
      .values(data)
      .onConflictDoUpdate({
        target: s.chatRooms.id,
        set: { name: data.name, type: data.type, participants: data.participants },
      })
      .returning();
    const room = toChatRoom(row);
    this.chatRooms.set(room.id, room);
    return room;
  }

  getMessagesByRoom(roomId: string, limit = 50): ChatMessage[] {
    return Array.from(this.chatMessages.values())
      .filter(m => m.roomId === roomId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-limit);
  }

  async createChatMessage(data: Omit<ChatMessage, "id" | "createdAt" | "readBy">): Promise<ChatMessage> {
    const [row] = await db.insert(s.chatMessages).values({ ...data, readBy: [data.senderId] }).returning();
    const msg = toChatMessage(row);
    this.chatMessages.set(msg.id, msg);
    return msg;
  }

  async markMessageRead(messageId: number, userId: number): Promise<void> {
    const msg = this.chatMessages.get(messageId);
    if (!msg || msg.readBy.includes(userId)) return;
    const readBy = [...msg.readBy, userId];
    const [row] = await db.update(s.chatMessages).set({ readBy }).where(eq(s.chatMessages.id, messageId)).returning();
    if (row) this.chatMessages.set(messageId, toChatMessage(row));
  }

  // ─── STAFF COMMENTS ───────────────────────────────────────────────────────
  getCommentsByStaff(staffId: number): StaffComment[] {
    return Array.from(this.staffComments.values()).filter(c => c.staffId === staffId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createStaffComment(data: Omit<StaffComment, "id" | "createdAt">): Promise<StaffComment> {
    const [row] = await db.insert(s.staffComments).values(data).returning();
    const comment = toStaffComment(row);
    this.staffComments.set(comment.id, comment);
    return comment;
  }

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  getNotificationsByUser(userId: number): Notification[] {
    return Array.from(this.notifications.values()).filter(n => n.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  getUnreadCount(userId: number): number {
    return Array.from(this.notifications.values()).filter(n => n.userId === userId && !n.read).length;
  }

  async createNotification(data: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification> {
    const [row] = await db.insert(s.notifications).values({ ...data, read: false }).returning();
    const notif = toNotification(row);
    this.notifications.set(notif.id, notif);
    return notif;
  }

  async markNotificationRead(id: number): Promise<void> {
    const [row] = await db.update(s.notifications).set({ read: true }).where(eq(s.notifications.id, id)).returning();
    if (row) this.notifications.set(id, toNotification(row));
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    const rows = await db.update(s.notifications).set({ read: true }).where(eq(s.notifications.userId, userId)).returning();
    for (const row of rows) this.notifications.set(row.id, toNotification(row));
  }

  // ─── REPORTS ──────────────────────────────────────────────────────────────
  async createSecurityReport(data: Omit<SecurityReport, "id" | "createdAt">): Promise<SecurityReport> {
    const [row] = await db.insert(s.securityReports).values(data).returning();
    const report = toSecurityReport(row);
    this.securityReports.set(report.id, report);
    return report;
  }
  getAllSecurityReports(): SecurityReport[] {
    return Array.from(this.securityReports.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSafetyReport(data: Omit<SafetyReport, "id" | "createdAt">): Promise<SafetyReport> {
    const [row] = await db.insert(s.safetyReports).values(data).returning();
    const report = toSafetyReport(row);
    this.safetyReports.set(report.id, report);
    return report;
  }
  getAllSafetyReports(): SafetyReport[] {
    return Array.from(this.safetyReports.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ─── DASHBOARD STATS ──────────────────────────────────────────────────────
  getDashboardStats() {
    const allUsers = this.getAllUsers();
    const activeStaff = allUsers.filter(u => u.status === "active");
    const today = new Date().toISOString().split("T")[0];
    const todayAttendance = this.getAttendanceByDate(today);
    const pendingApps = this.getPendingApplications();
    const todayVisitors = this.getTodayVisitors();
    const activeSites = this.getActiveSites();

    return {
      totalStaff: activeStaff.length,
      onlineStaff: this.getOnlineStaff().length,
      clockedInStaff: this.getClockedInStaff().length,
      pendingApprovals: this.getPendingUsers().length,
      pendingApplications: pendingApps.length,
      todayVisitors: todayVisitors.length,
      activeSites: activeSites.length,
      totalDepartments: this.getAllDepts().length,
      todayAttendance: todayAttendance.length,
      recentAnnouncements: this.getAllAnnouncements().slice(0, 5),
    };
  }

  // ─── PASSWORD RESETS ──────────────────────────────────────────────────────
  async createPasswordReset(userId: number, token: string, expiresAt: Date): Promise<void> {
    // Invalidate any prior unused tokens for this user so only the latest link works
    await db.update(s.passwordResets)
      .set({ usedAt: new Date() })
      .where(and(eq(s.passwordResets.userId, userId), isNull(s.passwordResets.usedAt)));
    await db.insert(s.passwordResets).values({ userId, token, expiresAt });
  }

  async getPasswordReset(token: string): Promise<{ id: number; userId: number; expiresAt: Date; usedAt: Date | null } | undefined> {
    const [row] = await db.select().from(s.passwordResets).where(eq(s.passwordResets.token, token)).limit(1);
    if (!row) return undefined;
    return { id: row.id, userId: row.userId, expiresAt: row.expiresAt, usedAt: row.usedAt };
  }

  async markPasswordResetUsed(id: number): Promise<void> {
    await db.update(s.passwordResets).set({ usedAt: new Date() }).where(eq(s.passwordResets.id, id));
  }
}

export const storage = new Storage();
