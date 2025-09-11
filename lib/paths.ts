import { db } from "@/lib/firebase";
import { collection, doc, type DocumentData, type DocumentReference } from "firebase/firestore";

export const usersCol = () => collection(db, "users");
export const userDoc = <T = DocumentData>(uid: string): DocumentReference<T> =>
  doc(db, "users", uid) as DocumentReference<T>;

export const plantsCol = (uid: string) =>
  collection(db, "users", uid, "plants");
export const plantDoc = (uid: string, plantId: string) =>
  doc(db, "users", uid, "plants", plantId);

export const logsCol = (uid: string, plantId: string) =>
  collection(db, "users", uid, "plants", plantId, "logs");

export const sessionsCol = (uid: string) =>
  collection(db, "users", uid, "sessions");
export const remindersCol = (uid: string) =>
  collection(db, "users", uid, "reminders");

export const stashCol = (uid: string) => collection(db, "users", uid, "stash");

// AI Analyses
export const analysesCol = (uid: string) =>
  collection(db, "users", uid, "analyses");

export const analysisDoc = (uid: string, analysisId: string) =>
  doc(db, "users", uid, "analyses", analysisId);

// AI Consumer Chats
export const consumerChatsCol = (uid: string) =>
  collection(db, "users", uid, "consumerChats");

// Unified AI Chats
export const aiChatsCol = (uid: string) =>
  collection(db, "users", uid, "aiChats");

export const aiChatDoc = (uid: string, chatId: string) =>
  doc(db, "users", uid, "aiChats", chatId);
