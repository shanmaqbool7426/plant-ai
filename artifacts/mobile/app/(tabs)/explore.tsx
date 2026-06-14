import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";

interface PlantEntry {
  id: string;
  commonName: string;
  scientificName: string;
  tags: string[];
  imageSource: any;
  liked: boolean;
}

const SAMPLE_PLANTS: PlantEntry[] = [
  { id: "1", commonName: "Monstera Deliciosa", scientificName: "Monstera deliciosa", tags: ["Low-light", "Air-purifying", "Pet-safe"], imageSource: require("@/assets/images/plant_hero.png"), liked: false },
  { id: "2", commonName: "Japanese Camellia", scientificName: "Camellia japonica", tags: ["Flowering", "Long-blooming", "Deer-resistant"], imageSource: require("@/assets/images/plant_camellia.png"), liked: true },
  { id: "3", commonName: "Dieffenbachia", scientificName: "Dieffenbachia seguine", tags: ["Indoor", "Tropical", "Easy-care"], imageSource: require("@/assets/images/plant_dieff.png"), liked: false },
  { id: "4", commonName: "Peace Lily", scientificName: "Spathiphyllum wallisii", tags: ["Air-purifying", "Low-light", "Flowering"], imageSource: require("@/assets/images/plant_hero.png"), liked: false },
  { id: "5", commonName: "Snake Plant", scientificName: "Dracaena trifasciata", tags: ["Pet-safe", "Drought-tolerant", "Low-light"], imageSource: require("@/assets/images/plant_hero.png"), liked: true },
  { id: "6", commonName: "Pothos", scientificName: "Epipremnum aureum", tags: ["Easy-care", "Trailing", "Air-purifying"], imageSource: require("@/assets/images/plant_hero.png"), liked: false },
];

const FILTER_CHIPS = ["Flowering Plants", "Pet-friendly", "Low-light", "Drought-tolerant", "Indoor", "Outdoor"];

function PlantTag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function PlantListItem({ plant, index }: { plant: PlantEntry; index: number }) {
  const [liked, setLiked] = useState(plant.liked);

  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(280)} style={styles.listItem}>
      <Image source={plant.imageSource} style={styles.listImage} resizeMode="cover" />
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{plant.commonName}</Text>
        <Text style={styles.listScientific}>{plant.scientificName}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
          {plant.tags.map((t) => <PlantTag key={t} label={t} />)}
        </ScrollView>
      </View>
      <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.heartBtn}>
        <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? "#E53935" : "#C4D9CE"} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  function toggleFilter(f: string) {
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }

  const filtered = SAMPLE_PLANTS.filter((p) => {
    const matchesQuery =
      !query ||
      p.commonName.toLowerCase().includes(query.toLowerCase()) ||
      p.scientificName.toLowerCase().includes(query.toLowerCase());
    const matchesFilters =
      activeFilters.length === 0 ||
      activeFilters.some((f) => p.tags.some((t) => t.toLowerCase().includes(f.toLowerCase())));
    return matchesQuery && matchesFilters;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Finder</Text>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={18} color="#6B8C7A" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search plants..."
          placeholderTextColor="#9BB5AA"
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9BB5AA" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={styles.filtersContent}>
        {FILTER_CHIPS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilters.includes(f) && styles.filterChipActive]}
            onPress={() => toggleFilter(f)}
          >
            {activeFilters.includes(f) && <Ionicons name="close" size={12} color="#fff" />}
            <Text style={[styles.filterChipText, activeFilters.includes(f) && styles.filterChipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.resultsCount}>Matched Plants ({filtered.length})</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <PlantListItem plant={item} index={index} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#1a2e1a" },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#1a2e1a" },
  filtersRow: { flexGrow: 0, marginBottom: 4 },
  filtersContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#F0F4F1", borderWidth: 1, borderColor: "#E0EBE5",
  },
  filterChipActive: { backgroundColor: "#1F8A4C", borderColor: "#1F8A4C" },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B8C7A" },
  filterChipTextActive: { color: "#fff" },
  resultsCount: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6B8C7A", marginHorizontal: 20, marginVertical: 8 },
  list: { paddingHorizontal: 16 },
  listItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14,
    marginBottom: 10, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  listImage: { width: 80, height: 80 },
  listInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  listName: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#1a2e1a", marginBottom: 2 },
  listScientific: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6B8C7A", fontStyle: "italic", marginBottom: 6 },
  tagRow: { flexGrow: 0 },
  tag: { backgroundColor: "#E8F5EE", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 6 },
  tagText: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#1F8A4C" },
  heartBtn: { paddingRight: 14 },
});
