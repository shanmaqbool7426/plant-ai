import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
}

interface RemindersContextValue {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, "id">) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
  snoozeReminder: (id: string, days?: number) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  getTodayReminders: () => Reminder[];
  getUpcomingReminders: (days?: number) => Reminder[];
  getFurtherReminders: (days?: number) => Reminder[];
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

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    loadReminders();
  }, []);

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
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
    };
    const updated = [newReminder, ...reminders];
    await saveReminders(updated);
  }

  async function completeReminder(id: string) {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, completed: true } : r
    );
    await saveReminders(updated);
  }

  async function snoozeReminder(id: string, days = 2) {
    const newDueDate = addDays(new Date(), days).toISOString();
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, dueDate: newDueDate, snoozedUntil: newDueDate } : r
    );
    await saveReminders(updated);
  }

  async function deleteReminder(id: string) {
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
        addReminder,
        completeReminder,
        snoozeReminder,
        deleteReminder,
        getTodayReminders,
        getUpcomingReminders,
        getFurtherReminders,
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
