import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Client calls this after returning from Mercado Pago to refresh custom claims
export async function POST(req: NextRequest) {
  try {
    // Import Firebase Admin at runtime
    const { adminAuth } = await import("@/lib/firebase-admin");
    
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }
    const idToken = authHeader.split(" ")[1];
    const decoded = await adminAuth().verifyIdToken(idToken);

    // Force token refresh next time on client by changing a claim no-op
    const user = await adminAuth().getUser(decoded.uid);
    const claims = { ...(user.customClaims || {}) } as Record<string, unknown>;
    claims._syncedAt = Date.now();
    await adminAuth().setCustomUserClaims(decoded.uid, claims);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "sync_failed" },
      { status: 500 }
    );
  }
}
