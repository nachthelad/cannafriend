import { NextRequest, NextResponse } from "next/server";
import { unwrapError } from "@/lib/errors";
import {
  normalizeMercadoPagoResourceType,
  processMercadoPagoResource,
} from "@/app/api/mercadopago/admin/_processing";

export const runtime = "nodejs";

type MercadoPagoNotification = {
  type?: string;
  topic?: string;
  action?: string;
  data?: { id?: string | number };
};

function resolveNotificationType(body: MercadoPagoNotification) {
  const explicitType = normalizeMercadoPagoResourceType(
    body.type || body.topic || ""
  );
  if (explicitType) return explicitType;

  const action = (body.action || "").toLowerCase();
  if (action.includes("authorized_payment")) return "authorized_payment";
  if (action.includes("preapproval")) return "preapproval";
  if (action.includes("payment")) return "payment";
  return "";
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "MercadoPago webhook endpoint is active",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as MercadoPagoNotification;
    const finalType = resolveNotificationType(body);
    const finalId = body?.data?.id?.toString() || "";

    if (!finalId) return NextResponse.json({ ignored: true });

    const result = await processMercadoPagoResource(finalType, finalId);
    return NextResponse.json(result.body, { status: result.status || 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: unwrapError(err, "webhook_error") },
      { status: 500 }
    );
  }
}
