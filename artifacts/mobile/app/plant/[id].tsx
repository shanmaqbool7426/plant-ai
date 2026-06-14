import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useGarden } from "@/context/GardenContext";
import { useReminders } from "@/context/RemindersContext";

const DETAIL_TABS = ["Notes", "Care", "Plant Info"] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

function daysSince(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr: string, intervalDays: number) {
  const last = new Date(dateStr);
  const next = new Date(last);
  next.setDate(next.getDate() + intervalDays);
  const now = new Date();
  const diff = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function PlantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getPlant, removePlant, updatePlantNotes, updatePlantSchedule } = useGarden();
  const { addReminder } = useReminders();
  const [activeTab, setActiveTab] = useState<DetailTab>("Care");
  const [notesText, setNotesText] = useState("");

  const plant = getPlant(id);

  if (!plant) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Plant not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const addedDate = new Date(plant.dateAdded).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  const waterDays = plant.lastWatered ? daysUntil(plant.lastWatered, plant.wateringIntervalDays) : null;
  const fertilizeDays = plant.lastFertilized ? daysUntil(plant.lastFertilized, plant.fertilizingIntervalDays) : null;

  async function handleWaterNow() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const now = new Date().toISOString();
    await updatePlantSchedule(id, { lastWatered: now });
    if (plant.wateringEnabled) {
      await addReminder({
        plantId: id,
        plantName: plant.commonName,
        scientificName: plant.scientificName,
        plantImageUri: plant.imageUri,
        type: "water",
        dueDate: new Date(Date.now() + plant.wateringIntervalDays * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
      });
    }
  }

  async function handleDelete() {
    Alert.alert("Remove Plant", `Remove ${plant.commonName} from your garden?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removePlant(id);
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a2e1a" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={20} color="#E53935" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.heroSection}>
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Ionicons name="leaf" size={60} color="#C4D9CE" />
            </View>
          )}
          <View style={styles.heroOverlay}>
            <Text style={styles.heroName}>{plant.commonName}</Text>
            <Text style={styles.heroScientific}>{plant.scientificName}</Text>
            <Text style={styles.heroDate}>Added {addedDate}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            {DETAIL_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "Care" && (
            <View style={{ gap: 16 }}>
              <Text style={styles.sectionLabel}>Schedule</Text>
              <View style={styles.scheduleCard}>
                <View style={styles.scheduleRow}>
                  <View style={[styles.scheduleIcon, { backgroundColor: "#E3F4FF" }]}>
                    <Ionicons name="water" size={20} color="#2196F3" />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleName}>Water</Text>
                    <Text style={styles.scheduleTime}>
                      {waterDays !== null ? (waterDays <= 0 ? "Due now" : `in ${waterDays} days`) : `Every ${plant.wateringIntervalDays} days`}
                    </Text>
                  </View>
                  <Switch
                    value={plant.wateringEnabled}
                    onValueChange={(v) => updatePlantSchedule(id, { wateringEnabled: v })}
                    trackColor={{ true: "#1F8A4C", false: "#E0EBE5" }}
                    thumbColor="#fff"
                  />
                </View>

                <View style={[styles.scheduleRow, { borderTopWidth: 1, borderTopColor: "#F0F4F1", paddingTop: 14 }]}>
                  <View style={[styles.scheduleIcon, { backgroundColor: "#FFF3E0" }]}>
                    <Ionicons name="nutrition" size={20} color="#F5A623" />
                  </View>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleName}>Fertilize</Text>
                    <Text style={styles.scheduleTime}>
                      {fertilizeDays !== null ? (fertilizeDays <= 0 ? "Due now" : `in ${fertilizeDays} days`) : `Every ${plant.fertilizingIntervalDays} days`}
                    </Text>
                  </View>
                  <Switch
                    value={plant.fertilizingEnabled}
                    onValueChange={(v) => updatePlantSchedule(id, { fertilizingEnabled: v })}
                    trackColor={{ true: "#1F8A4C", false: "#E0EBE5" }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              <Text style={styles.sectionLabel}>Care Tools</Text>
              <View style={styles.toolsCard}>
                <TouchableOpacity style={styles.toolRow} onPress={handleWaterNow}>
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolName}>Water Now</Text>
                    <Text style={styles.toolDesc}>Record that you watered this plant today</Text>
                  </View>
                  <TouchableOpacity style={styles.toolCheckBtn} onPress={handleWaterNow}>
                    <Text style={styles.toolCheckText}>Done</Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                <View style={[styles.toolRow, { borderTopWidth: 1, borderTopColor: "#F0F4F1" }]}>
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolName}>Light Meter</Text>
                    <Text style={styles.toolDesc}>Measure ideal placement for your plant</Text>
                  </View>
                  <TouchableOpacity style={styles.toolCheckBtn} onPress={() => router.push("/toxicity" as any)}>
                    <Text style={styles.toolCheckText}>Check</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.toolRow, { borderTopWidth: 1, borderTopColor: "#F0F4F1" }]}>
                  <View style={styles.toolInfo}>
                    <Text style={styles.toolName}>Repotting Checker</Text>
                    <Text style={styles.toolDesc}>Find out if your plant needs repotting</Text>
                  </View>
                  <TouchableOpacity style={styles.toolCheckBtn}>
                    <Text style={styles.toolCheckText}>Check</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {activeTab === "Plant Info" && (
            <View style={{ gap: 12 }}>
              {plant.careSummary ? <Text style={styles.careSummary}>{plant.careSummary}</Text> : null}
              {[
                { label: "Family", value: plant.family },
                { label: "Toxicity to Humans", value: plant.toxicityToHumans },
                { label: "Toxicity to Pets", value: plant.toxicityToPets },
                { label: "Weed Potential", value: plant.weedPotential },
                plant.sunlight ? { label: "Sunlight", value: plant.sunlight } : null,
                plant.humidity ? { label: "Humidity", value: plant.humidity } : null,
                plant.temperature ? { label: "Temperature", value: plant.temperature } : null,
                plant.soilType ? { label: "Soil", value: plant.soilType } : null,
              ]
                .filter(Boolean)
                .map((row) => (
                  <View key={row!.label} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{row!.label}</Text>
                    <Text style={styles.infoValue}>{row!.value}</Text>
                  </View>
                ))}
            </View>
          )}

          {activeTab === "Notes" && (
            <View style={{ gap: 12 }}>
              <Text style={styles.sectionLabel}>My Notes</Text>
              <Text style={styles.notesHint}>
                {plant.notes || "No notes yet. Add observations about your plant here."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  notFoundText: { fontSize: 16, color: "#6B8C7A", marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#1F8A4C", borderRadius: 12 },
  backBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  topBar: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#F0F4F1",
    alignItems: "center", justifyContent: "center",
  },
  heroSection: { height: 260, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroPlaceholder: { backgroundColor: "#E8F5EE", alignItems: "center", justifyContent: "center" },
  heroOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 20, backgroundColor: "rgba(0,0,0,0.4)",
  },
  heroName: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  heroScientific: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", fontStyle: "italic", marginBottom: 4 },
  heroDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  card: {
    margin: 16, backgroundColor: "#fff", borderRadius: 20, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  tabs: {
    flexDirection: "row", backgroundColor: "#F0F4F1", borderRadius: 10, padding: 3, marginBottom: 16,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  tabText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B8C7A" },
  tabTextActive: { color: "#1a2e1a", fontFamily: "Inter_600SemiBold" },
  sectionLabel: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1a2e1a" },
  scheduleCard: {
    backgroundColor: "#FAFAF8", borderRadius: 14, padding: 14, gap: 14,
  },
  scheduleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  scheduleIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  scheduleInfo: { flex: 1 },
  scheduleName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1a2e1a" },
  scheduleTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B8C7A" },
  toolsCard: { backgroundColor: "#FAFAF8", borderRadius: 14 },
  toolRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  toolInfo: { flex: 1 },
  toolName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1a2e1a", marginBottom: 2 },
  toolDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B8C7A" },
  toolCheckBtn: {
    backgroundColor: "#1F8A4C", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
  },
  toolCheckText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F4F1",
  },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B8C7A", flex: 1 },
  infoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1a2e1a", flex: 1, textAlign: "right" },
  careSummary: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6B8C7A", lineHeight: 22 },
  notesHint: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#9BB5AA", fontStyle: "italic" },
});
