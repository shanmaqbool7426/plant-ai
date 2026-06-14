import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useDiagnosePlant } from "@workspace/api-client-react";

const { width } = Dimensions.get("window");

const LIKELIHOOD_COLORS = { high: "#E53935", medium: "#F5A623", low: "#1F8A4C" };

export default function DiagnosisScreen() {
  const insets = useSafeAreaInsets();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  const diagnoseMutation = useDiagnosePlant();
  const isLoading = diagnoseMutation.isPending;

  async function pickImage(useCamera: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let result: ImagePicker.ImagePickerResult;
    try {
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", base64: true, quality: 0.6 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", base64: true, quality: 0.6 });
      }
    } catch {
      return;
    }
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setCapturedImage(asset.uri);
    setDiagnosis(null);

    if (!asset.base64) return;

    try {
      const result2 = await diagnoseMutation.mutateAsync({
        image: asset.base64,
        mediaType: (asset.mimeType as any) ?? "image/jpeg",
      });
      setDiagnosis(result2);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      setDiagnosis(null);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Auto-Diagnose</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageArea}>
        {capturedImage ? (
          <Image source={{ uri: capturedImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient colors={["#155E35", "#1F8A4C"]} style={StyleSheet.absoluteFill}>
            <View style={styles.bracketContainer}>
              <View style={[styles.bracket, styles.bracketTL]} />
              <View style={[styles.bracket, styles.bracketTR]} />
              <View style={[styles.bracket, styles.bracketBL]} />
              <View style={[styles.bracket, styles.bracketBR]} />
            </View>
            <Text style={styles.instructionText}>Frame the affected leaf</Text>
          </LinearGradient>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Analyzing...</Text>
          </View>
        )}

        {diagnosis && !isLoading && (
          <Animated.View entering={FadeInUp} style={styles.causesCard}>
            <Text style={styles.causesTitle}>
              {diagnosis.isHealthy ? "Plant appears healthy" : "Causes of Disease"}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.causesScroll}>
              {(diagnosis.causes ?? []).map((cause: any, i: number) => (
                <View
                  key={i}
                  style={[styles.causePill, { backgroundColor: LIKELIHOOD_COLORS[cause.likelihood as keyof typeof LIKELIHOOD_COLORS] + "22", borderColor: LIKELIHOOD_COLORS[cause.likelihood as keyof typeof LIKELIHOOD_COLORS] + "55" }]}
                >
                  <Text style={[styles.causePillText, { color: LIKELIHOOD_COLORS[cause.likelihood as keyof typeof LIKELIHOOD_COLORS] }]}>
                    {cause.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
            {diagnosis.summary && <Text style={styles.causesSummary}>{diagnosis.summary}</Text>}
          </Animated.View>
        )}
      </View>

      {diagnosis && (
        <ScrollView style={styles.treatmentSection} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.treatmentTitle}>Treatment Steps</Text>
          {(diagnosis.treatmentSteps ?? []).map((step: string, i: number) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 || (Platform.OS === "web" ? 54 : 20) }]}>
        <TouchableOpacity style={styles.sideBtn} onPress={() => pickImage(false)}>
          <Feather name="image" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureBtn} onPress={() => pickImage(true)} disabled={isLoading}>
          <LinearGradient colors={["#28A858", "#1F8A4C"]} style={styles.captureBtnInner}>
            {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="camera" size={28} color="#fff" />}
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.sideBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a2e1a" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#fff" },
  doneText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  imageArea: { flex: 1, position: "relative", overflow: "hidden" },
  bracketContainer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  bracket: { position: "absolute", width: 30, height: 30, borderColor: "rgba(255,255,255,0.6)" },
  bracketTL: { top: "25%", left: "15%", borderTopWidth: 3, borderLeftWidth: 3 },
  bracketTR: { top: "25%", right: "15%", borderTopWidth: 3, borderRightWidth: 3 },
  bracketBL: { bottom: "25%", left: "15%", borderBottomWidth: 3, borderLeftWidth: 3 },
  bracketBR: { bottom: "25%", right: "15%", borderBottomWidth: 3, borderRightWidth: 3 },
  instructionText: { position: "absolute", bottom: "22%", alignSelf: "center", fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  causesCard: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(26,46,26,0.95)", padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  causesTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 10 },
  causesScroll: { flexGrow: 0, marginBottom: 8 },
  causePill: {
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8,
    borderWidth: 1,
  },
  causePillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  causesSummary: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", lineHeight: 18 },
  treatmentSection: { maxHeight: 200, backgroundColor: "#FAFAF8" },
  treatmentTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1a2e1a", marginBottom: 12 },
  stepRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#1F8A4C", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNumText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  stepText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#1a2e1a", lineHeight: 20 },
  bottomBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32, paddingTop: 16, paddingHorizontal: 24, backgroundColor: "#1a2e1a" },
  sideBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  captureBtn: { width: 72, height: 72 },
  captureBtnInner: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
});
