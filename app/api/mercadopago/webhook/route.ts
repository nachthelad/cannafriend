import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { unwrapError } from "@/lib/errors";

export const runtime = "nodejs";

type Preapproval = {
  id: string;
  status?: string;
  payer_email?: string;
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

function shouldGrantPremium(status?: string) {
  const s = (status || "").toLowerCase();
  // Common statuses: authorized/active -> grant; cancelled/paused -> revoke
  return (
    s === "authorized" || s === "active" || s === "authorized_for_recurring"
  );
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;
    const topic = search.get("topic") || search.get("type");
    const id = search.get("id") || search.get("preapproval_id");

    if ((topic || "").toLowerCase() !== "preapproval" || !id) {
      // Ignore non-preapproval pings to avoid noise
      return NextResponse.json({ ignored: true });
    }

    const pre = await fetchPreapproval(id);
    if (!pre?.payer_email) {
      return NextResponse.json(
        { error: "missing_payer_email" },
        { status: 400 }
      );
    }
    const grant = shouldGrantPremium(pre.status);
    const result = await setPremiumByEmail(pre.payer_email, grant);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, premium: grant });
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
    const type = body?.type || "";
    const id = body?.data?.id || "";

    // Fallback to query string if needed
    const search = req.nextUrl.searchParams;
    const qsType = search.get("type") || search.get("topic");
    const qsId = search.get("id") || search.get("preapproval_id");

    const finalType = (type || qsType || "").toLowerCase();
    const finalId = id || qsId || "";

    if (finalType !== "preapproval" || !finalId) {
      return NextResponse.json({ ignored: true });
    }

    const pre = await fetchPreapproval(finalId);
    if (!pre?.payer_email) {
      return NextResponse.json(
        { error: "missing_payer_email" },
        { status: 400 }
      );
    }
    const grant = shouldGrantPremium(pre.status);
    const result = await setPremiumByEmail(pre.payer_email, grant);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, premium: grant });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: unwrapError(err, "webhook_error") },
      { status: 500 }
    );
  }
}
