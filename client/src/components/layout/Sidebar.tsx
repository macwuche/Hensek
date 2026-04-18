import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { cn, getInitials } from "@/lib/utils";
import {
  LayoutDashboard, Users, Shield, ShieldAlert, UserCheck,
  Bell, Settings, LogOut, Building2, HardHat, FileText,
  CheckSquare, Calendar, TrendingUp, Wallet, Receipt,
  UserPlus, DollarSign, PieChart, FolderKanban, HelpCircle,
  MapPin, ClipboardList, MessageSquare, User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

type IconType = React.ReactNode;

interface SidebarLink {
  label: string;
  href: string;
  icon: IconType;
}

interface SidebarSection {
  title?: string;
  items: SidebarLink[];
}

export function getSidebarSections(role: string, deptSlug: string | null): SidebarSection[] {
  const base = deptSlug || "staff";

  if (role === "md") {
    return [
      {
        items: [
          { label: "Overview", href: "/md", icon: <LayoutDashboard size={16} /> },
          { label: "Staff", href: "/md/staff", icon: <Users size={16} /> },
          { label: "Departments", href: "/md/departments", icon: <Building2 size={16} /> },
          { label: "Applications", href: "/md/applications", icon: <FileText size={16} /> },
          { label: "Reports", href: "/md/reports", icon: <ClipboardList size={16} /> },
        ],
      },
      {
        title: "List",
        items: [
          { label: "Settings", href: "/md/settings", icon: <Settings size={16} /> },
        ],
      },
    ];
  }

  if (role === "hr") {
    return [
      {
        items: [
          { label: "Dashboard", href: "/hr", icon: <LayoutDashboard size={16} /> },
          { label: "Tasks", href: "/hr/tasks", icon: <CheckSquare size={16} /> },
          { label: "Calendar", href: "/hr/calendar", icon: <Calendar size={16} /> },
          { label: "Settings", href: "/hr/settings", icon: <Settings size={16} /> },
          { label: "Help & Center", href: "/hr/help", icon: <HelpCircle size={16} /> },
        ],
      },
      {
        title: "Team Management",
        items: [
          { label: "Performance", href: "/hr/performance", icon: <TrendingUp size={16} /> },
          { label: "Payrolls", href: "/hr/payrolls", icon: <Wallet size={16} /> },
          { label: "Invoices", href: "/hr/invoices", icon: <Receipt size={16} /> },
          { label: "Employees", href: "/hr/staff", icon: <Users size={16} /> },
          { label: "Hiring", href: "/hr/hiring", icon: <UserPlus size={16} /> },
        ],
      },
      {
        title: "List",
        items: [
          { label: "Salary Information", href: "/hr/salary", icon: <DollarSign size={16} /> },
          { label: "Compensation Breakdown", href: "/hr/compensation", icon: <PieChart size={16} /> },
          { label: "Project-specific Data", href: "/hr/projects", icon: <FolderKanban size={16} /> },
          { label: "Applications", href: "/hr/applications", icon: <FileText size={16} /> },
          { label: "Announcements", href: "/hr/announcements", icon: <Bell size={16} /> },
          { label: "Departments", href: "/hr/departments", icon: <Building2 size={16} /> },
        ],
      },
    ];
  }

  if (role === "safety") {
    return [
      {
        items: [
          { label: "Dashboard", href: "/safety", icon: <LayoutDashboard size={16} /> },
          { label: "Staff Map", href: "/safety/map", icon: <MapPin size={16} /> },
          { label: "Duties", href: "/safety/duties", icon: <HardHat size={16} /> },
        ],
      },
      {
        title: "List",
        items: [
          { label: "Sites", href: "/safety/sites", icon: <Building2 size={16} /> },
          { label: "Attendance", href: "/safety/attendance", icon: <UserCheck size={16} /> },
          { label: "Reports", href: "/safety/reports", icon: <ClipboardList size={16} /> },
        ],
      },
    ];
  }

  if (role === "security") {
    return [
      {
        items: [
          { label: "Dashboard", href: "/security", icon: <LayoutDashboard size={16} /> },
          { label: "Visitors", href: "/security/visitors", icon: <Users size={16} /> },
          { label: "Staff", href: "/security/staff", icon: <Shield size={16} /> },
        ],
      },
      {
        title: "List",
        items: [
          { label: "Reports", href: "/security/reports", icon: <ShieldAlert size={16} /> },
        ],
      },
    ];
  }

  // staff
  return [
    {
      items: [
        { label: "Dashboard", href: `/${base}`, icon: <LayoutDashboard size={16} /> },
        { label: "Duties", href: `/${base}/duties`, icon: <HardHat size={16} /> },
        { label: "Applications", href: `/${base}/applications`, icon: <FileText size={16} /> },
      ],
    },
    {
      title: "List",
      items: [
        { label: "Messages", href: `/${base}/messages`, icon: <MessageSquare size={16} /> },
        { label: "Profile", href: `/${base}/profile`, icon: <UserIcon size={16} /> },
      ],
    },
  ];
}

function getRoleLabel(role: string, deptSlug: string | null) {
  const labels: Record<string, string> = {
    md: "Managing Director",
    hr: "Human Resources",
    safety: "Safety Dept.",
    security: "Security Dept.",
  };
  return labels[role] || deptSlug?.toUpperCase() || "Staff";
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const { data: notifCount } = useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiFetch("/api/notifications/unread-count"),
    refetchInterval: 30000,
  });

  if (!user) return null;
  const sections = getSidebarSections(user.role, user.departmentSlug);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch {
      toast.error("Logout failed");
    }
  };

  const isItemActive = (href: string) => {
    if (location === href) return true;
    if (href === `/${user.departmentSlug || "staff"}` || href === "/hr" || href === "/md" || href === "/safety" || href === "/security") {
      return location === href;
    }
    return location.startsWith(href + "/") || location === href;
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "hensek-sidebar fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex-shrink-0 transition-transform",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="h-full flex flex-col p-4">
          {/* Logo */}
          <Link href={user.role === "hr" ? "/hr" : user.role === "md" ? "/md" : user.role === "safety" ? "/safety" : user.role === "security" ? "/security" : `/${user.departmentSlug || "staff"}`}>
            <div className="flex items-center gap-2.5 px-2 mb-6 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-hensek-yellow flex items-center justify-center">
                <span className="text-hensek-dark font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-white text-lg">Hensek</span>
            </div>
          </Link>

          {/* Nav sections */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin -mr-2 pr-2 space-y-5">
            {sections.map((section, i) => (
              <div key={i} className="hensek-sidebar-section">
                {section.title && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-2 mb-1.5">
                    {section.title}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isItemActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link href={item.href}>
                          <span
                            onClick={onClose}
                            className={cn(
                              active ? "hensek-sidebar-link-active" : "hensek-sidebar-link",
                            )}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Footer: notifications + user */}
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <Link href={`/${user.departmentSlug || "staff"}/notifications`}>
              <span
                onClick={onClose}
                className="hensek-sidebar-link relative"
              >
                <Bell size={16} />
                <span>Notifications</span>
                {(notifCount?.count || 0) > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-hensek-yellow text-hensek-dark text-[10px] rounded-full flex items-center justify-center font-bold">
                    {notifCount!.count > 9 ? "9+" : notifCount!.count}
                  </span>
                )}
              </span>
            </Link>

            <div className="bg-white/5 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-hensek-yellow flex items-center justify-center text-xs font-bold text-hensek-dark flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} className="w-full h-full rounded-lg object-cover" alt={user.name} />
                ) : (
                  getInitials(user.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-white/50 truncate">{getRoleLabel(user.role, user.departmentSlug)}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
