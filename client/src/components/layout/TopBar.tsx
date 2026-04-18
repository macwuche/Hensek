import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface TopBarProps {
  onMenuClick: () => void;
  search?: string;
  onSearchChange?: (v: string) => void;
}

export default function TopBar({ onMenuClick, search, onSearchChange }: TopBarProps) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: notifCount } = useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiFetch("/api/notifications/unread-count"),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch {
      toast.error("Logout failed");
    }
  };

  const notifHref = `/${user?.departmentSlug || "staff"}/notifications`;
  const count = notifCount?.count || 0;

  return (
    <header className="sticky top-0 z-30 bg-transparent backdrop-blur-md px-4 lg:px-8 py-4 flex items-center gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search ?? ""}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search..."
          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-white/60 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-hensek-yellow/50"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(notifHref)}
          aria-label="Notifications"
          className="relative w-10 h-10 rounded-xl bg-white shadow-sm border border-white/60 flex items-center justify-center text-hensek-dark hover:bg-hensek-cream/60 transition-colors"
        >
          <Bell size={16} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-hensek-yellow text-hensek-dark text-[10px] font-bold flex items-center justify-center border border-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>

        {user && (
          <div className="flex items-center gap-2 bg-white shadow-sm border border-white/60 rounded-xl pl-1.5 pr-2 py-1">
            <button
              type="button"
              onClick={() => navigate(`/${user.departmentSlug || "staff"}/profile`)}
              className="flex items-center gap-2 text-left"
              title="My profile"
            >
              <div className="w-8 h-8 rounded-lg bg-hensek-yellow flex items-center justify-center text-xs font-bold text-hensek-dark overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.name} />
                ) : (
                  getInitials(user.name)
                )}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-xs font-semibold text-hensek-dark truncate max-w-[120px]">{user.name}</p>
                <p className="text-[10px] text-gray-400 capitalize truncate max-w-[120px]">{user.role}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
