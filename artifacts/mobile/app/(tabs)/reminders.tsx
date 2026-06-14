import React, { useState } from "react";
import {
  Image,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { useReminders, Reminder } from "@/context/RemindersContext";

function ReminderRow({ reminder, onComplete, onSnooze }: { reminder: Reminder; onComplete: () => void; onSnooze: () => void }) {
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.reminderRow}>
      {reminder.plantImageUri ? (
        <Image source={{ uri: reminder.plantImageUri }} style={styles.plantThumb} />
      ) : (
        <View style={[styles.plantThumb, styles.plantThumbPlaceholder]}>
          <Ionicons name="leaf" size={20} color="#C4D9CE" />
        </View>
      )}
      <View style={styles.reminderInfo}>
        <Text style={styles.reminderPlantName}>{reminder.plantName}</Text>
        <Text style={styles.reminderScientific}>{reminder.scientificName}</Text>
        <View style={styles.reminderTypePill}>
          <Ionicons
            name={reminder.type === "water" ? "water" : "nutrition"}
            size={12}
            color={reminder.type === "water" ? "#2196F3" : "#F5A623"}
          />
          <Text style={[styles.reminderTypeText, { color: reminder.type === "water" ? "#2196F3" : "#F5A623" }]}>
            {reminder.type === "water" ? "Watering" : "Fertilizing"}
          </Text>
        </View>
      </View>
      <View style={styles.reminderActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnGreen]} onPress={onComplete}>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOrange]} onPress={onSnooze}>
          <Ionicons name="alarm-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const { reminders, completeReminder, snoozeReminder, getTodayReminders, getUpcomingReminders, getFurtherReminders } = useReminders();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const todayItems = getTodayReminders();
  const upcomingItems = getUpcomingReminders();
  const furtherItems = getFurtherReminders();

  function toggleSection(title: string) {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  const sections = [
    { title: `Today (${todayItems.length})`, data: todayItems, key: "today" },
    { title: `In 2 days (${upcomingItems.length})`, data: upcomingItems, key: "upcoming" },
    { title: `Further (${furtherItems.length})`, data: furtherItems, key: "further" },
  ].filter((s) => s.data.length > 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reminders</Text>
        <View style={styles.headerBadge}>
          <Ionicons name="bell" size={14} color="#1F8A4C" />
          <Text style={styles.headerBadgeText}>{reminders.filter((r) => !r.completed).length}</Text>
        </View>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bell" size={40} color="#C4D9CE" />
          </View>
          <Text style={styles.emptyTitle}>No reminders</Text>
          <Text style={styles.emptySubtitle}>Add plants to your garden to get care reminders</Text>
        </View>
      ) : (
        <SectionList
          sections={sections.map((s) => ({
            ...s,
            data: collapsedSections[s.key] ? [] : s.data,
          }))}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReminderRow
              reminder={item}
              onComplete={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                completeReminder(item.id);
              }}
              onSnooze={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                snoozeReminder(item.id, 2);
              }}
            />
          )}
          renderSectionHeader={({ section }) => {
            const isCollapsed = collapsedSections[section.key];
            const isToday = section.key === "today";
            return (
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.key)}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionHeaderRight}>
                  {isToday && (
                    <TouchableOpacity style={styles.completeAllBtn}>
                      <Text style={styles.completeAllText}>Complete All</Text>
                    </TouchableOpacity>
                  )}
                  <Ionicons
                    name={isCollapsed ? "chevron-down" : "chevron-up"}
                    size={18}
                    color="#6B8C7A"
                  />
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#1a2e1a", flex: 1 },
  headerBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#E8F5EE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  headerBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#1F8A4C" },
  list: { paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 4,
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#1a2e1a" },
  sectionHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  completeAllBtn: {},
  completeAllText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#1F8A4C" },
  reminderRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14, padding: 12, marginBottom: 8, gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  plantThumb: { width: 52, height: 52, borderRadius: 12 },
  plantThumbPlaceholder: { backgroundColor: "#F0F4F1", alignItems: "center", justifyContent: "center" },
  reminderInfo: { flex: 1 },
  reminderPlantName: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#1a2e1a", marginBottom: 2 },
  reminderScientific: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6B8C7A", fontStyle: "italic", marginBottom: 6 },
  reminderTypePill: { flexDirection: "row", alignItems: "center", gap: 4 },
  reminderTypeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  reminderActions: { flexDirection: "row", gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  actionBtnGreen: { backgroundColor: "#1F8A4C" },
  actionBtnOrange: { backgroundColor: "#F5A623" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: "#F0F4F1",
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#1a2e1a", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#6B8C7A", textAlign: "center" },
});
