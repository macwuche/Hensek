import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Users, MapPin } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ChartCard from "@/components/ui/ChartCard";
import EmptyState from "@/components/ui/EmptyState";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface StaffLocation {
  id: number;
  name: string;
  role: string;
  departmentSlug: string | null;
  lastLat: number | null;
  lastLng: number | null;
  lastLocationUpdate: string | null;
  isClockedIn: boolean;
  isOnline: boolean;
}

export default function SafetyMap() {
  const { data: users = [], isLoading } = useQuery<StaffLocation[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch("/api/users"),
    refetchInterval: 30000,
  });

  const located = users.filter((u) => u.lastLat != null && u.lastLng != null);
  const center: [number, number] =
    located.length > 0 ? [located[0].lastLat!, located[0].lastLng!] : [6.5244, 3.3792];

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-7 h-7 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="hensek-page-shell">
      <PageHeader
        title="Staff Location Map"
        subtitle={`${located.length} of ${users.length} staff have shared their location`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="hensek-card p-0 overflow-hidden" style={{ height: 520 }}>
            <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {located.map((u) => (
                <Marker key={u.id} position={[u.lastLat!, u.lastLng!]}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-gray-500">{u.departmentSlug || u.role}</p>
                      <p className={u.isClockedIn ? "text-green-600" : "text-gray-400"}>
                        {u.isClockedIn ? "Clocked In" : "Clocked Out"}
                      </p>
                      {u.lastLocationUpdate && (
                        <p className="text-gray-400 text-xs">
                          Updated: {new Date(u.lastLocationUpdate).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <ChartCard title="Located Staff" subtitle="Realtime GPS pings" actions={<Users size={14} className="text-gray-400" />}>
          {located.length === 0 ? (
            <EmptyState
              icon={<MapPin size={20} />}
              title="No location data"
              description="No staff have shared their location yet."
            />
          ) : (
            <ul className="divide-y divide-border/60 max-h-[460px] overflow-y-auto scrollbar-thin -mr-2 pr-2">
              {located.map((u) => (
                <li key={u.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hensek-dark truncate">{u.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {u.lastLat?.toFixed(4)}, {u.lastLng?.toFixed(4)}
                      {u.lastLocationUpdate && (
                        <> · {new Date(u.lastLocationUpdate).toLocaleTimeString()}</>
                      )}
                    </p>
                  </div>
                  <span className={`hensek-badge ${u.isClockedIn ? "hensek-badge-green" : "hensek-badge-gray"}`}>
                    {u.isClockedIn ? "In" : "Out"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
