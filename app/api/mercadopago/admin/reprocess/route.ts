import { NextRequest, NextResponse } from "next/server";
import { ADMIN_EMAIL } from "@/lib/constants";
import { unwrapError } from "@/lib/errors";
import {
  normalizeMercadoPagoResourceType,
  processMercadoPagoResource,
} from "@/app/api/mercadopago/admin/_processing";

export const runtime = "nodejs";

async function verifyAdmin(req: NextRequest) {
  try {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return { ok: false as const, error: "missing_auth", status: 401 };
    }

    const token = authHeader.split(" ")[1];
    const { adminAuth } = await import("@/lib/firebase-admin");
    const decoded = await adminAuth().verifyIdToken(token);
    if ((decoded.email || "").toLowerCase() !== ADMIN_EMAIL) {
      return { ok: false as const, error: "forbidden", status: 403 };
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "invalid_token", status: 401 };
  }
}

export async function POST(req: NextRequest) {
  const gate = await verifyAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      type?: string;
      id?: string | number;
    };
    const type = normalizeMercadoPagoResourceType(body.type || "");
    const id = body.id?.toString() || "";

    if (!type || !id) {
      return NextResponse.json(
        { error: "missing_type_or_id" },
        { status: 400 }
      );
    }

    const result = await processMercadoPagoResource(type, id);
    return NextResponse.json(
      {
        ...result.body,
        type,
        id,
      },
      { status: result.status || 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "reprocess_failed", message: unwrapError(err) },
      { status: 500 }
    );
  }
}
