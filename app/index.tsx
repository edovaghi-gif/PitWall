import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function Index() {
  useEffect(() => {
    (async () => {
const value = await AsyncStorage.getItem("onboarding_complete");
      if (value === "true") {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/onboarding");
      }
    })();
  }, []);

  return <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} />;
}
