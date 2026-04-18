import { Menu, Search } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
  search?: string;
  onSearchChange?: (v: string) => void;
}

export default function TopBar({ onMenuClick, search, onSearchChange }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-transparent backdrop-blur-md px-4 lg:px-8 py-4 flex items-center gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <div className="relative flex-1 max-w-md ml-auto lg:ml-0">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search ?? ""}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Search..."
          className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-white/60 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-hensek-yellow/50"
        />
      </div>
    </header>
  );
}
