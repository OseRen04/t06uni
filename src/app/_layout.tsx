import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CoursesProvider } from "@/state/CoursesContext";

export default function RootLayout() {
  return (
    <CoursesProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </CoursesProvider>
  );
}
