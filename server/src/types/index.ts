export type UserRole = "md" | "hr" | "safety" | "security" | "staff";
export type UserStatus = "pending" | "active" | "suspended";
export type DeptType = "md" | "hr" | "safety" | "security" | "standard";

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  departmentId: number | null;
  departmentSlug: string | null;
  status: UserStatus;
  employeeId: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  hireDate?: Date;
  emergencyContact?: string;
  emergencyPhone?: string;
  // GPS
  lastLat?: number;
  lastLng?: number;
  lastLocationUpdate?: Date;
  isOnline: boolean;
  isClockedIn: boolean;
  clockInTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: number;
  name: string;
  slug: string;
  type: DeptType;
  description?: string;
  createdBy: number;
  email?: string;
  csoEmail?: string;
  safetyEmail?: string;
  createdAt: Date;
}

export interface AttendanceRecord {
  id: number;
  userId: number;
  clockIn: Date;
  clockOut?: Date;
  breakStart?: Date;
  breakEnd?: Date;
  siteId?: number;
  date: string;
  totalMinutes?: number;
  isOvertime: boolean;
  overtimeMinutes?: number;
  createdAt: Date;
}

export type ApplicationType =
  | "leave"
  | "overtime"
  | "equipment"
  | "training"
  | "incident"
  | "grievance"
  | "schedule_change"
  | "medical";

export type ApplicationStatus =
  | "pending"
  | "hr_review"
  | "approved"
  | "rejected"
  | "escalated_to_md"
  | "md_approved"
  | "md_rejected";

export interface Application {
  id: number;
  userId: number;
  type: ApplicationType;
  title: string;
  description: string;
  status: ApplicationStatus;
  startDate?: Date;
  endDate?: Date;
  hrComment?: string;
  mdComment?: string;
  reviewedBy?: number;
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Visitor {
  id: number;
  name: string;
  phone?: string;
  officeDestination: string;
  plateNumber?: string;
  purpose?: string;
  timeIn: Date;
  timeOut?: Date;
  registeredBy: number;
  hostName?: string;
  createdAt: Date;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  authorId: number;
  targetRoles: string[];
  priority: "normal" | "urgent";
  createdAt: Date;
  expiresAt?: Date;
}

export interface WorkSite {
  id: number;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  address?: string;
  registeredBy: number;
  isActive: boolean;
  createdAt: Date;
}

export interface DutyAssignment {
  id: number;
  userId: number;
  siteId: number;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  taskDescription: string;
  assignedBy: number;
  status: "assigned" | "in_progress" | "completed" | "missed";
  createdAt: Date;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: "dept_to_dept" | "staff_to_dept" | "broadcast";
  participants: string[];
  createdAt: Date;
}

export interface ChatMessage {
  id: number;
  roomId: string;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: Date;
  readBy: number[];
}

export interface StaffComment {
  id: number;
  staffId: number;
  authorId: number;
  authorName: string;
  comment: string;
  createdAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

export interface SecurityReport {
  id: number;
  type: "weekly" | "monthly";
  period: string;
  generatedBy: number;
  visitorsCount: number;
  incidentsCount: number;
  emailSentAt?: Date;
  createdAt: Date;
}

export interface SafetyReport {
  id: number;
  type: "weekly" | "monthly";
  period: string;
  generatedBy: number;
  staffOnDutyCount: number;
  sitesActiveCount: number;
  incidentsCount: number;
  emailSentAt?: Date;
  createdAt: Date;
}

// Express augmentation
declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string;
      role: UserRole;
      departmentId: number | null;
      departmentSlug: string | null;
      status: UserStatus;
    }
  }
}
