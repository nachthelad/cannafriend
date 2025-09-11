import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { ADMIN_EMAIL } from "@/lib/constants";
import { unwrapError } from "@/lib/errors";

export const runtime = "nodejs";

async function verifyAdmin(req: NextRequest) {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { ok: false as const, error: "Missing Authorization header" };
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

type AdminUserSource = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  customClaims?: unknown;
  metadata?: { creationTime?: string };
};

export async function GET(req: NextRequest) {
  const gate = await verifyAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const list = await adminAuth().listUsers(1000);
    const users = list.users.map((u: AdminUserSource) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      premium: Boolean((u.customClaims as any)?.premium),
      createdAt: u.metadata?.creationTime
        ? new Date(u.metadata.creationTime).getTime()
        : 0,
    }));
    return NextResponse.json({ users });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: unwrapError(err, "list_failed") },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const gate = await verifyAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { uid?: string; premium?: boolean };
    if (!body?.uid || typeof body.premium !== "boolean") {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const user = await adminAuth().getUser(body.uid);
    const claims = { ...(user.customClaims || {}) } as Record<string, unknown>;
    claims.premium = body.premium;
    await adminAuth().setCustomUserClaims(body.uid, claims);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: unwrapError(err, "update_failed") },
      { status: 500 }
    );
  }
}
