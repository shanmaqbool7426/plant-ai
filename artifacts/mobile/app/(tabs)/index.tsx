import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

import { useGarden, PendingIdentification } from "@/context/GardenContext";
import { useAuth } from "@/context/AuthContext";
import { useIdentifyPlant } from "@workspace/api-client-react";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { setPendingIdentification } = useGarden();
  const { canIdentify, incrementIdentificationCount } = useAuth();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState<string | null>(null);
  const [isFirstLaunch] = useState(true);

  const identifyMutation = useIdentifyPlant();
  const isLoading = identifyMutation.isPending;

  const captureScale = useSharedValue(1);
  const captureStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value }],
  }));

  async function pickImage(useCamera: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureScale.value = withSpring(0.9, {}, () => {
      captureScale.value = withSpring(1);
    });

    if (!canIdentify()) {
      router.push("/paywall");
      return;
    }

    let result: ImagePicker.ImagePickerResult;
    try {
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: "images",
          base64: true,
          quality: 0.6,
          allowsEditing: false,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          base64: true,
          quality: 0.6,
        });
      }
    } catch {
      return;
    }

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setCapturedImage(asset.uri);
    setAnnotation(null);

    if (!asset.base64) {
      return;
    }

    try {
      const plantData = await identifyMutation.mutateAsync({
        image: asset.base64,
        mediaType: (asset.mimeType as any) ?? "image/jpeg",
      });

      await incrementIdentificationCount();

      const pending: PendingIdentification = {
        ...plantData,
        imageUri: asset.uri,
      };
      setAnnotation(plantData.commonName);
      setPendingIdentification(pending);

      setTimeout(() => {
        router.push("/results");
      }, 800);
    } catch (e: any) {
      const msg = e?.message?.includes("ANTHROPIC_API_KEY")
        ? "AI not configured. Add your Anthropic API key."
        : "Could not identify plant. Try a clearer photo.";
      setAnnotation(null);
    }
  }

  return (
    <View style={styles.container}>
      {capturedImage ? (
        <Image source={{ uri: capturedImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={["#155E35", "#1F8A4C", "#28A858"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.bgDecor}>
            <Image
              source={require("@/assets/images/plant_hero.png")}
              style={styles.bgPlant}
              resizeMode="cover"
            />
            <View style={styles.bgOverlay} />
          </View>
        </LinearGradient>
      )}

      <View style={[styles.topBar, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
        <View style={styles.topBarContent}>
          <Text style={styles.appTitle}>LeafLens</Text>
          <TouchableOpacity style={styles.topButton}>
            <Ionicons name="flash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#1F8A4C" />
            <Text style={styles.loadingText}>Identifying plant...</Text>
            <Text style={styles.loadingSubtext}>Analyzing with AI</Text>
          </View>
        </Animated.View>
      )}

      {annotation && !isLoading && (
        <Animated.View entering={FadeIn} style={styles.annotationContainer}>
          <View style={styles.annotationLine} />
          <View style={styles.annotationPill}>
            <View style={styles.annotationDot} />
            <Text style={styles.annotationText}>{annotation}</Text>
            <Ionicons name="checkmark-circle" size={16} color="#1F8A4C" />
          </View>
        </Animated.View>
      )}

      {!capturedImage && (
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Your Ultimate{"\n"}Plant Identifier</Text>
          <Text style={styles.heroSubtitle}>Point at any plant to identify instantly</Text>
        </View>
      )}

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + 24 || (Platform.OS === "web" ? 58 : 24) },
        ]}
      >
        {isFirstLaunch && !capturedImage && (
          <View style={styles.badgePill}>
            <Ionicons name="star" size={12} color="#F5A623" />
            <Text style={styles.badgeText}>100 Million Downloads</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity style={styles.sideButton} onPress={() => pickImage(false)}>
            <Feather name="image" size={24} color="#fff" />
          </TouchableOpacity>

          <Animated.View style={captureStyle}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => pickImage(true)}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              <View style={styles.captureButtonOuter}>
                <LinearGradient
                  colors={["#28A858", "#1F8A4C"]}
                  style={styles.captureButtonInner}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="camera" size={32} color="#fff" />
                  )}
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.sideButton} onPress={() => router.push("/diagnosis")}>
            <Ionicons name="medical" size={24} color="#fff" />
            <Text style={styles.sideButtonLabel}>Diagnose</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1F8A4C" },
  bgDecor: { ...StyleSheet.absoluteFillObject },
  bgPlant: { width: "100%", height: "100%", opacity: 0.35 },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(21, 94, 53, 0.45)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  appTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 12,
    minWidth: 200,
  },
  loadingText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#1a2e1a",
  },
  loadingSubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#6B8C7A",
  },
  annotationContainer: {
    position: "absolute",
    top: "35%",
    left: "50%",
    transform: [{ translateX: -80 }],
    zIndex: 15,
    alignItems: "center",
  },
  annotationLine: {
    width: 1.5,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  annotationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  annotationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1F8A4C",
  },
  annotationText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#1a2e1a",
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 80,
  },
  heroTitle: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
    lineHeight: 44,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.9)",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  sideButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  sideButtonLabel: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
  },
  captureButton: {
    width: 84,
    height: 84,
  },
  captureButtonOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
    padding: 4,
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
