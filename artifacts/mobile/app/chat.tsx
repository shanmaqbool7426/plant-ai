import { router } from "expo-router";
import React, { useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useSendChatMessage } from "@workspace/api-client-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hello! I'm your LeafLens plant expert. Ask me anything about plant care, identification, diseases, or gardening tips.",
};

const QUICK_QUESTIONS = [
  "Why are my leaves turning yellow?",
  "How often should I water a cactus?",
  "What plants are safe for cats?",
  "How do I repot a houseplant?",
];

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="leaf" size={14} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{message.content}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const chatMutation = useSendChatMessage();
  const isLoading = chatMutation.isPending;

  async function sendMessage(text?: string) {
    const content = (text ?? inputText).trim();
    if (!content) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputText("");

    try {
      const history = updated
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await chatMutation.mutateAsync({ messages: history });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: e?.message?.includes("ANTHROPIC_API_KEY")
          ? "The AI is not configured yet. Please add your Anthropic API key."
          : "Sorry, I couldn't process that. Please try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top || (Platform.OS === "web" ? 67 : 0) }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a2e1a" />
        </TouchableOpacity>
        <View style={styles.topInfo}>
          <Text style={styles.topTitle}>Expert Chat</Text>
          <Text style={styles.topSubtitle}>Plant specialist • Always available</Text>
        </View>
        <View style={styles.onlineIndicator} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        inverted={false}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.typingIndicator}>
              <View style={styles.avatar}><Ionicons name="leaf" size={14} color="#fff" /></View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color="#6B8C7A" />
              </View>
            </View>
          ) : null
        }
      />

      {messages.length <= 1 && (
        <View style={styles.quickQuestions}>
          <Text style={styles.quickLabel}>Common questions</Text>
          <View style={styles.quickGrid}>
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity key={q} style={styles.quickChip} onPress={() => sendMessage(q)}>
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 || (Platform.OS === "web" ? 42 : 8) }]}>
        <TextInput
          style={styles.input}
          placeholder="Ask about plant care..."
          placeholderTextColor="#9BB5AA"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  topBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F0F4F1",
  },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0F4F1", alignItems: "center", justifyContent: "center" },
  topInfo: { flex: 1 },
  topTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#1a2e1a" },
  topSubtitle: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6B8C7A" },
  onlineIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1F8A4C" },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12, gap: 8 },
  bubbleRowUser: { flexDirection: "row-reverse" },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#1F8A4C", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  bubble: { maxWidth: "78%", borderRadius: 16, padding: 12 },
  bubbleAssistant: { backgroundColor: "#fff", borderBottomLeftRadius: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  bubbleUser: { backgroundColor: "#1F8A4C", borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#1a2e1a", lineHeight: 21 },
  bubbleTextUser: { color: "#fff" },
  typingIndicator: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
  typingBubble: { backgroundColor: "#fff", borderRadius: 16, borderBottomLeftRadius: 4, padding: 14 },
  quickQuestions: { paddingHorizontal: 16, paddingBottom: 8 },
  quickLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#9BB5AA", marginBottom: 8 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickChip: {
    backgroundColor: "#E8F5EE", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: "#C4D9CE",
  },
  quickChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#1F8A4C" },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F0F4F1",
  },
  input: {
    flex: 1, backgroundColor: "#F0F4F1", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, fontFamily: "Inter_400Regular", color: "#1a2e1a",
    maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#1F8A4C",
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#C4D9CE" },
});
