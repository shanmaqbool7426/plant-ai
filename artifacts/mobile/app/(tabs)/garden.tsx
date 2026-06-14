import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";

import { useGarden, SavedPlant } from "@/context/GardenContext";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 2;

function PlantCard({ plant, index }: { plant: SavedPlant; index: number }) {
  return (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(300)}>
      <TouchableOpacity
        style={styles.plantCard}
        onPress={() => router.push(`/plant/${plant.id}` as any)}
        activeOpacity={0.85}
      >
        {plant.imageUri ? (
          <Image source={{ uri: plant.imageUri }} style={styles.plantImage} resizeMode="cover" />
        ) : (
          <View style={[styles.plantImage, styles.plantImagePlaceholder]}>
            <Ionicons name="leaf" size={32} color="#C4D9CE" />
          </View>
        )}
        <View style={styles.plantInfo}>
          <Text style={styles.plantName} numberOfLines={1}>{plant.commonName}</Text>
          <Text style={styles.plantScientific} numberOfLines={1}>{plant.scientificName}</Text>
          <View style={styles.plantMeta}>
            <View style={styles.waterBadge}>
              <Ionicons name="water" size={10} color="#2196F3" />
              <Text style={styles.waterText}>{plant.wateringIntervalDays}d</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function GardenScreen() {
  const insets = useSafeAreaInsets();
  const { plants } = useGarden();

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Garden</Text>
        <Text style={styles.headerCount}>{plants.length} {plants.length === 1 ? "plant" : "plants"}</Text>
      </View>

      {plants.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="leaf" size={48} color="#C4D9CE" />
          </View>
          <Text style={styles.emptyTitle}>Your garden is empty</Text>
          <Text style={styles.emptySubtitle}>Identify plants to add them here</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/(tabs)/" as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={16} color="#fff" />
            <Text style={styles.emptyButtonText}>Identify a Plant</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={plants}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <PlantCard plant={item} index={index} />}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#1a2e1a" },
  headerCount: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6B8C7A" },
  grid: { paddingHorizontal: 16, paddingBottom: 120 },
  row: { gap: 16, marginBottom: 16 },
  plantCard: {
    width: CARD_SIZE,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  plantImage: { width: "100%", height: CARD_SIZE * 0.75 },
  plantImagePlaceholder: {
    backgroundColor: "#F0F4F1",
    alignItems: "center",
    justifyContent: "center",
  },
  plantInfo: { padding: 12 },
  plantName: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#1a2e1a", marginBottom: 2 },
  plantScientific: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6B8C7A", fontStyle: "italic", marginBottom: 8 },
  plantMeta: { flexDirection: "row" },
  waterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E3F4FF",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  waterText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#2196F3" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: "#F0F4F1",
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#1a2e1a", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6B8C7A", marginBottom: 24, textAlign: "center" },
  emptyButton: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#1F8A4C", borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14,
  },
  emptyButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
