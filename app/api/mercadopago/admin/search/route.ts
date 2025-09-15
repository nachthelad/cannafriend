import { NextRequest, NextResponse } from "next/server";
import { ADMIN_EMAIL } from "@/lib/constants";

export const runtime = "nodejs";

async function verifyAdmin(req: NextRequest) {
  try {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return { ok: false as const, error: "missing_auth" };
    }
    const token = authHeader.split(" ")[1];
    // Import Firebase Admin lazily to avoid bundling in edge
    const { adminAuth } = await import("@/lib/firebase-admin");
    const decoded = await adminAuth().verifyIdToken(token);
    if ((decoded.email || "").toLowerCase() !== ADMIN_EMAIL) {
      return { ok: false as const, error: "forbidden" };
    }
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: "invalid_token" };
  }
}

export async function GET(req: NextRequest) {
  const gate = await verifyAdmin(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "mercadopago_not_configured" },
      { status: 500 }
    );
  }

  try {
    const search = req.nextUrl.searchParams;
    const params = new URLSearchParams();
    // Allow basic filters; pass-through others if present
    const allow = [
      "payer_email",
      "external_reference",
      "status",
      "limit",
      "offset",
      "sort",
      "criteria",
    ];
    for (const key of allow) {
      const v = search.get(key);
      if (v) params.set(key, v);
    }

    const url = `https://api.mercadopago.com/preapproval/search${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: "mercadopago_api_error", details: text },
        { status: 500 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    // Normalize common fields if structure matches MP format
    let results = Array.isArray(data?.results) ? data.results : [];

    // Some MP accounts ignore unsupported filters server-side; apply exact client-side filtering
    const qExternalRef = search.get("external_reference") || "";
    const qEmail = search.get("payer_email") || "";
    if (qExternalRef) {
      results = results.filter((r: any) => (r?.external_reference || "") === qExternalRef);
    }
    if (qEmail) {
      results = results.filter((r: any) => (r?.payer_email || "") === qEmail);
    }

    const simplified = results.map((r: any) => ({
      id: r.id,
      status: r.status,
      reason: r.reason,
      payer_email: r.payer_email,
      external_reference: r.external_reference,
      auto_recurring: r.auto_recurring,
      date_created: r.date_created,
      last_modified: r.last_modified,
    }));

    return NextResponse.json({
      raw: data,
      items: simplified,
      count: simplified.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message || String(err) },
      { status: 500 }
    );
  }
}
