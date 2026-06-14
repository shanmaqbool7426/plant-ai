import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect, useRef } from "react";
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
  withRepeat,
  FadeIn,
  FadeOut,
  interpolate,
  Easing,
} from "react-native-reanimated";

import { useGarden, PendingIdentification } from "@/context/GardenContext";
import { useAuth } from "@/context/AuthContext";
import { useIdentifyPlant } from "@workspace/api-client-react";

const { width, height } = Dimensions.get("window");

const SCAN_STEPS = [
  { key: "upload", label: "Uploading photo", icon: "cloud-upload-outline" },
  { key: "identify", label: "Identifying species", icon: "search-outline" },
  { key: "enrich", label: "Getting care info", icon: "leaf-outline" },
  { key: "done", label: "Analysis complete!", icon: "checkmark-circle-outline" },
] as const;

function ScanOverlay({ capturedImage }: { capturedImage: string | null }) {
  const [stepIndex, setStepIndex] = useState(0);
  const scanLine = useSharedValue(0);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    scanLine.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sine) }),
      -1,
      true,
    );
    pulseOpacity.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);

    const timers = [
      setTimeout(() => setStepIndex(1), 1200),
      setTimeout(() => setStepIndex(2), 3200),
      setTimeout(() => setStepIndex(3), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scanLine.value, [0, 1], [0, height * 0.55]),
      },
    ],
    opacity: interpolate(scanLine.value, [0, 0.1, 0.9, 1], [0.3, 1, 1, 0.3]),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.scanOverlay}>
      {capturedImage && (
        <Image source={{ uri: capturedImage }} style={[StyleSheet.absoluteFill, { opacity: 0.45 }]} resizeMode="cover" />
      )}
      <LinearGradient
        colors={["rgba(21,94,53,0.85)", "rgba(10,40,22,0.92)"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.scanFrame}>
        <Animated.View style={[styles.scanCornerTL, pulseStyle]} />
        <Animated.View style={[styles.scanCornerTR, pulseStyle]} />
        <Animated.View style={[styles.scanCornerBL, pulseStyle]} />
        <Animated.View style={[styles.scanCornerBR, pulseStyle]} />

        <Animated.View style={[styles.scanLineWrapper, scanLineStyle]}>
          <LinearGradient
            colors={["transparent", "#4AE38B", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scanLine}
          />
          <Animated.View style={[styles.scanGlow, pulseStyle]} />
        </Animated.View>
      </View>

      <View style={styles.scanStepsCard}>
        <Text style={styles.scanTitle}>Analyzing Plant</Text>
        {SCAN_STEPS.map((step, i) => {
          const isDone = i < stepIndex;
          const isActive = i === stepIndex;
          return (
            <View key={step.key} style={styles.scanStep}>
              <View style={[
                styles.scanStepIcon,
                isDone && styles.scanStepIconDone,
                isActive && styles.scanStepIconActive,
              ]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : isActive ? (
                  <ActivityIndicator size="small" color="#1F8A4C" />
                ) : (
                  <Ionicons name={step.icon} size={14} color="#C4D9CE" />
                )}
              </View>
              <Text style={[
                styles.scanStepLabel,
                isDone && styles.scanStepLabelDone,
                isActive && styles.scanStepLabelActive,
              ]}>
                {step.label}
              </Text>
              {isActive && i < 3 && (
                <Animated.View style={[styles.scanStepDots, pulseStyle]}>
                  <Text style={styles.scanDots}>•••</Text>
                </Animated.View>
              )}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { setPendingIdentification } = useGarden();
  const { canIdentify, incrementIdentificationCount } = useAuth();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
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
    setScanError(null);
    setAnnotation(null);

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
      setScanError("Could not read image data. Please try again.");
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        router.push("/results");
      }, 700);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e?.message?.includes("ANTHROPIC_API_KEY")
        ? "AI not configured. Add your Anthropic API key."
        : e?.message?.includes("No plant identified")
        ? "No plant found. Try a clearer, closer photo."
        : "Could not identify plant. Please try again.";
      setScanError(msg);
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

      {isLoading && <ScanOverlay capturedImage={capturedImage} />}

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

      {scanError && !isLoading && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#E53935" />
          <Text style={styles.errorText}>{scanError}</Text>
          <TouchableOpacity onPress={() => setScanError(null)}>
            <Ionicons name="close" size={16} color="#E53935" />
          </TouchableOpacity>
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
          <TouchableOpacity style={styles.sideButton} onPress={() => pickImage(false)} disabled={isLoading}>
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
                  <Ionicons name="camera" size={32} color="#fff" />
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.sideButton} onPress={() => router.push("/diagnosis")} disabled={isLoading}>
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
  topBar: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  topBarContent: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12,
  },
  appTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.5 },
  topButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  scanFrame: {
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    marginBottom: 32,
  },
  scanCornerTL: {
    position: "absolute", top: 0, left: 0,
    width: 28, height: 28,
    borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#4AE38B", borderTopLeftRadius: 8,
  },
  scanCornerTR: {
    position: "absolute", top: 0, right: 0,
    width: 28, height: 28,
    borderTopWidth: 3, borderRightWidth: 3, borderColor: "#4AE38B", borderTopRightRadius: 8,
  },
  scanCornerBL: {
    position: "absolute", bottom: 0, left: 0,
    width: 28, height: 28,
    borderBottomWidth: 3, borderLeftWidth: 3, borderColor: "#4AE38B", borderBottomLeftRadius: 8,
  },
  scanCornerBR: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28,
    borderBottomWidth: 3, borderRightWidth: 3, borderColor: "#4AE38B", borderBottomRightRadius: 8,
  },
  scanLineWrapper: { position: "absolute", left: 0, right: 0, top: 0 },
  scanLine: { height: 2, width: "100%" },
  scanGlow: {
    height: 30,
    width: "100%",
    marginTop: -14,
    backgroundColor: "rgba(74,227,139,0.08)",
  },
  scanStepsCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    gap: 12,
  },
  scanTitle: {
    fontSize: 16, fontFamily: "Inter_700Bold", color: "#1a2e1a",
    marginBottom: 4, textAlign: "center",
  },
  scanStep: { flexDirection: "row", alignItems: "center", gap: 12 },
  scanStepIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#F0F4F1", alignItems: "center", justifyContent: "center",
  },
  scanStepIconDone: { backgroundColor: "#1F8A4C" },
  scanStepIconActive: { backgroundColor: "#E8F5EE" },
  scanStepLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#aaa", flex: 1 },
  scanStepLabelDone: { color: "#1a2e1a", fontFamily: "Inter_500Medium" },
  scanStepLabelActive: { color: "#1F8A4C", fontFamily: "Inter_600SemiBold" },
  scanStepDots: {},
  scanDots: { fontSize: 14, color: "#1F8A4C", letterSpacing: 2 },
  annotationContainer: {
    position: "absolute", top: "35%", left: "50%",
    transform: [{ translateX: -80 }], zIndex: 15, alignItems: "center",
  },
  annotationLine: { width: 1.5, height: 40, backgroundColor: "rgba(255,255,255,0.8)" },
  annotationPill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
  },
  annotationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#1F8A4C" },
  annotationText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1a2e1a" },
  errorBanner: {
    position: "absolute", bottom: 140, left: 20, right: 20, zIndex: 15,
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFF3F3", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: "#FFCDD2",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: "#E53935" },
  heroContent: {
    flex: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 32, marginTop: 80,
  },
  heroTitle: {
    fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff",
    textAlign: "center", lineHeight: 44, marginBottom: 12,
  },
  heroSubtitle: { fontSize: 16, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", textAlign: "center" },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    alignItems: "center", paddingHorizontal: 24, gap: 16,
  },
  badgePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  badgeText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.9)" },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32 },
  sideButton: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", gap: 2,
  },
  sideButtonLabel: { fontSize: 8, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  captureButton: { width: 84, height: 84 },
  captureButtonOuter: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.5)", padding: 4,
  },
  captureButtonInner: { flex: 1, borderRadius: 38, alignItems: "center", justifyContent: "center" },
});
