import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Identify Any Plant",
    subtitle: "Point your camera at any plant and get instant identification with 98%+ accuracy powered by advanced AI.",
    icon: "camera",
    color: "#1F8A4C",
    light: "#E8F5EE",
  },
  {
    id: "2",
    title: "Diagnose Problems",
    subtitle: "Detect diseases, pests, and nutrient deficiencies before they cause irreversible damage.",
    icon: "medkit",
    color: "#E53935",
    light: "#FDE8E8",
  },
  {
    id: "3",
    title: "Smart Care Reminders",
    subtitle: "Never forget to water or fertilize. Get personalized schedules tailored to each plant's needs.",
    icon: "notifications",
    color: "#F5A623",
    light: "#FEF4E4",
  },
  {
    id: "4",
    title: "Build Your Garden",
    subtitle: "Track all your plants in one beautiful place. Monitor their health and growth over time.",
    icon: "leaf",
    color: "#1F8A4C",
    light: "#E8F5EE",
  },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function handleNext() {
    if (activeIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
      setActiveIndex(activeIndex + 1);
    } else {
      handleGetStarted();
    }
  }

  async function handleGetStarted() {
    await AsyncStorage.setItem("leaflens_onboarding", "done");
    router.replace("/auth");
  }

  function handleScroll(e: any) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  }

  const slide = slides[activeIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {slides.map((s) => (
          <View key={s.id} style={[styles.slide, { width }]}>
            <View style={[styles.iconContainer, { backgroundColor: s.light }]}>
              <Ionicons name={s.icon as any} size={80} color={s.color} />
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.subtitle}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 || (Platform.OS === "web" ? 58 : 24) }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex
                  ? { width: 24, backgroundColor: "#1F8A4C" }
                  : { backgroundColor: "#C4D9CE" },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={["#28A858", "#1F8A4C"]}
            style={styles.nextGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.nextText}>
              {activeIndex === slides.length - 1 ? "Get Started" : "Next"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {activeIndex < slides.length - 1 && (
          <TouchableOpacity onPress={handleGetStarted} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: "#1a2e1a",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#6B8C7A",
    textAlign: "center",
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 16,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    width: 8,
  },
  nextButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  nextGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#6B8C7A",
  },
});
