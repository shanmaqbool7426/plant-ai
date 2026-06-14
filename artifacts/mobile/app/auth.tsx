import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

export default function Auth() {
  const insets = useSafeAreaInsets();
  const { signIn, signInAsGuest } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message ?? "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setLoading(true);
    try {
      await signInAsGuest();
      router.replace("/(tabs)");
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FAFAF8" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24 || (Platform.OS === "web" ? 91 : 24), paddingBottom: insets.bottom + 32 || (Platform.OS === "web" ? 66 : 32) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>LeafLens</Text>
          <Text style={styles.tagline}>Your Ultimate Plant Identifier</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && styles.tabActive]}
              onPress={() => setMode("login")}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.tabActive]}
              onPress={() => setMode("register")}
            >
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={18} color="#6B8C7A" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#9BB5AA"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={18} color="#6B8C7A" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9BB5AA"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={["#28A858", "#1F8A4C"]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>{mode === "login" ? "Sign In" : "Create Account"}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.guestButton} onPress={handleGuest} disabled={loading} activeOpacity={0.8}>
            <Ionicons name="person-outline" size={18} color="#1F8A4C" />
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.badge}>100 Million Downloads — Trusted by Plant Lovers Worldwide</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#1F8A4C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#1F8A4C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#1a2e1a",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#6B8C7A",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
    marginBottom: 24,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#F0F4F1",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#6B8C7A",
  },
  tabTextActive: {
    color: "#1a2e1a",
    fontFamily: "Inter_600SemiBold",
  },
  form: {
    gap: 12,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4F1",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#1a2e1a",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#E53935",
    textAlign: "center",
  },
  submitButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0EBE5",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#9BB5AA",
    fontFamily: "Inter_400Regular",
  },
  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#1F8A4C",
    gap: 8,
  },
  guestText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1F8A4C",
  },
  badge: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#9BB5AA",
    textAlign: "center",
    lineHeight: 18,
  },
});
