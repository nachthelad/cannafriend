import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { deleteUserAccountAsAdmin } from "@/lib/admin/delete-user-account";
import { ADMIN_EMAIL } from "@/lib/constants";
import { unwrapError } from "@/lib/errors";
import type {
  AdminPlantPreview,
  AdminReminderPreview,
  AdminUserDetail,
} from "@/types/admin";

export const runtime = "nodejs";

const PREVIEW_LIMIT = 3;

type AuthUserSource = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  customClaims?: unknown;
  metadata?: { creationTime?: string };
};

type UserProfileSource = {
  timezone?: unknown;
  createdAt?: unknown;
  onboardingCompletedAt?: unknown;
};

type PlantSource = {
  id: string;
  name?: unknown;
  status?: unknown;
  plantingDate?: unknown;
  createdAt?: unknown;
};

type ReminderSource = {
  id: string;
  label?: unknown;
  plantName?: unknown;
  timeOfDay?: unknown;
  daysOfWeek?: unknown;
  isActive?: unknown;
  updatedAt?: unknown;
  createdAt?: unknown;
};

async function verifyAdmin(req: NextRequest) {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { ok: false as const, error: "missing_auth" };
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    if ((decoded.email || "").toLowerCase() !== ADMIN_EMAIL) {
      return { ok: false as const, error: "forbidden" };
    }

    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: unwrapError(err, "invalid_token") };
  }
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (value && typeof value === "object") {
    if ("toMillis" in value && typeof value.toMillis === "function") {
      const millis = value.toMillis();
      if (typeof millis === "number" && Number.isFinite(millis)) {
        return millis;
      }
    }

    if ("toDate" in value && typeof value.toDate === "function") {
      const date = value.toDate();
      if (date instanceof Date) {
        return date.getTime();
      }
    }
  }

  return undefined;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asDateString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  const millis = asNumber(value);
  if (typeof millis === "number") {
    return new Date(millis).toISOString();
  }

  return null;
}

function getPremiumState(user: AuthUserSource): boolean {
  const claims = (user.customClaims as Record<string, unknown> | undefined) || {};
  const boolPremium = Boolean(claims.premium);
  const until = typeof claims.premium_until === "number" ? claims.premium_until : 0;
  return Boolean(boolPremium || until > Date.now());
}

function sortByNewest<T>(items: T[], getDate: (item: T) => unknown): T[] {
  return [...items].sort((left, right) => {
    const leftTime = asNumber(getDate(left)) ?? 0;
    const rightTime = asNumber(getDate(right)) ?? 0;
    return rightTime - leftTime;
  });
}

function toPlantPreview(plant: PlantSource): AdminPlantPreview {
  return {
    id: plant.id,
    name: asString(plant.name) ?? "Sin nombre",
    status: asString(plant.status),
    plantingDate: asString(plant.plantingDate),
    createdAt: asDateString(plant.createdAt),
  };
}

function toReminderPreview(reminder: ReminderSource): AdminReminderPreview {
  return {
    id: reminder.id,
    label: asString(reminder.label) ?? "Sin etiqueta",
    plantName: asString(reminder.plantName),
    timeOfDay: asString(reminder.timeOfDay),
    daysOfWeek: Array.isArray(reminder.daysOfWeek)
      ? reminder.daysOfWeek.filter((day): day is number => typeof day === "number")
      : [],
    isActive: Boolean(reminder.isActive),
    updatedAt: asDateString(reminder.updatedAt),
    createdAt: asDateString(reminder.createdAt),
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  const gate = await verifyAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  const { uid } = await context.params;
  if (!uid) {
    return NextResponse.json({ error: "missing_uid" }, { status: 400 });
  }

  try {
    let authUser: AuthUserSource;

    try {
      authUser = (await adminAuth().getUser(uid)) as AuthUserSource;
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: unknown }).code || "")
          : "";
      if (code === "auth/user-not-found") {
        return NextResponse.json({ error: "user_not_found" }, { status: 404 });
      }
      throw err;
    }

    const userRef = adminDb().collection("users").doc(uid);
    const [
      userSnap,
      plantsSnap,
      remindersSnap,
      sessionsSnap,
      stashSnap,
      aiChatsSnap,
    ] = await Promise.all([
      userRef.get(),
      userRef.collection("plants").get(),
      userRef.collection("reminders").get(),
      userRef.collection("sessions").get(),
      userRef.collection("stash").get(),
      userRef.collection("aiChats").get(),
    ]);

    const profile = (userSnap.data() || {}) as UserProfileSource;
    const plants = plantsSnap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as PlantSource
    );
    const reminders = remindersSnap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as ReminderSource
    );

    const detail: AdminUserDetail = {
      uid: authUser.uid,
      email: authUser.email ?? null,
      displayName: authUser.displayName ?? null,
      premium: getPremiumState(authUser),
      createdAt:
        asNumber(authUser.metadata?.creationTime) ?? asNumber(profile.createdAt) ?? 0,
      timezone: asString(profile.timezone),
      onboardingCompletedAt: asDateString(profile.onboardingCompletedAt),
      plants: {
        total: plants.length,
        items: sortByNewest(plants, (plant) => plant.createdAt).slice(0, PREVIEW_LIMIT).map(toPlantPreview),
      },
      reminders: {
        total: reminders.length,
        items: sortByNewest(reminders, (reminder) => reminder.updatedAt ?? reminder.createdAt)
          .slice(0, PREVIEW_LIMIT)
          .map(toReminderPreview),
      },
      sessions: {
        total: sessionsSnap.size,
      },
      stash: {
        total: stashSnap.size,
      },
      aiChats: {
        total: aiChatsSnap.size,
      },
    };

    return NextResponse.json({ user: detail });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: unwrapError(err, "detail_failed") },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  const gate = await verifyAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  const { uid } = await context.params;
  if (!uid) {
    return NextResponse.json({ error: "missing_uid" }, { status: 400 });
  }

  try {
    await deleteUserAccountAsAdmin(uid);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: unwrapError(err, "delete_failed") },
      { status: 500 }
    );
  }
}
