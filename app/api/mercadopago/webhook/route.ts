import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { unwrapError } from "@/lib/errors";

export const runtime = "nodejs";

type Preapproval = {
  id: string;
  status?: string;
  payer_email?: string;
  external_reference?: string;
};

type AuthorizedPayment = {
  id: string;
  status?: string; // approved, authorized, rejected
  payer?: { email?: string };
  external_reference?: string;
  preapproval_id?: string;
};

async function fetchPreapproval(preapprovalId: string) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN env var");
  }
  const res = await fetch(
    `https://api.mercadopago.com/preapproval/${encodeURIComponent(
      preapprovalId
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // 10s timeout (Next fetch has no timeout param; rely on platform defaults)
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Failed to fetch preapproval ${preapprovalId}: ${res.status} ${text}`
    );
  }
  const data = (await res.json()) as Preapproval;
  return data;
}

async function setPremiumByEmail(payerEmail: string, premium: boolean) {
  try {
    const user = await adminAuth().getUserByEmail(payerEmail);
    const claims = { ...(user.customClaims || {}) } as Record<string, unknown>;
    claims.premium = premium;
    await adminAuth().setCustomUserClaims(user.uid, claims);
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: unwrapError(err, "user_update_failed") };
  }
}

async function setPremiumByUid(uid: string, premium: boolean) {
  try {
    const user = await adminAuth().getUser(uid);
    const claims = { ...(user.customClaims || {}) } as Record<string, unknown>;
    claims.premium = premium;
    await adminAuth().setCustomUserClaims(uid, claims);
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: unwrapError(err, "user_update_failed") };
  }
}

async function setPremiumUntilByUid(uid: string, untilMs: number) {
  try {
    const user = await adminAuth().getUser(uid);
    const claims = { ...(user.customClaims || {}) } as Record<string, unknown>;
    (claims as any).premium = true;
    (claims as any).premium_until = untilMs;
    await adminAuth().setCustomUserClaims(uid, claims);
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: unwrapError(err, "user_update_failed") };
  }
}

function shouldGrantPremium(status?: string) {
  const s = (status || "").toLowerCase();
  // Common statuses: authorized/active -> grant; cancelled/paused -> revoke
  return (
    s === "authorized" || s === "active" || s === "authorized_for_recurring"
  );
}

function isApprovedPayment(status?: string) {
  const s = (status || "").toLowerCase();
  return s === "approved" || s === "authorized"; // treat authorized as valid
}

async function fetchAuthorizedPayment(id: string): Promise<AuthorizedPayment> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN env var");

  // Try authorized_payments endpoint first
  let res = await fetch(`https://api.mercadopago.com/authorized_payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) return (await res.json()) as AuthorizedPayment;

  // Fallback to v1 payments endpoint
  res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch payment ${id}: ${res.status} ${text}`);
  }
  const data = (await res.json()) as any;
  return {
    id: data?.id?.toString?.() || id,
    status: data?.status,
    payer: { email: data?.payer?.email },
    external_reference: data?.external_reference,
  } as AuthorizedPayment;
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;
    const topic = search.get("topic") || search.get("type");
    const id = search.get("id") || search.get("preapproval_id") || search.get("resource_id");

    const t = (topic || "").toLowerCase();
    if (!id) return NextResponse.json({ ignored: true });

    if (t === "authorized_payment" || t === "payment") {
      const pay = await fetchAuthorizedPayment(id);
      if (!isApprovedPayment(pay.status)) {
        return NextResponse.json({ ignored: true, reason: "payment_not_approved" });
      }
      // Prefer UID from external_reference via preapproval or payment payload, else fallback to payer email
      if (pay.external_reference) {
        const until = Date.now() + 31 * 24 * 60 * 60 * 1000; // 31 days
        const result = await setPremiumUntilByUid(pay.external_reference, until);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, premium: true, until });
      }
      const email = pay.payer?.email;
      if (!email) return NextResponse.json({ error: "missing_email" }, { status: 400 });
      const result = await setPremiumByEmail(email, true);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, premium: true });
    }

    if (t !== "preapproval") {
      return NextResponse.json({ ignored: true });
    }

    const pre = await fetchPreapproval(id);
    const grant = shouldGrantPremium(pre.status);
    if (grant) {
      // Prefer linking by external_reference (we set it to the Firebase UID)
      let result = pre?.external_reference
        ? await setPremiumByUid(pre.external_reference, true)
        : ({ ok: false as const, error: "no_external_reference" } as const);
      if (!result.ok) {
        if (!pre?.payer_email) {
          return NextResponse.json(
            { error: "missing_payer_email_and_external_ref" },
            { status: 400 }
          );
        }
        result = await setPremiumByEmail(pre.payer_email, true);
      }
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true, premium: true });
    }
    // If not grant (paused/cancelled), do not auto-revoke; rely on expiry or admin
    return NextResponse.json({ ok: true, premium: false, ignoredChange: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: unwrapError(err, "webhook_error") },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Newer MP notifications send JSON: { action, type, data: { id } }
    const body = (await req.json().catch(() => ({}))) as
      | { action?: string; type?: string; data?: { id?: string } }
      | undefined;
    const type = body?.type || body?.action || "";
    const id = body?.data?.id || "";

    // Fallback to query string if needed
    const search = req.nextUrl.searchParams;
    const qsType = search.get("type") || search.get("topic");
    const qsId = search.get("id") || search.get("preapproval_id");

    const finalType = (type || qsType || "").toLowerCase();
    const finalId = id || qsId || "";

    if (!finalId) return NextResponse.json({ ignored: true });

    if (finalType === "authorized_payment" || finalType === "payment") {
      const pay = await fetchAuthorizedPayment(finalId);
      if (!isApprovedPayment(pay.status)) {
        return NextResponse.json({ ignored: true, reason: "payment_not_approved" });
      }
      if (pay.external_reference) {
        const until = Date.now() + 31 * 24 * 60 * 60 * 1000; // 31 days
        const result = await setPremiumUntilByUid(pay.external_reference, until);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, premium: true, until });
      }
      const email = pay.payer?.email;
      if (!email) return NextResponse.json({ error: "missing_email" }, { status: 400 });
      const result = await setPremiumByEmail(email, true);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, premium: true });
    }

    if (finalType !== "preapproval") {
      return NextResponse.json({ ignored: true });
    }

    const pre = await fetchPreapproval(finalId);
    const grant = shouldGrantPremium(pre.status);
    if (grant) {
      // Prefer linking by external_reference (we set it to the Firebase UID)
      let result = pre?.external_reference
        ? await setPremiumByUid(pre.external_reference, true)
        : ({ ok: false as const, error: "no_external_reference" } as const);
      if (!result.ok) {
        if (!pre?.payer_email) {
          return NextResponse.json(
            { error: "missing_payer_email_and_external_ref" },
            { status: 400 }
          );
        }
        result = await setPremiumByEmail(pre.payer_email, true);
      }
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true, premium: true });
    }
    return NextResponse.json({ ok: true, premium: false, ignoredChange: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: unwrapError(err, "webhook_error") },
      { status: 500 }
    );
  }
}
