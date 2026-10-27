import { Alert, Platform } from "react-native";

/** Yes/no prompt that also works on web (Alert.alert is a no-op there). */
export function confirm(title: string, message: string, destructiveLabel = "Delete"): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: destructiveLabel, style: "destructive", onPress: () => resolve(true) },
    ]),
  );
}
