import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed";
import { colors } from "@/constants/theme";
import { WebShell } from "@/components/WebShell";
import { AuthProvider } from "@/lib/auth";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Barlow Condensed — the website's heading face. Kept off the critical path:
  // if it fails to load we still render on the platform font.
  const [fontsLoaded, fontError] = useFonts({ BarlowCondensed_600SemiBold, BarlowCondensed_700Bold });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <WebShell>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="sign-in" options={{ presentation: "modal" }} />
            {/* Build 7 · Connect. norcalhunt://invite/<code> → invite/[code] via expo-router. */}
            <Stack.Screen name="profile" />
            <Stack.Screen name="search" />
            <Stack.Screen name="requests" />
            <Stack.Screen name="feed" />
            <Stack.Screen name="hunter/[id]" />
            <Stack.Screen name="invite/index" />
            <Stack.Screen name="invite/[code]" />
          </Stack>
        </WebShell>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
