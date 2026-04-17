import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { cn, getInitials } from "@/lib/utils";
import {
  LayoutDashboard, Users, Shield, ShieldAlert, UserCheck,
  Bell, Settings, LogOut, Menu, X, Building2, ChevronDown,
  HardHat, BadgeCheck, FileText,
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function getNavItems(role: string, deptSlug: string | null): NavItem[] {
  const base = deptSlug || "staff";
  if (role === "md") {
    return [
      { label: "Overview", href: "/md", icon: <LayoutDashboard size={14} /> },
      { label: "Staff", href: "/md/staff", icon: <Users size={14} /> },
      { label: "Departments", href: "/md/departments", icon: <Building2 size={14} /> },
      { label: "Applications", href: "/md/applications", icon: <FileText size={14} /> },
      { label: "Reports", href: "/md/reports", icon: <FileText size={14} /> },
      { label: "Settings", href: "/md/settings", icon: <Settings size={14} /> },
    ];
  }
  if (role === "hr") {
    return [
      { label: "Dashboard", href: "/hr", icon: <LayoutDashboard size={14} /> },
      { label: "Staff", href: "/hr/staff", icon: <Users size={14} /> },
      { label: "Applications", href: "/hr/applications", icon: <FileText size={14} /> },
      { label: "Approvals", href: "/hr/approvals", icon: <BadgeCheck size={14} /> },
      { label: "Announcements", href: "/hr/announcements", icon: <Bell size={14} /> },
      { label: "Departments", href: "/hr/departments", icon: <Building2 size={14} /> },
    ];
  }
  if (role === "safety") {
    return [
      { label: "Dashboard", href: "/safety", icon: <LayoutDashboard size={14} /> },
      { label: "Staff Map", href: "/safety/map", icon: <HardHat size={14} /> },
      { label: "Duties", href: "/safety/duties", icon: <FileText size={14} /> },
      { label: "Sites", href: "/safety/sites", icon: <Building2 size={14} /> },
      { label: "Attendance", href: "/safety/attendance", icon: <UserCheck size={14} /> },
      { label: "Reports", href: "/safety/reports", icon: <FileText size={14} /> },
    ];
  }
  if (role === "security") {
    return [
      { label: "Dashboard", href: "/security", icon: <LayoutDashboard size={14} /> },
      { label: "Visitors", href: "/security/visitors", icon: <Users size={14} /> },
      { label: "Staff", href: "/security/staff", icon: <Shield size={14} /> },
      { label: "Reports", href: "/security/reports", icon: <ShieldAlert size={14} /> },
    ];
  }
  // Standard dept / staff
  return [
    { label: "Dashboard", href: `/${base}`, icon: <LayoutDashboard size={14} /> },
    { label: "Duties", href: `/${base}/duties`, icon: <HardHat size={14} /> },
    { label: "Applications", href: `/${base}/applications`, icon: <FileText size={14} /> },
    { label: "Messages", href: `/${base}/messages`, icon: <Bell size={14} /> },
    { label: "Profile", href: `/${base}/profile`, icon: <Settings size={14} /> },
  ];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: notifCount } = useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiFetch("/api/notifications/unread-count"),
    refetchInterval: 30000,
  });

  if (!user) return null;

  const navItems = getNavItems(user.role, user.departmentSlug);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch {
      toast.error("Logout failed");
    }
  };

  const getRoleLabel = () => {
    const labels: Record<string, string> = {
      md: "Managing Director", hr: "Human Resources",
      safety: "Safety Dept.", security: "Security Dept.",
    };
    return labels[user.role] || user.departmentSlug?.toUpperCase() || "Staff";
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #F5F0DC 0%, #FEFCE8 55%, #FEF9C3 100%)" }}>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 px-4 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-hensek-dark flex items-center justify-center">
              <span className="text-hensek-yellow font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-hensek-dark text-lg hidden sm:block">Hensek</span>
          </div>

          {/* Nav Pills — desktop */}
          <nav className="hensek-nav-pill hidden md:flex gap-0.5 flex-1 max-w-2xl mx-auto">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <span className={isActive ? "hensek-nav-item-active flex items-center gap-1.5" : "hensek-nav-item flex items-center gap-1.5"}>
                    {item.icon}
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Notifications */}
            <Link href={`/${user.departmentSlug || "staff"}/notifications`}>
              <button className="relative w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-white/80 transition-colors">
                <Bell size={16} className="text-hensek-dark" />
                {(notifCount?.count || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {notifCount!.count > 9 ? "9+" : notifCount!.count}
                  </span>
                )}
              </button>
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 bg-white rounded-xl px-3 py-1.5 shadow-sm hover:bg-white/80 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-hensek-yellow flex items-center justify-center text-xs font-bold text-hensek-dark flex-shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} className="w-full h-full rounded-lg object-cover" alt={user.name} />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-hensek-dark leading-tight">{user.name.split(" ")[0]}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{getRoleLabel()}</p>
                </div>
                <ChevronDown size={12} className="text-gray-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-lg border border-white/60 py-1 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-semibold text-hensek-dark">{user.name}</p>
                    <p className="text-[10px] text-gray-500">{user.email}</p>
                  </div>
                  <Link href={`/${user.departmentSlug || "staff"}/profile`} onClick={() => setUserMenuOpen(false)}>
                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-hensek-cream flex items-center gap-2">
                      <Settings size={13} /> Settings
                    </button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden mt-2 bg-hensek-dark rounded-2xl p-3 mx-0 animate-fade-in">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <span className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5", isActive ? "bg-hensek-yellow text-hensek-dark" : "text-white/70 hover:text-white hover:bg-white/10")}>
                    {item.icon} {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="max-w-[1400px] mx-auto px-4 pb-8">
        {children}
      </main>

      {/* Click outside handler */}
      {(userMenuOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </div>
  );
}
