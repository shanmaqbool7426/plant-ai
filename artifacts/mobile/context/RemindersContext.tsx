import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface Reminder {
  id: string;
  plantId: string;
  plantName: string;
  scientificName: string;
  plantImageUri: string;
  type: "water" | "fertilize";
  dueDate: string;
  completed: boolean;
  snoozedUntil?: string;
  notificationId?: string;
}

interface RemindersContextValue {
  reminders: Reminder[];
  notificationsEnabled: boolean;
  addReminder: (reminder: Omit<Reminder, "id">) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
  snoozeReminder: (id: string, days?: number) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  getTodayReminders: () => Reminder[];
  getUpcomingReminders: (days?: number) => Reminder[];
  getFurtherReminders: (days?: number) => Reminder[];
  requestNotificationPermission: () => Promise<boolean>;
}

const RemindersContext = createContext<RemindersContextValue | null>(null);

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const date = new Date(dateStr);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isWithinDays(dateStr: string, days: number): boolean {
  const today = new Date();
  const date = new Date(dateStr);
  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= days;
}

function isBeyondDays(dateStr: string, days: number): boolean {
  const today = new Date();
  const date = new Date(dateStr);
  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > days;
}

async function scheduleReminderNotification(reminder: Omit<Reminder, "id">): Promise<string | undefined> {
  if (Platform.OS === "web") return undefined;
  try {
    const trigger = new Date(reminder.dueDate);
    trigger.setHours(9, 0, 0, 0);
    if (trigger <= new Date()) return undefined;

    const isWater = reminder.type === "water";
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: isWater ? "💧 Time to water!" : "🌱 Time to fertilize!",
        body: `${reminder.plantName} needs ${isWater ? "watering" : "fertilizing"} today.`,
        sound: true,
        data: { type: reminder.type, plantId: reminder.plantId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
    });
    return notifId;
  } catch {
    return undefined;
  }
}

async function cancelNotification(notificationId?: string) {
  if (!notificationId || Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {}
}

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadReminders();
    checkNotificationPermission();
  }, []);

  async function checkNotificationPermission() {
    if (Platform.OS === "web") return;
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === "granted");
  }

  async function requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS === "web") return false;
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === "granted";
    setNotificationsEnabled(granted);
    return granted;
  }

  async function loadReminders() {
    try {
      const stored = await AsyncStorage.getItem("leaflens_reminders");
      if (stored) setReminders(JSON.parse(stored));
    } catch {}
  }

  async function saveReminders(updated: Reminder[]) {
    setReminders(updated);
    await AsyncStorage.setItem("leaflens_reminders", JSON.stringify(updated));
  }

  async function addReminder(reminder: Omit<Reminder, "id">) {
    let notifEnabled = notificationsEnabled;
    if (!notifEnabled && Platform.OS !== "web") {
      notifEnabled = await requestNotificationPermission();
    }

    const notificationId = notifEnabled
      ? await scheduleReminderNotification(reminder)
      : undefined;

    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      notificationId,
    };
    const updated = [newReminder, ...reminders];
    await saveReminders(updated);
  }

  async function completeReminder(id: string) {
    const reminder = reminders.find((r) => r.id === id);
    if (reminder?.notificationId) {
      await cancelNotification(reminder.notificationId);
    }
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, completed: true, notificationId: undefined } : r
    );
    await saveReminders(updated);
  }

  async function snoozeReminder(id: string, days = 2) {
    const reminder = reminders.find((r) => r.id === id);
    if (reminder?.notificationId) {
      await cancelNotification(reminder.notificationId);
    }

    const newDueDate = addDays(new Date(), days).toISOString();
    const updated = reminders.map((r) => (r.id === id ? { ...r, dueDate: newDueDate, snoozedUntil: newDueDate, notificationId: undefined } : r));
    await saveReminders(updated);

    if (reminder && notificationsEnabled) {
      const snoozeNotifId = await scheduleReminderNotification({ ...reminder, dueDate: newDueDate });
      const withNotif = updated.map((r) => (r.id === id ? { ...r, notificationId: snoozeNotifId } : r));
      await saveReminders(withNotif);
    }
  }

  async function deleteReminder(id: string) {
    const reminder = reminders.find((r) => r.id === id);
    if (reminder?.notificationId) {
      await cancelNotification(reminder.notificationId);
    }
    const updated = reminders.filter((r) => r.id !== id);
    await saveReminders(updated);
  }

  function getActiveReminders() {
    return reminders.filter((r) => !r.completed);
  }

  function getTodayReminders() {
    return getActiveReminders().filter((r) => isToday(r.dueDate));
  }

  function getUpcomingReminders(days = 7) {
    return getActiveReminders().filter((r) => isWithinDays(r.dueDate, days));
  }

  function getFurtherReminders(days = 7) {
    return getActiveReminders().filter((r) => isBeyondDays(r.dueDate, days));
  }

  return (
    <RemindersContext.Provider
      value={{
        reminders,
        notificationsEnabled,
        addReminder,
        completeReminder,
        snoozeReminder,
        deleteReminder,
        getTodayReminders,
        getUpcomingReminders,
        getFurtherReminders,
        requestNotificationPermission,
      }}
    >
      {children}
    </RemindersContext.Provider>
  );
}

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error("useReminders must be used within RemindersProvider");
  return ctx;
}
