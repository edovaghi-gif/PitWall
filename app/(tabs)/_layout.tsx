import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#E10600",
        tabBarInactiveTintColor: "#555555",
        tabBarStyle: {
          backgroundColor: "#0A0A0A",
          borderTopWidth: 0.5,
          borderTopColor: "#2A2A2A",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={focused ? "#E10600" : "#555555"} />
          ),
        }}
      />
      <Tabs.Screen
        name="circuito"
        options={{
          tabBarLabel: "Circuito",
          title: "",
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "map" : "map-outline"} size={22} color={focused ? "#E10600" : "#555555"} />
          ),
        }}
      />
      <Tabs.Screen
        name="headtohead"
        options={{
          tabBarLabel: "Head to Head",
          title: "",
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={22} color={focused ? "#E10600" : "#555555"} />
          ),
        }}
      />
      <Tabs.Screen
        name="prediction"
        options={{
          tabBarLabel: "Prediction",
          title: "",
          tabBarIcon: ({ focused }) => (
            <Ionicons name={focused ? "trophy" : "trophy-outline"} size={22} color={focused ? "#E10600" : "#555555"} />
          ),
        }}
      />
    </Tabs>
  );
}
