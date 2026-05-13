import "server-only";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase-admin";

function parseStoragePathFromDownloadUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.includes("/o/")) return null;
    const afterO = parsed.pathname.split("/o/")[1] || "";
    const encodedPath = afterO.split("?")[0] || "";
    if (!encodedPath) return null;
    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
}

async function safeDeleteStorageObject(path: string): Promise<void> {
  try {
    await adminStorage().bucket().file(path).delete({ ignoreNotFound: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to delete storage object:", path, error);
  }
}

export async function deleteUserAccountAsAdmin(userId: string): Promise<void> {
  const db = adminDb();
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    const userData = userSnap.data() || {};
    const archivedAt = new Date().toISOString();

    await db.collection("archived_users").doc(userId).set({
      ...userData,
      archivedAt,
    });

    const plantsSnap = await userRef.collection("plants").get();
    for (const plantDoc of plantsSnap.docs) {
      const plantData = plantDoc.data() as {
        coverPhoto?: unknown;
        photos?: unknown;
      };

      await db
        .collection("archived_users")
        .doc(userId)
        .collection("plants")
        .doc(plantDoc.id)
        .set({
          ...plantData,
          archivedAt,
        });

      const logsSnap = await userRef
        .collection("plants")
        .doc(plantDoc.id)
        .collection("logs")
        .get();

      for (const logDoc of logsSnap.docs) {
        await db
          .collection("archived_users")
          .doc(userId)
          .collection("plants")
          .doc(plantDoc.id)
          .collection("logs")
          .doc(logDoc.id)
          .set({
            ...logDoc.data(),
            archivedAt,
          });
      }

      for (const logDoc of logsSnap.docs) {
        await userRef
          .collection("plants")
          .doc(plantDoc.id)
          .collection("logs")
          .doc(logDoc.id)
          .delete();
      }

      const photoUrls: string[] = [];
      if (typeof plantData.coverPhoto === "string") {
        photoUrls.push(plantData.coverPhoto);
      }
      if (Array.isArray(plantData.photos)) {
        photoUrls.push(
          ...plantData.photos.filter((value): value is string => typeof value === "string")
        );
      }

      for (const url of photoUrls) {
        const path = parseStoragePathFromDownloadUrl(url);
        if (path) {
          await safeDeleteStorageObject(path);
        }
      }

      await userRef.collection("plants").doc(plantDoc.id).delete();
    }

    const remindersSnap = await userRef.collection("reminders").get();
    for (const reminderDoc of remindersSnap.docs) {
      await db
        .collection("archived_users")
        .doc(userId)
        .collection("reminders")
        .doc(reminderDoc.id)
        .set({
          ...reminderDoc.data(),
          archivedAt,
        });
    }

    for (const reminderDoc of remindersSnap.docs) {
      await userRef.collection("reminders").doc(reminderDoc.id).delete();
    }

    await userRef.delete();
  }

  try {
    await adminAuth().deleteUser(userId);
  } catch (error: unknown) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code || "")
        : "";
    if (code !== "auth/user-not-found") {
      throw error;
    }
  }

  try {
    const [files] = await adminStorage().bucket().getFiles({
      prefix: `images/${userId}/`,
    });
    for (const file of files) {
      try {
        await file.delete({ ignoreNotFound: true });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to delete storage object (GC):", file.name, error);
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("GC storage listing failed", error);
  }
}
