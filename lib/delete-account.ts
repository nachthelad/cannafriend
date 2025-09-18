"use client";

import { deleteUser } from "firebase/auth";
import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { listAll, ref as storageRef, deleteObject } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import {
  logsCol,
  plantDoc as plantDocRef,
  plantsCol,
  remindersCol,
  userDoc,
} from "@/lib/paths";

/**
 * Complete account deletion with Firestore/Storage cleanup
 * Archives user data before deletion for compliance
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  if (!userId || !auth.currentUser) {
    throw new Error("No authenticated user found");
  }

  const parseStoragePathFromDownloadUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (!u.pathname.includes("/o/")) return null;
      const afterO = u.pathname.split("/o/")[1] || "";
      const encodedPath = afterO.split("?")[0] || "";
      if (!encodedPath) return null;
      return decodeURIComponent(encodedPath);
    } catch {
      return null;
    }
  };

  const userRef = userDoc(userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();

    // Archive user data before deletion
    await setDoc(doc(db, "archived_users", userId), {
      ...userData,
      archivedAt: new Date().toISOString(),
    });

    // Handle plants and their logs
    const plantsRef = plantsCol(userId);
    const plantsSnap = await getDocs(plantsRef);

    for (const plantDoc of plantsSnap.docs) {
      const plantData = plantDoc.data() as any;

      // Archive plant data
      await setDoc(
        doc(db, "archived_users", userId, "plants", plantDoc.id),
        {
          ...plantData,
          archivedAt: new Date().toISOString(),
        }
      );

      // Handle plant logs
      const logsRef = logsCol(userId, plantDoc.id);
      const logsSnap = await getDocs(logsRef);

      // Archive logs
      for (const logDoc of logsSnap.docs) {
        await setDoc(
          doc(
            db,
            "archived_users",
            userId,
            "plants",
            plantDoc.id,
            "logs",
            logDoc.id
          ),
          {
            ...logDoc.data(),
            archivedAt: new Date().toISOString(),
          }
        );
      }

      // Delete logs
      for (const logDoc of logsSnap.docs) {
        await deleteDoc(
          doc(db, "users", userId, "plants", plantDoc.id, "logs", logDoc.id)
        );
      }

      // Delete plant photos from storage
      try {
        const photoUrls: string[] = [];
        if (plantData.coverPhoto) photoUrls.push(plantData.coverPhoto);
        if (Array.isArray(plantData.photos))
          photoUrls.push(...plantData.photos);

        for (const url of photoUrls) {
          const path = parseStoragePathFromDownloadUrl(url);
          if (path) {
            try {
              await deleteObject(storageRef(storage, path));
            } catch (e) {
              console.warn("Failed to delete storage object:", path, e);
            }
          }
        }
      } catch (e) {
        console.warn("Error deleting plant photos from storage", e);
      }

      // Delete plant document
      await deleteDoc(plantDocRef(userId, plantDoc.id));
    }

    // Handle reminders
    try {
      const remindersRef = remindersCol(userId);
      const remindersSnap = await getDocs(remindersRef);

      // Archive reminders
      for (const r of remindersSnap.docs) {
        await setDoc(doc(db, "archived_users", userId, "reminders", r.id), {
          ...r.data(),
          archivedAt: new Date().toISOString(),
        });
      }

      // Delete reminders
      for (const r of remindersSnap.docs) {
        await deleteDoc(doc(db, "users", userId, "reminders", r.id));
      }
    } catch (e) {
      console.warn("Error archiving/deleting reminders", e);
    }

    // Delete user document
    await deleteDoc(userRef);
  }

  // Delete Firebase Auth user
  try {
    await deleteUser(auth.currentUser);
  } catch (e: any) {
    if (e?.code === "auth/requires-recent-login") {
      // Data deletion succeeded, but auth deletion requires re-login
      // This is expected behavior - just sign out the user
      console.log("Account data deleted successfully, signing out user due to auth requirements");
      throw new Error("DATA_DELETED_AUTH_FAILED");
    }
    throw e;
  }

  // Clean up remaining storage files
  try {
    const userFolderRef = storageRef(storage, `images/${userId}`);
    const all = await listAll(userFolderRef);
    for (const item of all.items) {
      try {
        await deleteObject(item);
      } catch (e) {
        console.warn(
          "Failed to delete storage object (GC):",
          item.fullPath,
          e
        );
      }
    }
  } catch (e) {
    console.warn("GC storage listing failed", e);
  }
}