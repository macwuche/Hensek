import { useEffect, useRef } from "react";

export function useGPS(
  onLocation: (lat: number, lng: number) => void,
  enabled = true,
  intervalMs = 30000
) {
  const watchId = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    const send = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => onLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.warn("[GPS]", err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    send(); // send immediately
    intervalRef.current = setInterval(send, intervalMs);

    return () => {
      clearInterval(intervalRef.current);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [enabled, intervalMs, onLocation]);
}

export function useCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });
}
