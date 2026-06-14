import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useSubscription } from "@/lib/revenuecat";

const FEATURES = [
  { icon: "camera", label: "Unlimited plant identifications" },
  { icon: "medkit", label: "Disease diagnosis & treatment" },
  { icon: "leaf", label: "Full care guides & schedules" },
  { icon: "chatbubble", label: "Expert chat, unlimited messages" },
  { icon: "notifications", label: "Smart care reminders" },
  { icon: "git-compare", label: "Before/After plant comparison" },
];

export default function Paywall() {
  const insets = useSafeAreaInsets();
  const { offerings, purchase, restore, isPurchasing, isRestoring, isSubscribed } = useSubscription();

  const currentOffering = offerings?.current;
  const packageToPurchase = currentOffering?.availablePackages?.[0];
  const price = packageToPurchase?.product.priceString ?? "$9.99";

  async function handlePurchase() {
    if (!packageToPurchase) {
      Alert.alert("Not Available", "Subscription packages are not available right now. Please try again later.");
      return;
    }
    try {
      await purchase(packageToPurchase);
      router.back();
    } catch (e: any) {
      if (!e?.message?.includes("cancelled")) {
        Alert.alert("Purchase Failed", e?.message ?? "Something went wrong.");
      }
    }
  }

  async function handleRestore() {
    try {
      await restore();
      Alert.alert("Restored", "Your purchases have been restored.");
    } catch {
      Alert.alert("Error", "Could not restore purchases.");
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#1a2e1a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient colors={["#155E35", "#1F8A4C"]} style={styles.heroGradient}>
          <Ionicons name="leaf" size={52} color="#fff" />
          <Text style={styles.heroTitle}>LeafLens Pro</Text>
          <Text style={styles.heroSubtitle}>Unlock the full power of your plant companion</Text>
        </LinearGradient>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Everything included</Text>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={18} color="#1F8A4C" />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#1F8A4C" />
            </View>
          ))}
        </View>

        <View style={styles.pricingSection}>
          <View style={styles.pricingCard}>
            <View style={styles.trialBadge}>
              <Text style={styles.trialText}>7-day free trial</Text>
            </View>
            <Text style={styles.pricingAmount}>{price}</Text>
            <Text style={styles.pricingPeriod}>per month after trial</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={handlePurchase}
          disabled={isPurchasing}
          activeOpacity={0.85}
        >
          <LinearGradient colors={["#28A858", "#1F8A4C"]} style={styles.purchaseGradient}>
            {isPurchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.purchaseText}>Start Free Trial</Text>
                <Text style={styles.purchaseSubtext}>Cancel anytime</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={isRestoring}>
          {isRestoring ? (
            <ActivityIndicator size="small" color="#6B8C7A" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Subscription automatically renews at {price}/month unless cancelled at least 24 hours before the end of the free trial period.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  topBar: { paddingHorizontal: 16, paddingVertical: 8 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0F4F1",
    alignItems: "center", justifyContent: "center",
  },
  content: { paddingBottom: 40 },
  heroGradient: {
    marginHorizontal: 16, borderRadius: 20, padding: 36,
    alignItems: "center", gap: 12, marginBottom: 16,
  },
  heroTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  heroSubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", textAlign: "center" },
  featuresCard: {
    marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
  },
  featuresTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#1a2e1a", marginBottom: 16 },
  featureRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: "#F0F4F1",
  },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#E8F5EE",
    alignItems: "center", justifyContent: "center",
  },
  featureLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: "#1a2e1a" },
  pricingSection: { marginHorizontal: 16, marginBottom: 16 },
  pricingCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center",
    borderWidth: 2, borderColor: "#1F8A4C",
    shadowColor: "#1F8A4C", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 3,
  },
  trialBadge: {
    backgroundColor: "#1F8A4C", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, marginBottom: 12,
  },
  trialText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  pricingAmount: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#1a2e1a" },
  pricingPeriod: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#6B8C7A", marginTop: 4 },
  purchaseButton: { marginHorizontal: 16, borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  purchaseGradient: { paddingVertical: 18, alignItems: "center" },
  purchaseText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  purchaseSubtext: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },
  restoreBtn: { alignItems: "center", paddingVertical: 12, marginBottom: 8 },
  restoreText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#6B8C7A" },
  legalText: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: "#9BB5AA",
    textAlign: "center", paddingHorizontal: 24, lineHeight: 16,
  },
});
