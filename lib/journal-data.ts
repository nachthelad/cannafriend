import { plantsCol, logsCol } from "@/lib/paths";
import { normalizePlant } from "@/lib/plant-utils";
import { db } from "@/lib/firebase";
import {
  collectionGroup,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { JournalData, LogEntry, Plant } from "@/types";

export async function fetchJournalData(
  userId: string,
  pageSize = 50
): Promise<JournalData> {
  // Fetch plants first so we can attach plant names to logs
  const plantsQueryRef = query(plantsCol(userId));
  const plantsSnap = await getDocs(plantsQueryRef);
  const plants: Plant[] = [];
  plantsSnap.forEach((docSnap) => {
    plants.push(normalizePlant(docSnap.data(), docSnap.id));
  });

  // Try collectionGroup for logs to avoid per-plant queries
  const logs: LogEntry[] = [];

  try {
    const logsGroup = collectionGroup(db, "logs");
    const cgQuery = query(
      logsGroup,
      where("userId", "==", userId),
      orderBy("date", "desc"),
      limit(pageSize)
    );
    const cgSnap = await getDocs(cgQuery);

    cgSnap.forEach((docSnap) => {
      const logData = docSnap.data();
      const plant = plants.find((p) => p.id === logData.plantId);
      logs.push({
        id: docSnap.id,
        ...logData,
        plantName: plant?.name || "Unknown Plant",
      } as LogEntry);
    });
  } catch (error) {
    // Fallback: fetch per-plant when collectionGroup is unavailable
    for (const plant of plants) {
      const plantLogsQuery = query(
        logsCol(userId, plant.id),
        orderBy("date", "desc"),
        limit(pageSize)
      );
      const plantLogsSnap = await getDocs(plantLogsQuery);
      plantLogsSnap.forEach((docSnap) => {
        logs.push({
          id: docSnap.id,
          ...(docSnap.data() as any),
          plantId: plant.id,
          plantName: plant.name,
        } as LogEntry);
      });
    }

    logs.sort(
      (a, b) =>
        new Date(b.date as string).getTime() -
        new Date(a.date as string).getTime()
    );
  }

  return { logs, plants };
}
