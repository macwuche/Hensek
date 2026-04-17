import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/queryClient";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Users } from "lucide-react";

// Fix default marker icons for bundlers
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
    located.length > 0
      ? [located[0].lastLat!, located[0].lastLng!]
      : [6.5244, 3.3792]; // Lagos default

  if (isLoading)
    return (
      <div className="py-12 flex justify-center">
        <div className="w-7 h-7 border-2 border-hensek-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-hensek-dark">Staff Location Map</h1>
        <p className="text-sm text-gray-500">{located.length} of {users.length} staff have shared their location</p>
      </div>

      <div className="hensek-card overflow-hidden" style={{ height: 480 }}>
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

      {/* Staff list sidebar */}
      <div className="hensek-card p-4">
        <h2 className="text-sm font-semibold text-hensek-dark mb-3 flex items-center gap-2">
          <Users size={16} />
          Staff with Location Data
        </h2>
        {located.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No staff location data available</p>
        ) : (
          <ul className="divide-y divide-border">
            {located.map((u) => (
              <li key={u.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hensek-dark">{u.name}</p>
                  <p className="text-xs text-gray-400">
                    {u.lastLat?.toFixed(5)}, {u.lastLng?.toFixed(5)}
                    {u.lastLocationUpdate && (
                      <> · {new Date(u.lastLocationUpdate).toLocaleTimeString()}</>
                    )}
                  </p>
                </div>
                <span className={`hensek-badge text-[10px] ${u.isClockedIn ? "hensek-badge-green" : "hensek-badge-gray"}`}>
                  {u.isClockedIn ? "Clocked In" : "Out"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
