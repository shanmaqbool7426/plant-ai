import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
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
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

import { useGarden } from "@/context/GardenContext";
import { useReminders } from "@/context/RemindersContext";

const { height } = Dimensions.get("window");
const TAB_OPTIONS = ["Overview", "Care", "Explore"] as const;
type Tab = (typeof TAB_OPTIONS)[number];

function InfoRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color={color ?? "#6B8C7A"} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color ? { color } : {}]}>{value}</Text>
      <Ionicons name="information-circle-outline" size={14} color="#C4D9CE" />
    </View>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? "#1F8A4C" : pct >= 60 ? "#F5A623" : "#E53935";
  return (
    <View style={[styles.confidenceBadge, { borderColor: color + "33" }]}>
      <Ionicons name="checkmark-circle" size={14} color={color} />
      <Text style={[styles.confidenceText, { color }]}>{pct}% Match</Text>
    </View>
  );
}

export default function Results() {
  const insets = useSafeAreaInsets();
  const { pendingIdentification, addPlant, isSaved, setPendingIdentification } = useGarden();
  const { addReminder } = useReminders();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [saved, setSaved] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const plant = pendingIdentification;

  if (!plant) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="leaf-outline" size={40} color="#C4D9CE" />
        </View>
        <Text style={styles.emptyText}>No identification result.</Text>
        <Text style={styles.emptySubtext}>Go back and scan a plant first.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.emptyButton}>
          <Text style={styles.emptyButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const alreadySaved = isSaved(plant.commonName) || saved;

  async function handleSave() {
    if (alreadySaved) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const savedPlant = await addPlant(plant);
    setSaved(true);

    const now = new Date();
    const waterDate = new Date(now);
    waterDate.setDate(waterDate.getDate() + plant.wateringIntervalDays);
    const fertilizeDate = new Date(now);
    fertilizeDate.setDate(fertilizeDate.getDate() + plant.fertilizingIntervalDays);

    await addReminder({
      plantId: savedPlant.id,
      plantName: plant.commonName,
      scientificName: plant.scientificName,
      plantImageUri: plant.imageUri,
      type: "water",
      dueDate: waterDate.toISOString(),
      completed: false,
    });

    await addReminder({
      plantId: savedPlant.id,
      plantName: plant.commonName,
      scientificName: plant.scientificName,
      plantImageUri: plant.imageUri,
      type: "fertilize",
      dueDate: fertilizeDate.toISOString(),
      completed: false,
    });
  }

  function handleClose() {
    setPendingIdentification(null);
    router.back();
  }

  function getToxicityColor(value: string) {
    if (value.toLowerCase().includes("non-toxic")) return "#1F8A4C";
    if (value.toLowerCase().includes("toxic")) return "#E53935";
    return "#F5A623";
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <Ionicons name="close" size={22} color="#1a2e1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
          <Ionicons
            name={alreadySaved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={alreadySaved ? "#1F8A4C" : "#1a2e1a"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.imageSection}>
          <Image source={{ uri: plant.imageUri }} style={styles.mainImage} resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.35)"]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <ConfidenceBadge confidence={plant.confidence} />
        </View>

        <Animated.View entering={FadeInUp.delay(100)} style={styles.card}>
          <Text style={styles.commonName}>{plant.commonName}</Text>
          <Text style={styles.scientificName}>{plant.scientificName}</Text>

          {plant.aliases && plant.aliases.length > 0 && (
            <View style={styles.aliasRow}>
              <Text style={styles.aliasText}>
                Also known as:{" "}
                {showMore ? plant.aliases.join(", ") : plant.aliases.slice(0, 2).join(", ")}
              </Text>
              {plant.aliases.length > 2 && (
                <TouchableOpacity onPress={() => setShowMore(!showMore)}>
                  <Text style={styles.moreLink}>{showMore ? "Less" : "More"}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.tabs}>
            {TAB_OPTIONS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "Overview" && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Text style={styles.sectionTitle}>Basic Info</Text>
              <View style={styles.infoList}>
                <InfoRow
                  icon="person-outline"
                  label="Toxicity to Humans"
                  value={plant.toxicityToHumans}
                  color={getToxicityColor(plant.toxicityToHumans)}
                />
                <InfoRow
                  icon="paw-outline"
                  label="Toxicity to Pets"
                  value={plant.toxicityToPets}
                  color={getToxicityColor(plant.toxicityToPets)}
                />
                <InfoRow icon="alert-circle-outline" label="Weed Potential" value={plant.weedPotential} />
                <InfoRow icon="layers-outline" label="Family" value={plant.family} />
              </View>
              <Text style={styles.careSummaryText}>{plant.careSummary}</Text>
            </Animated.View>
          )}

          {activeTab === "Care" && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Text style={styles.sectionTitle}>Care Schedule</Text>
              <View style={styles.careGrid}>
                <View style={styles.careCard}>
                  <View style={[styles.careIcon, { backgroundColor: "#E3F4FF" }]}>
                    <Ionicons name="water" size={22} color="#2196F3" />
                  </View>
                  <Text style={styles.careLabel}>Watering</Text>
                  <Text style={styles.careValue}>Every {plant.wateringIntervalDays}d</Text>
                </View>
                <View style={styles.careCard}>
                  <View style={[styles.careIcon, { backgroundColor: "#FFF3E0" }]}>
                    <Ionicons name="nutrition" size={22} color="#F5A623" />
                  </View>
                  <Text style={styles.careLabel}>Fertilizing</Text>
                  <Text style={styles.careValue}>Every {plant.fertilizingIntervalDays}d</Text>
                </View>
              </View>
              <View style={styles.infoList}>
                {plant.sunlight && <InfoRow icon="sunny-outline" label="Sunlight" value={plant.sunlight} />}
                {plant.humidity && <InfoRow icon="water-outline" label="Humidity" value={plant.humidity} />}
                {plant.temperature && <InfoRow icon="thermometer-outline" label="Temperature" value={plant.temperature} />}
                {plant.soilType && <InfoRow icon="layers-outline" label="Soil" value={plant.soilType} />}
              </View>
            </Animated.View>
          )}

          {activeTab === "Explore" && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.exploreSection}>
              <View style={styles.exploreIconWrap}>
                <Ionicons name="leaf" size={36} color="#1F8A4C" />
              </View>
              <Text style={styles.exploreText}>
                Discover more about {plant.commonName} and similar plants in our database.
              </Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push("/(tabs)/explore" as any)}>
                <Text style={styles.exploreBtnText}>Find Similar Plants</Text>
                <Ionicons name="arrow-forward" size={16} color="#1F8A4C" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        <View style={styles.actions}>
          {!alreadySaved ? (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
              <LinearGradient colors={["#28A858", "#1F8A4C"]} style={styles.saveGradient}>
                <Ionicons name="leaf" size={18} color="#fff" />
                <Text style={styles.saveText}>Add to My Garden</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={20} color="#1F8A4C" />
              <Text style={styles.savedText}>Saved! Reminders set for watering & fertilizing.</Text>
            </View>
          )}

          <TouchableOpacity style={styles.chatButton} onPress={() => router.push("/chat" as any)}>
            <Ionicons name="chatbubble-outline" size={18} color="#1F8A4C" />
            <Text style={styles.chatText}>Ask the Expert</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: "#F0F4F1",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  emptyText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#1a2e1a" },
  emptySubtext: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6B8C7A", marginBottom: 8 },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#1F8A4C", borderRadius: 12 },
  emptyButtonText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#FAFAF8",
  },
  headerButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#F0F4F1",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#1a2e1a" },
  imageSection: { height: 260, position: "relative" },
  mainImage: { width: "100%", height: "100%" },
  confidenceBadge: {
    position: "absolute", bottom: 14, right: 14,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  confidenceText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  card: {
    marginHorizontal: 16, marginTop: -24, backgroundColor: "#fff",
    borderRadius: 20, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  commonName: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#1a2e1a", marginBottom: 4 },
  scientificName: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6B8C7A", fontStyle: "italic", marginBottom: 8 },
  aliasRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 12, gap: 4 },
  aliasText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B8C7A", flex: 1 },
  moreLink: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1F8A4C" },
  tabs: { flexDirection: "row", backgroundColor: "#F0F4F1", borderRadius: 10, padding: 3, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  tabBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B8C7A" },
  tabBtnTextActive: { color: "#1a2e1a", fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1a2e1a", marginBottom: 12 },
  infoList: { gap: 12, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B8C7A" },
  infoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1a2e1a", maxWidth: "45%" },
  careSummaryText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6B8C7A", lineHeight: 22 },
  careGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  careCard: { flex: 1, backgroundColor: "#FAFAF8", borderRadius: 14, padding: 14, alignItems: "center", gap: 6 },
  careIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  careLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B8C7A" },
  careValue: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#1a2e1a", textAlign: "center" },
  exploreSection: { alignItems: "center", paddingVertical: 20, gap: 14 },
  exploreIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: "#E8F5EE",
    alignItems: "center", justifyContent: "center",
  },
  exploreText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6B8C7A", textAlign: "center", lineHeight: 22 },
  exploreBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#1F8A4C",
  },
  exploreBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1F8A4C" },
  actions: { marginHorizontal: 16, marginTop: 16, gap: 12 },
  saveButton: { borderRadius: 14, overflow: "hidden" },
  saveGradient: { paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  savedRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#E8F5EE", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14,
  },
  savedText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#1F8A4C", flex: 1 },
  chatButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#1F8A4C",
  },
  chatText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1F8A4C" },
});
