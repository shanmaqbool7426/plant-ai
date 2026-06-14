import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";

import { useIdentifyPlant } from "@workspace/api-client-react";

export default function ToxicityScreen() {
  const insets = useSafeAreaInsets();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [toxicityData, setToxicityData] = useState<{ humans: string; dogs: string; cats: string } | null>(null);

  const identifyMutation = useIdentifyPlant();
  const isLoading = identifyMutation.isPending;

  async function pickImage(useCamera: boolean) {
    let result: ImagePicker.ImagePickerResult;
    try {
      if (useCamera) {
        result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", base64: true, quality: 0.6 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", base64: true, quality: 0.6 });
      }
    } catch { return; }
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setCapturedImage(asset.uri);
    if (!asset.base64) return;

    try {
      const data = await identifyMutation.mutateAsync({ image: asset.base64, mediaType: (asset.mimeType as any) ?? "image/jpeg" });
      setToxicityData({
        humans: data.toxicityToHumans,
        dogs: data.toxicityToPets,
        cats: data.toxicityToPets,
      });
    } catch {}
  }

  function getToxicityIcon(value: string) {
    return value.toLowerCase().includes("non-toxic") ? "checkmark-circle" : "warning";
  }
  function getToxicityColor(value: string) {
    return value.toLowerCase().includes("non-toxic") ? "#1F8A4C" : "#E53935";
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Toxicity Check</Text>
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
            <Text style={styles.instructionText}>Point at a plant to check toxicity</Text>
          </LinearGradient>
        )}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>

      {toxicityData && (
        <Animated.View entering={FadeInUp} style={styles.resultsBar}>
          {[
            { icon: "person", label: "Humans", value: toxicityData.humans },
            { icon: "footsteps", label: "Dogs", value: toxicityData.dogs },
            { icon: "paw", label: "Cats", value: toxicityData.cats },
          ].map((item) => (
            <View key={item.label} style={[styles.toxCard, { borderColor: getToxicityColor(item.value) + "44" }]}>
              <Ionicons name={getToxicityIcon(item.value) as any} size={24} color={getToxicityColor(item.value)} />
              <Text style={[styles.toxLabel, { color: getToxicityColor(item.value) }]} numberOfLines={2}>
                {item.value.length > 20 ? item.value.split(" ").slice(0, 3).join(" ") : item.value}
              </Text>
              <Text style={styles.toxType}>{item.label}</Text>
            </View>
          ))}
        </Animated.View>
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
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
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
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  resultsBar: {
    flexDirection: "row", gap: 10, padding: 16, backgroundColor: "#FAFAF8",
  },
  toxCard: {
    flex: 1, alignItems: "center", padding: 12, backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1.5, gap: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  toxLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  toxType: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#9BB5AA" },
  bottomBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32, paddingTop: 16, paddingHorizontal: 24, backgroundColor: "#1a2e1a" },
  sideBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  captureBtn: { width: 72, height: 72 },
  captureBtnInner: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
});
