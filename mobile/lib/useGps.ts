import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { bearingTrue, declinationAt, distanceMeters, norm360 } from "./geo";
import { toTrackPoint, TRACKING_OPTIONS } from "./locationTask";
import { appendPoints, TrackPoint } from "./track";

// Foreground GPS + compass for the map tab.
//
// Position: watchPositionAsync at BestForNavigation / 2 m / 2 s. Every fix
// is offered to the track store, which only keeps it while a GPS trek is
// recording.
// Heading: watchHeadingAsync (true north where the OS supports it), falling
// back to the raw magnetometer, then to course-over-ground from the last two
// fixes — which is all a browser can give us.

export type Fix = TrackPoint;
export type PermissionState = "unknown" | "granted" | "denied" | "unavailable";
export type HeadingSource = "compass" | "magnetometer" | "course" | null;

export function useGps(enabled: boolean) {
  const [fix, setFix] = useState<Fix | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [headingSource, setHeadingSource] = useState<HeadingSource>(null);
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [error, setError] = useState<string | null>(null);
  const prev = useRef<Fix | null>(null);
  const hasCompass = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const subs: { remove: () => void }[] = [];

    (async () => {
      try {
        const enabledSvc = await Location.hasServicesEnabledAsync().catch(() => true);
        if (!enabledSvc) {
          setPermission("unavailable");
          setError("Location services are off.");
          return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== "granted") {
          setPermission("denied");
          return;
        }
        setPermission("granted");

        const pos = await Location.watchPositionAsync(TRACKING_OPTIONS, (loc) => {
          const p = toTrackPoint(loc);
          const last = prev.current;
          if (!hasCompass.current && last && distanceMeters(last, p) > 3) {
            setHeading(bearingTrue(last, p));
            setHeadingSource("course");
          }
          prev.current = p;
          setFix(p);
          void appendPoints([p], "gps");
        });
        if (cancelled) pos.remove();
        else subs.push(pos);

        if (Platform.OS === "web") return;
        try {
          const hd = await Location.watchHeadingAsync((h) => {
            const v = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
            if (v < 0) return;
            hasCompass.current = true;
            setHeading(v);
            setHeadingSource("compass");
          });
          if (cancelled) hd.remove();
          else subs.push(hd);
        } catch {
          if (await Magnetometer.isAvailableAsync()) {
            Magnetometer.setUpdateInterval(250);
            const mag = Magnetometer.addListener(({ x, y }) => {
              // Portrait, screen up: atan2 of the horizontal field components,
              // rotated so 0° is the top of the phone; then east declination.
              const magnetic = norm360((Math.atan2(y, x) * 180) / Math.PI - 90);
              hasCompass.current = true;
              setHeading(norm360(360 - magnetic + declinationAt(prev.current?.lat ?? 39)));
              setHeadingSource("magnetometer");
            });
            if (cancelled) mag.remove();
            else subs.push(mag);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setPermission("unavailable");
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
      subs.forEach((s) => s.remove());
    };
  }, [enabled]);

  /** Let the simulator drive the same telemetry the GPS does. */
  const injectFix = useCallback((p: Fix, h: number | null) => {
    prev.current = p;
    setFix(p);
    if (h != null) {
      setHeading(h);
      setHeadingSource("course");
    }
  }, []);

  return { fix, heading, headingSource, permission, error, injectFix };
}
