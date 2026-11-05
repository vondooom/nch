import { Alert, Linking, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { newId } from "./waypoints";

// One photo per hunt, kept on this phone only. Native copies the picked image
// into the app's document directory (the picker's cache copy can be purged)
// and stores the path *relative* to it — iOS moves the app container on
// updates, so an absolute file:// URI would go stale. Web keeps the URI the
// picker hands back. Supabase sync strips the field (lib/supabase.ts).

const DIR = "hunt-photos/";

export type PhotoSource = "camera" | "library";

export type PickResult =
  | { status: "ok"; photo: string }
  | { status: "cancelled" }
  | { status: "denied"; source: PhotoSource }
  | { status: "error"; message: string };

/** Resolve a stored photo value to something <Image source={{ uri }}> can load. */
export function photoUri(photo?: string | null): string | null {
  if (!photo) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(photo)) return photo;
  return FileSystem.documentDirectory ? `${FileSystem.documentDirectory}${photo}` : null;
}

export async function pickHuntPhoto(source: PhotoSource): Promise<PickResult> {
  try {
    if (source === "camera" && Platform.OS !== "web") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return { status: "denied", source };
    }
    // The system photo picker needs no library permission on iOS 14+ / Android 13+.
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.6, exif: false };
    const res = source === "camera" ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    const asset = res.canceled ? null : res.assets?.[0];
    if (!asset) return { status: "cancelled" };
    if (Platform.OS === "web" || !FileSystem.documentDirectory) return { status: "ok", photo: asset.uri };

    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}${DIR}`, { intermediates: true });
    const ext = (/\.(jpe?g|png|heic|webp)$/i.exec(asset.uri)?.[1] ?? "jpg").toLowerCase();
    const rel = `${DIR}${newId("photo")}.${ext}`;
    await FileSystem.copyAsync({ from: asset.uri, to: `${FileSystem.documentDirectory}${rel}` });
    return { status: "ok", photo: rel };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: "error", message: /camera/i.test(msg) && source === "camera" ? "No camera available on this device." : msg };
  }
}

/** Best-effort cleanup of a photo this app copied in. */
export async function deleteHuntPhoto(photo?: string | null): Promise<void> {
  if (!photo || Platform.OS === "web" || /^[a-z][a-z0-9+.-]*:/i.test(photo)) return;
  const uri = photoUri(photo);
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Already gone — nothing to do.
  }
}

/** Explain a denied permission and offer the Settings shortcut. */
export function explainDenied(source: PhotoSource): void {
  const what = source === "camera" ? "Camera" : "Photos";
  const msg = `${what} access is turned off for NorCalHunt. You can turn it on in Settings → NorCalHunt → ${what}, or pick a photo from your library instead.`;
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(msg);
    return;
  }
  Alert.alert(`${what} access needed`, msg, [
    { text: "Not now", style: "cancel" },
    { text: "Open Settings", onPress: () => void Linking.openSettings() },
  ]);
}
