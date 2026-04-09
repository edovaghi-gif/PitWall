import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0A0A0A" },
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { color: "#FFFFFF" },
        headerShadowVisible: false,
        headerBorderColor: "#2A2A2A",
      }}
    />
  );
}
