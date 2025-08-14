import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const ADMIN_EMAIL = "nacho.vent@gmail.com" as const;

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
  } catch (e: any) {
    return { ok: false as const, error: e?.message || "invalid_token" };
  }
}

export async function GET(req: NextRequest) {
  const gate = await verifyAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  try {
    const list = await adminAuth().listUsers(1000);
    const users = list.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      premium: Boolean((u.customClaims as any)?.premium),
    }));
    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "list_failed" },
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
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "update_failed" },
      { status: 500 }
    );
  }
}
