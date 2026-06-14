import { adminAuth } from "@/lib/firebase-admin";
import { unwrapError } from "@/lib/errors";

type Preapproval = {
  id: string;
  status?: string;
  payer_email?: string;
  external_reference?: string;
};

type AuthorizedPayment = {
  id: string;
  status?: string;
  payer?: { email?: string };
  external_reference?: string;
  preapproval_id?: string;
};

type ProcessResult = {
  body: Record<string, unknown>;
  status?: number;
};

export function normalizeMercadoPagoResourceType(type: string) {
  const value = type.trim().toLowerCase();
  if (value === "authorized_payment" || value === "payment") {
    return value;
  }
  if (value === "preapproval") {
    return value;
  }
  return "";
}

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
    claims.premium = true;
    claims.premium_until = untilMs;
    await adminAuth().setCustomUserClaims(uid, claims);
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: unwrapError(err, "user_update_failed") };
  }
}

function shouldGrantPremium(status?: string) {
  const s = (status || "").toLowerCase();
  return (
    s === "authorized" || s === "active" || s === "authorized_for_recurring"
  );
}

function isApprovedPayment(status?: string) {
  const s = (status || "").toLowerCase();
  return s === "approved" || s === "authorized";
}

function isRevokedPayment(status?: string) {
  const s = (status || "").toLowerCase();
  return s === "refunded" || s === "charged_back" || s === "cancelled";
}

async function fetchAuthorizedPayment(id: string): Promise<AuthorizedPayment> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("Missing MERCADOPAGO_ACCESS_TOKEN env var");

  let res = await fetch(
    `https://api.mercadopago.com/authorized_payments/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );
  if (res.ok) return (await res.json()) as AuthorizedPayment;

  res = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch payment ${id}: ${res.status} ${text}`);
  }
  const data = (await res.json()) as {
    id?: { toString?: () => string } | string | number;
    status?: string;
    payer?: { email?: string };
    external_reference?: string;
  };
  return {
    id: data?.id?.toString?.() || id,
    status: data?.status,
    payer: { email: data?.payer?.email },
    external_reference: data?.external_reference,
  };
}

async function revokePremiumByUid(uid: string) {
  try {
    const user = await adminAuth().getUser(uid);
    const claims = { ...(user.customClaims || {}) } as Record<string, unknown>;
    claims.premium = false;
    delete claims.premium_until;
    await adminAuth().setCustomUserClaims(uid, claims);
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: unwrapError(err, "user_update_failed") };
  }
}

async function revokePremiumByEmail(email: string) {
  try {
    const user = await adminAuth().getUserByEmail(email);
    const claims = { ...(user.customClaims || {}) } as Record<string, unknown>;
    claims.premium = false;
    delete claims.premium_until;
    await adminAuth().setCustomUserClaims(user.uid, claims);
    return { ok: true as const };
  } catch (err: unknown) {
    return { ok: false as const, error: unwrapError(err, "user_update_failed") };
  }
}

export async function processMercadoPagoResource(
  type: string,
  id: string
): Promise<ProcessResult> {
  const normalizedType = normalizeMercadoPagoResourceType(type);

  if (!id) return { body: { ignored: true } };

  if (normalizedType === "authorized_payment" || normalizedType === "payment") {
    const pay = await fetchAuthorizedPayment(id);
    if (isApprovedPayment(pay.status)) {
      if (pay.external_reference) {
        const until = Date.now() + 31 * 24 * 60 * 60 * 1000;
        const result = await setPremiumUntilByUid(pay.external_reference, until);
        if (!result.ok) return { body: { error: result.error }, status: 500 };
        return { body: { ok: true, premium: true, until } };
      }
      const email = pay.payer?.email;
      if (!email) return { body: { error: "missing_email" }, status: 400 };
      const result = await setPremiumByEmail(email, true);
      if (!result.ok) return { body: { error: result.error }, status: 500 };
      return { body: { ok: true, premium: true } };
    }
    if (isRevokedPayment(pay.status)) {
      if (pay.external_reference) {
        const result = await revokePremiumByUid(pay.external_reference);
        if (!result.ok) return { body: { error: result.error }, status: 500 };
        return { body: { ok: true, premium: false, revoked: true } };
      }
      const email = pay.payer?.email;
      if (!email) return { body: { error: "missing_email" }, status: 400 };
      const result = await revokePremiumByEmail(email);
      if (!result.ok) return { body: { error: result.error }, status: 500 };
      return { body: { ok: true, premium: false, revoked: true } };
    }
    return { body: { ignored: true, reason: "payment_not_approved" } };
  }

  if (normalizedType !== "preapproval") {
    return { body: { ignored: true } };
  }

  const pre = await fetchPreapproval(id);
  const grant = shouldGrantPremium(pre.status);
  if (grant) {
    let result = pre?.external_reference
      ? await setPremiumByUid(pre.external_reference, true)
      : ({ ok: false as const, error: "no_external_reference" } as const);
    if (!result.ok) {
      if (!pre?.payer_email) {
        return {
          body: { error: "missing_payer_email_and_external_ref" },
          status: 400,
        };
      }
      result = await setPremiumByEmail(pre.payer_email, true);
    }
    if (!result.ok) {
      return { body: { error: result.error }, status: 500 };
    }
    return { body: { ok: true, premium: true } };
  }

  return { body: { ok: true, premium: false, ignoredChange: true } };
}
