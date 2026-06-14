import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInUp, FadeOut, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useListScans, useDeleteScan } from "@workspace/api-client-react";

const { width } = Dimensions.get("window");

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  if (diffDays < 30) return "Earlier this Month";
  return "Older";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "#1F8A4C";
  if (confidence >= 0.6) return "#F5A623";
  return "#E53935";
}

function ConfidencePill({ confidence }: { confidence: number }) {
  const color = getConfidenceColor(confidence);
  const pct = Math.round(confidence * 100);
  return (
    <View style={[styles.confidencePill, { backgroundColor: color + "18", borderColor: color + "33" }]}>
      <View style={[styles.confidenceDot, { backgroundColor: color }]} />
      <Text style={[styles.confidenceText, { color }]}>{pct}%</Text>
    </View>
  );
}

function ScanRow({
  scan,
  onDelete,
}: {
  scan: {
    id: string;
    commonName: string;
    scientificName: string;
    family: string;
    confidence: number;
    scannedAt: string;
    aliases: string[];
    wateringIntervalDays: number;
    toxicityToHumans: string;
  };
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const toxicColor =
    scan.toxicityToHumans?.toLowerCase().includes("non-toxic")
      ? "#1F8A4C"
      : scan.toxicityToHumans?.toLowerCase().includes("toxic")
      ? "#E53935"
      : "#F5A623";

  return (
    <Animated.View entering={FadeIn.duration(250)} layout={Layout.springify()} style={styles.scanRow}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpanded((v) => !v)}
        style={styles.scanRowMain}
      >
        <View style={styles.scanIconWrap}>
          <LinearGradient
            colors={["#28A858", "#1F8A4C"]}
            style={styles.scanIcon}
          >
            <Ionicons name="leaf" size={20} color="#fff" />
          </LinearGradient>
        </View>

        <View style={styles.scanInfo}>
          <Text style={styles.scanName} numberOfLines={1}>{scan.commonName}</Text>
          <Text style={styles.scanScientific} numberOfLines={1}>{scan.scientificName}</Text>
          <View style={styles.scanMeta}>
            <ConfidencePill confidence={scan.confidence} />
            <Text style={styles.scanTime}>{formatTime(scan.scannedAt)}</Text>
          </View>
        </View>

        <View style={styles.scanRight}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                "Delete Scan",
                `Remove ${scan.commonName} from history?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => onDelete(scan.id),
                  },
                ]
              );
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color="#C4D9CE" />
          </TouchableOpacity>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#C4D9CE"
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.expandedContent}>
          <View style={styles.expandDivider} />
          <View style={styles.expandGrid}>
            <View style={styles.expandCell}>
              <Text style={styles.expandLabel}>Family</Text>
              <Text style={styles.expandValue}>{scan.family}</Text>
            </View>
            <View style={styles.expandCell}>
              <Text style={styles.expandLabel}>Watering</Text>
              <Text style={styles.expandValue}>Every {scan.wateringIntervalDays}d</Text>
            </View>
            <View style={styles.expandCell}>
              <Text style={styles.expandLabel}>Toxicity</Text>
              <Text style={[styles.expandValue, { color: toxicColor }]}>
                {scan.toxicityToHumans?.replace("Non-toxic to humans", "Safe") ?? "Unknown"}
              </Text>
            </View>
            <View style={styles.expandCell}>
              <Text style={styles.expandLabel}>Scanned</Text>
              <Text style={styles.expandValue}>{formatDateShort(scan.scannedAt)}</Text>
            </View>
          </View>
          {scan.aliases?.length > 0 && (
            <Text style={styles.expandAliases} numberOfLines={2}>
              Also: {scan.aliases.slice(0, 3).join(", ")}
            </Text>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: scans = [], isLoading, error, refetch } = useListScans({ limit: "50" });
  const deleteMutation = useDeleteScan();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  async function handleDelete(id: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
    } catch {
      Alert.alert("Error", "Could not delete scan. Please try again.");
    }
  }

  // Group scans by relative date label
  const grouped: Record<string, typeof scans> = {};
  for (const scan of scans) {
    const label = formatRelativeDate(scan.scannedAt);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(scan);
  }
  const ORDER = ["Today", "Yesterday", "This Week", "Earlier this Month", "Older"];
  const sections = ORDER.filter((k) => grouped[k]).map((k) => ({
    title: k,
    data: grouped[k],
    key: k,
  }));

  const totalScans = scans.length;
  const todayCount = grouped["Today"]?.length ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Scan History</Text>
          <Text style={styles.headerSub}>{totalScans} identification{totalScans !== 1 ? "s" : ""}</Text>
        </View>
        {todayCount > 0 && (
          <View style={styles.todayBadge}>
            <Ionicons name="today-outline" size={13} color="#1F8A4C" />
            <Text style={styles.todayBadgeText}>{todayCount} today</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1F8A4C" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <View style={styles.errorIcon}>
            <Ionicons name="cloud-offline-outline" size={36} color="#C4D9CE" />
          </View>
          <Text style={styles.errorTitle}>Couldn't load history</Text>
          <Text style={styles.errorSub}>Make sure the API server is running</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : scans.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={40} color="#C4D9CE" />
          </View>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptySub}>Identify your first plant to see it here</Text>
          <TouchableOpacity
            style={styles.scanNowBtn}
            onPress={() => router.push("/(tabs)/" as any)}
          >
            <Ionicons name="camera" size={16} color="#fff" />
            <Text style={styles.scanNowText}>Scan a Plant</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ScanRow scan={item as any} onDelete={handleDelete} />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1F8A4C"
              colors={["#1F8A4C"]}
            />
          }
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
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
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B8C7A", marginTop: 2 },
  todayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E8F5EE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  todayBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1F8A4C" },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#1a2e1a", textTransform: "uppercase", letterSpacing: 0.8 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "#E8EEE9" },
  sectionCount: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#6B8C7A",
    backgroundColor: "#F0F4F1",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scanRow: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  scanRowMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  scanIconWrap: {},
  scanIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  scanInfo: { flex: 1, gap: 3 },
  scanName: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1a2e1a" },
  scanScientific: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B8C7A", fontStyle: "italic" },
  scanMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  confidencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  confidenceDot: { width: 6, height: 6, borderRadius: 3 },
  confidenceText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  scanTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#A0B4A8" },
  scanRight: { alignItems: "center", gap: 10 },
  deleteBtn: { padding: 4 },
  expandedContent: { paddingHorizontal: 14, paddingBottom: 14 },
  expandDivider: { height: 1, backgroundColor: "#F0F4F1", marginBottom: 12 },
  expandGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  expandCell: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: "#FAFAF8",
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  expandLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#A0B4A8", textTransform: "uppercase", letterSpacing: 0.5 },
  expandValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1a2e1a" },
  expandAliases: { marginTop: 8, fontSize: 12, fontFamily: "Inter_400Regular", color: "#A0B4A8", fontStyle: "italic" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 10 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6B8C7A", marginTop: 8 },
  errorIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#F0F4F1",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  errorTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#1a2e1a" },
  errorSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B8C7A", textAlign: "center" },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: "#1F8A4C", borderRadius: 12,
  },
  retryText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: "#F0F4F1",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#1a2e1a" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6B8C7A", textAlign: "center" },
  scanNowBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1F8A4C",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  scanNowText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
