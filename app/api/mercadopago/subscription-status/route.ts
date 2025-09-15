import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type MPPreapproval = {
  id: string;
  status?: string;
  payer_email?: string;
  external_reference?: string;
  date_created?: string;
  last_modified?: string;
};

type MPPayment = {
  id: number | string;
  status?: string;
  date_approved?: string;
  external_reference?: string;
  payer?: { email?: string };
};

export async function GET(req: NextRequest) {
  try {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) return NextResponse.json({ error: "mercadopago_not_configured" }, { status: 500 });

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }
    const idToken = authHeader.split(" ")[1];
    const { adminAuth } = await import("@/lib/firebase-admin");
    const decoded = await adminAuth().verifyIdToken(idToken);
    const user = await adminAuth().getUser(decoded.uid);
    const uid = user.uid;
    const email = user.email || undefined;
    const claims = (user.customClaims as any) || {};
    const premium = Boolean(claims?.premium || ((typeof claims?.premium_until === "number") && claims.premium_until > Date.now()));
    const premium_until: number | null = typeof claims?.premium_until === "number" ? claims.premium_until : null;

    // Fetch latest preapproval by UID
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } as const;
    let preStatus: string | null = null;
    let recurring: boolean | null = null;
    try {
      const sp = new URLSearchParams();
      sp.set("external_reference", uid);
      const preRes = await fetch(`https://api.mercadopago.com/preapproval/search?${sp.toString()}`, { headers, cache: "no-store" });
      if (preRes.ok) {
        const data = await preRes.json();
        let items: MPPreapproval[] = Array.isArray(data?.results) ? data.results : [];
        items = items.filter((r) => (r.external_reference || "") === uid);
        items.sort((a, b) => new Date(b.last_modified || b.date_created || 0).getTime() - new Date(a.last_modified || a.date_created || 0).getTime());
        if (items[0]) {
          preStatus = (items[0].status || "").toLowerCase();
          recurring = preStatus === "active" || preStatus === "authorized" || preStatus === "authorized_for_recurring";
        }
      }
    } catch {}

    // Fetch latest approved payment by UID
    let lastPayment: { id: string; status?: string; date_approved?: string } | null = null;
    try {
      const ps = new URLSearchParams();
      ps.set("external_reference", uid);
      ps.set("status", "approved");
      // Date range last 180 days
      const end = new Date();
      const begin = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      ps.set("range", "date_created");
      ps.set("begin_date", begin.toISOString());
      ps.set("end_date", end.toISOString());
      const payRes = await fetch(`https://api.mercadopago.com/v1/payments/search?${ps.toString()}`, { headers, cache: "no-store" });
      if (payRes.ok) {
        const data = await payRes.json();
        let results: MPPayment[] = Array.isArray(data?.results) ? data.results : [];
        results = results.filter((r) => (r.external_reference || "") === uid);
        results.sort((a, b) => new Date(b.date_approved || 0).getTime() - new Date(a.date_approved || 0).getTime());
        if (results[0]) {
          lastPayment = {
            id: (results[0].id ?? "").toString(),
            status: results[0].status,
            date_approved: results[0].date_approved,
          };
        }
      }
    } catch {}

    const remaining_ms = premium_until ? Math.max(0, premium_until - Date.now()) : null;

    return NextResponse.json({
      premium,
      premium_until,
      remaining_ms,
      recurring,
      preapproval_status: preStatus,
      last_payment: lastPayment,
      email,
      uid,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}

