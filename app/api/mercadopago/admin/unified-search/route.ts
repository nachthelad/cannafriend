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

  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!mpToken) return NextResponse.json({ error: "mercadopago_not_configured" }, { status: 500 });

  const qs = req.nextUrl.searchParams;
  const payerEmail = qs.get("payer_email") || "";
  const externalRef = qs.get("external_reference") || "";
  const status = qs.get("status") || ""; // optional
  const scope = (qs.get("scope") || "all").toLowerCase(); // all | payments | preapproval

  // Compute default date range for payments search (MP often requires it)
  const end = new Date();
  const begin = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // last 180 days

  const headers = {
    Authorization: `Bearer ${mpToken}`,
    "Content-Type": "application/json",
  } as const;

  async function searchPreapprovals() {
    const p = new URLSearchParams();
    if (payerEmail) p.set("payer_email", payerEmail);
    if (externalRef) p.set("external_reference", externalRef);
    if (status) p.set("status", status);
    const url = `https://api.mercadopago.com/preapproval/search${p.toString() ? `?${p.toString()}` : ""}`;
    const res = await fetch(url, { headers, cache: "no-store" });
    const text = await res.text();
    if (!res.ok) throw new Error(`preapproval_search_failed: ${text}`);
    const data = JSON.parse(text);
    let results: any[] = Array.isArray(data?.results) ? data.results : [];
    if (externalRef) results = results.filter((r) => (r?.external_reference || "") === externalRef);
    if (payerEmail) results = results.filter((r) => (r?.payer_email || "") === payerEmail);
    return results.map((r) => ({
      type: "preapproval" as const,
      id: r.id,
      status: r.status,
      payer_email: r.payer_email,
      external_reference: r.external_reference,
      date: r.last_modified || r.date_created || null,
      raw: r,
    }));
  }

  async function searchPayments() {
    const p = new URLSearchParams();
    if (externalRef) p.set("external_reference", externalRef);
    // MercadoPago search API may not support filtering by payer.email directly.
    // We'll fetch by other filters and apply an exact post-filter by email below.
    if (status) p.set("status", status);
    // Provide default date range
    p.set("range", "date_created");
    p.set("begin_date", begin.toISOString());
    p.set("end_date", end.toISOString());
    const url = `https://api.mercadopago.com/v1/payments/search?${p.toString()}`;
    const res = await fetch(url, { headers, cache: "no-store" });
    const text = await res.text();
    if (!res.ok) throw new Error(`payments_search_failed: ${text}`);
    const data = JSON.parse(text);
    let results: any[] = Array.isArray(data?.results) ? data.results : [];
    if (externalRef) results = results.filter((r) => (r?.external_reference || "") === externalRef);
    if (payerEmail) results = results.filter((r) => (r?.payer?.email || "") === payerEmail);
    return results.map((r) => ({
      type: "payment" as const,
      id: r.id,
      status: r.status,
      payer_email: r.payer?.email,
      external_reference: r.external_reference,
      date: r.date_approved || r.date_created || null,
      raw: r,
    }));
  }

  try {
    const tasks: Promise<any[]>[] = [];
    if (scope === "all" || scope === "preapproval") tasks.push(searchPreapprovals());
    if (scope === "all" || scope === "payments") tasks.push(searchPayments());
    const chunks = await Promise.all(tasks);
    const items = chunks.flat();
    // Sort by date desc when possible
    items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    return NextResponse.json({ count: items.length, items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
