import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";
import { useGarden } from "@/context/GardenContext";
import { useSubscription } from "@/lib/revenuecat";

function SettingRow({ icon, label, onPress, value, danger }: { icon: string; label: string; onPress?: () => void; value?: string; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, danger && { backgroundColor: "#FDE8E8" }]}>
        <Ionicons name={icon as any} size={18} color={danger ? "#E53935" : "#1F8A4C"} />
      </View>
      <Text style={[styles.settingLabel, danger && { color: "#E53935" }]}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color="#C4D9CE" />
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, identificationCount } = useAuth();
  const { plants } = useGarden();
  const { isSubscribed } = useSubscription();

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth" as any);
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <Text style={styles.headerTitle}>Profile</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color="#fff" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{user?.displayName ?? "User"}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {isSubscribed ? (
              <View style={styles.proBadge}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.proText}>Pro Member</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.upgradeBadge} onPress={() => router.push("/paywall" as any)}>
                <Text style={styles.upgradeText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{plants.length}</Text>
            <Text style={styles.statLabel}>Plants Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{identificationCount}</Text>
            <Text style={styles.statLabel}>Today's IDs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{isSubscribed ? "Pro" : "Free"}</Text>
            <Text style={styles.statLabel}>Plan</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.settingsCard}>
            <SettingRow icon="camera-outline" label="Identify Plants" onPress={() => router.push("/(tabs)/" as any)} />
            <SettingRow icon="medkit-outline" label="Diagnose Disease" onPress={() => router.push("/diagnosis" as any)} />
            <SettingRow icon="chatbubble-outline" label="Expert Chat" onPress={() => router.push("/chat" as any)} />
            <SettingRow icon="git-compare-outline" label="Before/After Comparison" onPress={() => router.push("/comparison" as any)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.settingsCard}>
            {!isSubscribed && (
              <SettingRow
                icon="star-outline"
                label="Upgrade to Pro"
                value="7-day free trial"
                onPress={() => router.push("/paywall" as any)}
              />
            )}
            <SettingRow icon="refresh-outline" label="Restore Purchases" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            <SettingRow icon="notifications-outline" label="Notifications" />
            <SettingRow icon="shield-outline" label="Privacy Policy" />
            <SettingRow icon="help-circle-outline" label="Help & Support" />
            <SettingRow icon="log-out-outline" label="Sign Out" onPress={handleSignOut} danger />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#1a2e1a", paddingHorizontal: 20, paddingVertical: 16 },
  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  avatar: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: "#1F8A4C",
    alignItems: "center", justifyContent: "center",
  },
  profileInfo: { flex: 1, gap: 4 },
  displayName: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#1a2e1a" },
  email: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B8C7A" },
  proBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    backgroundColor: "#1F8A4C", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  proText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  upgradeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5EE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  upgradeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#1F8A4C" },
  statsRow: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#1F8A4C", marginBottom: 2 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6B8C7A" },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#9BB5AA", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  settingsCard: {
    backgroundColor: "#fff", borderRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  settingRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F0F4F1",
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#E8F5EE",
    alignItems: "center", justifyContent: "center",
  },
  settingLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: "#1a2e1a" },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  settingValue: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9BB5AA" },
});
