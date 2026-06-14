import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    checkRoute();
  }, []);

  async function checkRoute() {
    try {
      const onboardingDone = await AsyncStorage.getItem("leaflens_onboarding");
      if (!onboardingDone) {
        setRoute("/onboarding");
        return;
      }
      const user = await AsyncStorage.getItem("leaflens_user");
      if (!user) {
        setRoute("/auth");
        return;
      }
      setRoute("/(tabs)");
    } catch {
      setRoute("/onboarding");
    }
  }

  if (!route) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAFAF8" }}>
        <ActivityIndicator size="large" color="#1F8A4C" />
      </View>
    );
  }

  return <Redirect href={route as any} />;
}
