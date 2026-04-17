import bcrypt from "bcryptjs";
import type {
  User, Department, AttendanceRecord, Application, Visitor,
  Announcement, WorkSite, DutyAssignment, ChatMessage, StaffComment,
  Notification, SecurityReport, SafetyReport, ChatRoom,
} from "../types/index.js";

class InMemoryStorage {
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

  private counters = {
    users: 1, departments: 1, attendance: 1, applications: 1,
    visitors: 1, announcements: 1, workSites: 1, duties: 1,
    chatMessages: 1, staffComments: 1, notifications: 1,
    securityReports: 1, safetyReports: 1,
  };

  constructor() {
    this.seed();
  }

  private async seed() {
    // Create default departments
    const mdDept = this.createDepartmentSync({ name: "Managing Director", slug: "md", type: "md", createdBy: 0 });
    const hrDept = this.createDepartmentSync({ name: "Human Resources", slug: "hr", type: "hr", createdBy: 0 });
    const safetyDept = this.createDepartmentSync({ name: "Safety", slug: "safety", type: "safety", createdBy: 0 });
    const securityDept = this.createDepartmentSync({ name: "Security", slug: "security", type: "security", createdBy: 0 });
    const mediaDept = this.createDepartmentSync({ name: "Media", slug: "media", type: "standard", createdBy: 0 });

    // Create default MD account
    const hash = await bcrypt.hash("HensekAdmin2024!", 10);
    const mdUser: User = {
      id: this.counters.users++,
      email: "admin@hensek.com",
      passwordHash: hash,
      name: "Managing Director",
      role: "md",
      departmentId: mdDept.id,
      departmentSlug: "md",
      status: "active",
      employeeId: "EMP-0001",
      isOnline: false,
      isClockedIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(mdUser.id, mdUser);

    // Create sample HR user
    const hrHash = await bcrypt.hash("HRPassword123!", 10);
    const hrUser: User = {
      id: this.counters.users++,
      email: "hr@hensek.com",
      passwordHash: hrHash,
      name: "HR Manager",
      role: "hr",
      departmentId: hrDept.id,
      departmentSlug: "hr",
      status: "active",
      employeeId: "EMP-0002",
      phone: "+234 801 234 5678",
      isOnline: false,
      isClockedIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(hrUser.id, hrUser);

    // Create sample Safety user
    const safetyHash = await bcrypt.hash("Safety123!", 10);
    const safetyUser: User = {
      id: this.counters.users++,
      email: "safety@hensek.com",
      passwordHash: safetyHash,
      name: "Safety Officer",
      role: "safety",
      departmentId: safetyDept.id,
      departmentSlug: "safety",
      status: "active",
      employeeId: "EMP-0003",
      isOnline: false,
      isClockedIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(safetyUser.id, safetyUser);

    // Create sample Security user
    const secHash = await bcrypt.hash("Security123!", 10);
    const secUser: User = {
      id: this.counters.users++,
      email: "security@hensek.com",
      passwordHash: secHash,
      name: "Security Officer",
      role: "security",
      departmentId: securityDept.id,
      departmentSlug: "security",
      status: "active",
      employeeId: "EMP-0004",
      isOnline: false,
      isClockedIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(secUser.id, secUser);

    // Sample staff
    const staffHash = await bcrypt.hash("Staff123!", 10);
    const staffUser: User = {
      id: this.counters.users++,
      email: "john.doe@hensek.com",
      passwordHash: staffHash,
      name: "John Doe",
      role: "staff",
      departmentId: mediaDept.id,
      departmentSlug: "media",
      status: "active",
      employeeId: "EMP-0005",
      phone: "+234 802 345 6789",
      address: "12 Victoria Island, Lagos",
      isOnline: false,
      isClockedIn: false,
      hireDate: new Date("2023-06-01"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(staffUser.id, staffUser);

    // Sample work sites
    this.createWorkSiteSync({
      name: "Main Office - Lagos",
      lat: 6.5244, lng: 3.3792,
      address: "1 Hensek Plaza, Victoria Island, Lagos",
      registeredBy: safetyUser.id,
    });
    this.createWorkSiteSync({
      name: "Abuja Branch",
      lat: 9.0579, lng: 7.4951,
      address: "Plot 15, Garki, Abuja",
      registeredBy: safetyUser.id,
    });

    // Sample announcement
    const ann: Announcement = {
      id: this.counters.announcements++,
      title: "Welcome to Hensek Portal",
      content: "Welcome to the new Hensek Company Management System. Please ensure your profile is up to date.",
      authorId: hrUser.id,
      targetRoles: ["md", "hr", "safety", "security", "staff"],
      priority: "normal",
      createdAt: new Date(),
    };
    this.announcements.set(ann.id, ann);

    // Default chat rooms
    this.chatRooms.set("dept-md-hr", { id: "dept-md-hr", name: "MD ↔ HR", type: "dept_to_dept", participants: ["md", "hr"], createdAt: new Date() });
    this.chatRooms.set("dept-md-safety", { id: "dept-md-safety", name: "MD ↔ Safety", type: "dept_to_dept", participants: ["md", "safety"], createdAt: new Date() });
    this.chatRooms.set("dept-md-security", { id: "dept-md-security", name: "MD ↔ Security", type: "dept_to_dept", participants: ["md", "security"], createdAt: new Date() });
    this.chatRooms.set("dept-hr-safety", { id: "dept-hr-safety", name: "HR ↔ Safety", type: "dept_to_dept", participants: ["hr", "safety"], createdAt: new Date() });
    this.chatRooms.set("dept-hr-security", { id: "dept-hr-security", name: "HR ↔ Security", type: "dept_to_dept", participants: ["hr", "security"], createdAt: new Date() });
    this.chatRooms.set("dept-safety-security", { id: "dept-safety-security", name: "Safety ↔ Security", type: "dept_to_dept", participants: ["safety", "security"], createdAt: new Date() });
  }

  private createDepartmentSync(data: Partial<Department> & { name: string; slug: string; type: Department["type"]; createdBy: number }): Department {
    const dept: Department = {
      id: this.counters.departments++,
      name: data.name,
      slug: data.slug,
      type: data.type,
      createdBy: data.createdBy,
      description: data.description,
      email: data.email,
      createdAt: new Date(),
    };
    this.departments.set(dept.id, dept);
    return dept;
  }

  private createWorkSiteSync(data: Omit<WorkSite, "id" | "isActive" | "createdAt">): WorkSite {
    const site: WorkSite = {
      id: this.counters.workSites++,
      ...data,
      isActive: true,
      createdAt: new Date(),
    };
    this.workSites.set(site.id, site);
    return site;
  }

  // ---- USERS ----
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

  createUser(data: Omit<User, "id" | "createdAt" | "updatedAt" | "isOnline" | "isClockedIn" | "employeeId">): User {
    const empCount = this.users.size + 1;
    const user: User = {
      ...data,
      id: this.counters.users++,
      employeeId: `EMP-${String(empCount).padStart(4, "0")}`,
      isOnline: false,
      isClockedIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  updateUser(id: number, data: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  deleteUser(id: number): boolean {
    return this.users.delete(id);
  }

  // ---- DEPARTMENTS ----
  getDeptById(id: number): Department | undefined { return this.departments.get(id); }
  getDeptBySlug(slug: string): Department | undefined {
    return Array.from(this.departments.values()).find(d => d.slug === slug);
  }
  getAllDepts(): Department[] { return Array.from(this.departments.values()); }

  createDept(data: Omit<Department, "id" | "createdAt">): Department {
    const dept: Department = { ...data, id: this.counters.departments++, createdAt: new Date() };
    this.departments.set(dept.id, dept);
    return dept;
  }

  updateDept(id: number, data: Partial<Department>): Department | undefined {
    const dept = this.departments.get(id);
    if (!dept) return undefined;
    const updated = { ...dept, ...data };
    this.departments.set(id, updated);
    return updated;
  }

  deleteDept(id: number): boolean { return this.departments.delete(id); }

  // ---- ATTENDANCE ----
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

  createAttendance(data: Omit<AttendanceRecord, "id" | "createdAt">): AttendanceRecord {
    const rec: AttendanceRecord = { ...data, id: this.counters.attendance++, createdAt: new Date() };
    this.attendance.set(rec.id, rec);
    return rec;
  }

  updateAttendance(id: number, data: Partial<AttendanceRecord>): AttendanceRecord | undefined {
    const rec = this.attendance.get(id);
    if (!rec) return undefined;
    const updated = { ...rec, ...data };
    this.attendance.set(id, updated);
    return updated;
  }

  // ---- APPLICATIONS ----
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

  createApplication(data: Omit<Application, "id" | "createdAt" | "updatedAt">): Application {
    const app: Application = { ...data, id: this.counters.applications++, createdAt: new Date(), updatedAt: new Date() };
    this.applications.set(app.id, app);
    return app;
  }

  updateApplication(id: number, data: Partial<Application>): Application | undefined {
    const app = this.applications.get(id);
    if (!app) return undefined;
    const updated = { ...app, ...data, updatedAt: new Date() };
    this.applications.set(id, updated);
    return updated;
  }

  // ---- VISITORS ----
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

  createVisitor(data: Omit<Visitor, "id" | "createdAt">): Visitor {
    const v: Visitor = { ...data, id: this.counters.visitors++, createdAt: new Date() };
    this.visitors.set(v.id, v);
    return v;
  }

  updateVisitor(id: number, data: Partial<Visitor>): Visitor | undefined {
    const v = this.visitors.get(id);
    if (!v) return undefined;
    const updated = { ...v, ...data };
    this.visitors.set(id, updated);
    return updated;
  }

  // ---- ANNOUNCEMENTS ----
  getAnnouncementById(id: number): Announcement | undefined { return this.announcements.get(id); }
  getAllAnnouncements(): Announcement[] {
    return Array.from(this.announcements.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  getAnnouncementsForRole(role: string): Announcement[] {
    return Array.from(this.announcements.values())
      .filter(a => a.targetRoles.includes(role) || a.targetRoles.includes("all"))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  createAnnouncement(data: Omit<Announcement, "id" | "createdAt">): Announcement {
    const ann: Announcement = { ...data, id: this.counters.announcements++, createdAt: new Date() };
    this.announcements.set(ann.id, ann);
    return ann;
  }

  updateAnnouncement(id: number, data: Partial<Announcement>): Announcement | undefined {
    const ann = this.announcements.get(id);
    if (!ann) return undefined;
    const updated = { ...ann, ...data };
    this.announcements.set(id, updated);
    return updated;
  }

  deleteAnnouncement(id: number): boolean { return this.announcements.delete(id); }

  // ---- WORK SITES ----
  getSiteById(id: number): WorkSite | undefined { return this.workSites.get(id); }
  getAllSites(): WorkSite[] { return Array.from(this.workSites.values()); }
  getActiveSites(): WorkSite[] { return Array.from(this.workSites.values()).filter(s => s.isActive); }

  createSite(data: Omit<WorkSite, "id" | "isActive" | "createdAt">): WorkSite {
    const site: WorkSite = { ...data, id: this.counters.workSites++, isActive: true, createdAt: new Date() };
    this.workSites.set(site.id, site);
    return site;
  }

  updateSite(id: number, data: Partial<WorkSite>): WorkSite | undefined {
    const site = this.workSites.get(id);
    if (!site) return undefined;
    const updated = { ...site, ...data };
    this.workSites.set(id, updated);
    return updated;
  }

  deleteSite(id: number): boolean { return this.workSites.delete(id); }

  // ---- DUTY ASSIGNMENTS ----
  getDutyById(id: number): DutyAssignment | undefined { return this.duties.get(id); }
  getDutiesByUser(userId: number): DutyAssignment[] {
    return Array.from(this.duties.values()).filter(d => d.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  getDutiesByDate(date: string): DutyAssignment[] {
    return Array.from(this.duties.values()).filter(d => d.date === date);
  }
  getAllDuties(): DutyAssignment[] { return Array.from(this.duties.values()); }

  createDuty(data: Omit<DutyAssignment, "id" | "createdAt">): DutyAssignment {
    const duty: DutyAssignment = { ...data, id: this.counters.duties++, createdAt: new Date() };
    this.duties.set(duty.id, duty);
    return duty;
  }

  updateDuty(id: number, data: Partial<DutyAssignment>): DutyAssignment | undefined {
    const duty = this.duties.get(id);
    if (!duty) return undefined;
    const updated = { ...duty, ...data };
    this.duties.set(id, updated);
    return updated;
  }

  // ---- CHAT ----
  getChatRoom(roomId: string): ChatRoom | undefined { return this.chatRooms.get(roomId); }
  getAllChatRooms(): ChatRoom[] { return Array.from(this.chatRooms.values()); }
  getRoomsForRole(role: string): ChatRoom[] {
    return Array.from(this.chatRooms.values()).filter(r => r.participants.includes(role));
  }
  getRoomsForUser(userId: number): ChatRoom[] {
    const roomId = `staff-${userId}`;
    return Array.from(this.chatRooms.values()).filter(r => r.participants.includes(roomId) || r.type === "dept_to_dept");
  }

  createChatRoom(data: ChatRoom): ChatRoom {
    this.chatRooms.set(data.id, data);
    return data;
  }

  getMessagesByRoom(roomId: string, limit = 50): ChatMessage[] {
    return Array.from(this.chatMessages.values())
      .filter(m => m.roomId === roomId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-limit);
  }

  createChatMessage(data: Omit<ChatMessage, "id" | "createdAt" | "readBy">): ChatMessage {
    const msg: ChatMessage = { ...data, id: this.counters.chatMessages++, readBy: [data.senderId], createdAt: new Date() };
    this.chatMessages.set(msg.id, msg);
    return msg;
  }

  markMessageRead(messageId: number, userId: number): void {
    const msg = this.chatMessages.get(messageId);
    if (msg && !msg.readBy.includes(userId)) {
      msg.readBy.push(userId);
    }
  }

  // ---- STAFF COMMENTS ----
  getCommentsByStaff(staffId: number): StaffComment[] {
    return Array.from(this.staffComments.values()).filter(c => c.staffId === staffId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  createStaffComment(data: Omit<StaffComment, "id" | "createdAt">): StaffComment {
    const comment: StaffComment = { ...data, id: this.counters.staffComments++, createdAt: new Date() };
    this.staffComments.set(comment.id, comment);
    return comment;
  }

  // ---- NOTIFICATIONS ----
  getNotificationsByUser(userId: number): Notification[] {
    return Array.from(this.notifications.values()).filter(n => n.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  getUnreadCount(userId: number): number {
    return Array.from(this.notifications.values()).filter(n => n.userId === userId && !n.read).length;
  }

  createNotification(data: Omit<Notification, "id" | "createdAt" | "read">): Notification {
    const notif: Notification = { ...data, id: this.counters.notifications++, read: false, createdAt: new Date() };
    this.notifications.set(notif.id, notif);
    return notif;
  }

  markNotificationRead(id: number): void {
    const n = this.notifications.get(id);
    if (n) { n.read = true; this.notifications.set(id, n); }
  }

  markAllNotificationsRead(userId: number): void {
    this.notifications.forEach((n, id) => {
      if (n.userId === userId) { this.notifications.set(id, { ...n, read: true }); }
    });
  }

  // ---- REPORTS ----
  createSecurityReport(data: Omit<SecurityReport, "id" | "createdAt">): SecurityReport {
    const report: SecurityReport = { ...data, id: this.counters.securityReports++, createdAt: new Date() };
    this.securityReports.set(report.id, report);
    return report;
  }
  getAllSecurityReports(): SecurityReport[] {
    return Array.from(this.securityReports.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  createSafetyReport(data: Omit<SafetyReport, "id" | "createdAt">): SafetyReport {
    const report: SafetyReport = { ...data, id: this.counters.safetyReports++, createdAt: new Date() };
    this.safetyReports.set(report.id, report);
    return report;
  }
  getAllSafetyReports(): SafetyReport[] {
    return Array.from(this.safetyReports.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ---- DASHBOARD STATS ----
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
}

export const storage = new InMemoryStorage();
