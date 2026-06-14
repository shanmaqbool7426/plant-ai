import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useState, useRef } from "react";
import {
  Dimensions,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const SLIDER_HEIGHT = 320;

export default function ComparisonScreen() {
  const insets = useSafeAreaInsets();
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [sliderX, setSliderX] = useState(width / 2);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const newX = Math.max(20, Math.min(width - 20, gs.moveX));
        setSliderX(newX);
      },
    })
  ).current;

  async function pickImage(slot: "before" | "after") {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) {
      if (slot === "before") setBeforeImage(result.assets[0].uri);
      else setAfterImage(result.assets[0].uri);
    }
  }

  const showComparison = beforeImage && afterImage;

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a2e1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Before / After</Text>
        <View style={{ width: 40 }} />
      </View>

      {showComparison ? (
        <View style={styles.sliderContainer} {...panResponder.panHandlers}>
          <Image source={{ uri: afterImage! }} style={[styles.sliderImage, StyleSheet.absoluteFill]} resizeMode="cover" />
          <View style={{ width: sliderX, overflow: "hidden", ...StyleSheet.absoluteFillObject }}>
            <Image source={{ uri: beforeImage! }} style={[styles.sliderImage, { width }]} resizeMode="cover" />
          </View>
          <View style={[styles.sliderLine, { left: sliderX }]}>
            <View style={styles.sliderHandle}>
              <Ionicons name="chevron-back" size={14} color="#fff" />
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </View>
          </View>
          <View style={[styles.labelBefore, { left: 12 }]}>
            <Text style={styles.labelText}>Before</Text>
          </View>
          <View style={[styles.labelAfter, { right: 12 }]}>
            <Text style={styles.labelText}>After</Text>
          </View>
        </View>
      ) : (
        <View style={styles.uploadArea}>
          <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage("before")}>
            {beforeImage ? (
              <Image source={{ uri: beforeImage }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <>
                <View style={styles.uploadIcon}><Ionicons name="image-outline" size={32} color="#C4D9CE" /></View>
                <Text style={styles.uploadLabel}>Before Photo</Text>
                <Text style={styles.uploadHint}>Diseased or unhealthy</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage("after")}>
            {afterImage ? (
              <Image source={{ uri: afterImage }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <>
                <View style={styles.uploadIcon}><Ionicons name="image-outline" size={32} color="#C4D9CE" /></View>
                <Text style={styles.uploadLabel}>After Photo</Text>
                <Text style={styles.uploadHint}>Healthy and recovered</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          {showComparison ? "Drag the slider to compare" : "Upload two photos to compare plant health"}
        </Text>
        {showComparison && (
          <TouchableOpacity style={styles.resetBtn} onPress={() => { setBeforeImage(null); setAfterImage(null); }}>
            <Text style={styles.resetText}>Start Over</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F0F4F1", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#1a2e1a" },
  sliderContainer: {
    height: SLIDER_HEIGHT,
    overflow: "hidden",
    position: "relative",
    marginHorizontal: 0,
  },
  sliderImage: { height: SLIDER_HEIGHT },
  sliderLine: {
    position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  sliderHandle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#1F8A4C",
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  labelBefore: {
    position: "absolute", top: 12,
    backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  labelAfter: {
    position: "absolute", top: 12,
    backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  labelText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  uploadArea: { flex: 1, flexDirection: "row", gap: 12, padding: 16 },
  uploadCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 16, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#E0EBE5", borderStyle: "dashed", overflow: "hidden", minHeight: 200,
  },
  uploadPreview: { width: "100%", height: "100%" },
  uploadIcon: { marginBottom: 10 },
  uploadLabel: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1a2e1a", marginBottom: 4 },
  uploadHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B8C7A" },
  footer: { padding: 20, alignItems: "center", gap: 12 },
  footerHint: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9BB5AA", textAlign: "center" },
  resetBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: "#E0EBE5" },
  resetText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#6B8C7A" },
});
