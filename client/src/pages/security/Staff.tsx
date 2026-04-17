import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { getInitials, getStatusColor } from "@/lib/utils";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  departmentSlug: string | null;
  status: string;
  employeeId?: string;
  avatarUrl?: string;
  isClockedIn?: boolean;
  isOnline?: boolean;
}

export default function SecurityStaff() {
  const [search, setSearch] = useState("");

  const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/users"),
    refetchInterval: 60000,
  });

  const filtered = staff.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Staff Directory</h1>
        <p className="text-sm text-gray-500">View staff presence and status</p>
      </div>

      <input
        className="hensek-input text-sm max-w-xs"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="hensek-card overflow-x-auto">
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No staff found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Clocked In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-hensek-yellow/30 flex items-center justify-center text-xs font-semibold text-hensek-dark">
                            {getInitials(u.name)}
                          </div>
                        )}
                        {u.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-hensek-dark">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.departmentSlug || u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`hensek-badge text-[10px] ${getStatusColor(u.status)}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isClockedIn ? (
                      <span className="hensek-badge hensek-badge-green text-[10px]">Clocked In</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Out</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
