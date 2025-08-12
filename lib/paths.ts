import { db } from "@/lib/firebase";
import { collection, doc } from "firebase/firestore";

export const usersCol = () => collection(db, "users");
export const userDoc = (uid: string) => doc(db, "users", uid);

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
