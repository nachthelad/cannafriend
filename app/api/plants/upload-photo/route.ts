import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage } from "@/lib/firebase-admin";
import { generateImageFileName, validateImageFileSize, validateImageFileType } from "@/lib/image-config";
import { buildImageStoragePath } from "@/lib/firebase-config";

export const runtime = "nodejs";

function buildDownloadUrl(bucketName: string, objectPath: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");

    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ error: "missing_auth" }, { status: 401 });
    }

    const idToken = authHeader.split(" ")[1];
    const decoded = await adminAuth().verifyIdToken(idToken);

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }

    const typeError = validateImageFileType(file);
    if (typeError) {
      return NextResponse.json({ error: typeError.key }, { status: 400 });
    }

    const sizeError = validateImageFileSize(file, 20);
    if (sizeError) {
      return NextResponse.json({ error: sizeError.key }, { status: 400 });
    }

    const bucket = adminStorage().bucket();
    const bucketName = bucket.name;
    const fileName = generateImageFileName(file.name);
    const objectPath = buildImageStoragePath(decoded.uid, fileName);
    const downloadToken = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());

    await bucket.file(objectPath).save(buffer, {
      resumable: false,
      metadata: {
        cacheControl: "public,max-age=31536000,immutable",
        contentType: file.type,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    return NextResponse.json({
      url: buildDownloadUrl(bucketName, objectPath, downloadToken),
    });
  } catch (error) {
    console.error("[upload-photo]", error);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
