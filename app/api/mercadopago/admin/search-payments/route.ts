import { NextRequest, NextResponse } from "next/server";
import { ADMIN_EMAIL } from "@/lib/constants";

export const runtime = "nodejs";

async function verifyAdmin(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return { ok: false as const, error: "missing_auth" };
    }
    const token = authHeader.split(" ")[1];
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
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 401 });

  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "mercadopago_not_configured" }, { status: 500 });

  try {
    const search = req.nextUrl.searchParams;
    const params = new URLSearchParams();
    const allow = [
      "external_reference",
      // Map UI param payer_email -> API filter payer.email
      // We'll still accept payer_email from the UI and translate it here
      "payer_email",
      "status",
      "sort",
      "criteria",
      "limit",
      "offset",
      "range",
      "begin_date",
      "end_date",
    ];
    const qEmail = search.get("payer_email") || "";
    for (const k of allow) {
      const v = search.get(k);
      if (!v) continue;
      if (k === "payer_email") {
        params.set("payer.email", v);
      } else {
        params.set(k, v);
      }
    }

    // Some filters (like payer_email) require an explicit date range. Provide a sensible default (last 90 days)
    if (!params.has("range") && (qEmail || params.has("status") || params.has("external_reference") || params.has("payer.email"))) {
      const end = new Date();
      const begin = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      // MP expects ISO-8601 with timezone, e.g., 2023-01-01T00:00:00Z
      params.set("range", "date_created");
      params.set("begin_date", begin.toISOString());
      params.set("end_date", end.toISOString());
    }

    const url = `https://api.mercadopago.com/v1/payments/search${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return NextResponse.json({ error: "mercadopago_api_error", details: text }, { status: 500 });
    const data = JSON.parse(text);
    let results = Array.isArray(data?.results) ? data.results : [];
    const qExternalRef = search.get("external_reference") || "";
    if (qExternalRef) {
      results = results.filter((r: any) => (r?.external_reference || "") === qExternalRef);
    }
    if (qEmail) {
      results = results.filter((r: any) => (r?.payer?.email || "") === qEmail);
    }
    const simplified = results.map((r: any) => ({
      id: r.id,
      status: r.status,
      status_detail: r.status_detail,
      external_reference: r.external_reference,
      payer_email: r.payer?.email,
      date_approved: r.date_approved,
      transaction_amount: r.transaction_amount,
      currency_id: r.currency_id,
    }));
    return NextResponse.json({ count: simplified.length, items: simplified, raw: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
