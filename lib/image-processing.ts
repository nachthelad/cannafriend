export type ImageProcessOptions = {
  maxDimension?: number;
  outputQuality?: number; // 0..1
  preferMimeType?: string; // e.g., 'image/webp'
  timeoutMs?: number;
};

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_OUTPUT_QUALITY = 0.8;
const DEFAULT_PREFERRED_MIME = "image/webp";
const DEFAULT_PROCESS_TIMEOUT_MS = 8000;

let cachedWebpSupport: boolean | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error("Image load timeout")), 15000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = (e) => { clearTimeout(timer); reject(e); };
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Canvas toBlob timeout")), 15000);
    canvas.toBlob(
      (blob) => {
        clearTimeout(timer);
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      type,
      quality
    );
  });
}

function supportsCanvasMimeType(type: string): boolean {
  if (type !== "image/webp") {
    return true;
  }

  if (cachedWebpSupport != null) {
    return cachedWebpSupport;
  }

  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  cachedWebpSupport = probe.toDataURL(type).startsWith(`data:${type}`);
  return cachedWebpSupport;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${label} timeout`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

export async function downscaleAndConvert(
  file: File,
  options: ImageProcessOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const outputQuality = options.outputQuality ?? DEFAULT_OUTPUT_QUALITY;
  const preferredMime = options.preferMimeType ?? DEFAULT_PREFERRED_MIME;
  const timeoutMs = options.timeoutMs ?? DEFAULT_PROCESS_TIMEOUT_MS;

  return withTimeout(
    (async () => {
      const objectUrl = URL.createObjectURL(file);
      let img: HTMLImageElement;
      try {
        img = await loadImage(objectUrl);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      const srcWidth = img.naturalWidth || img.width;
      const srcHeight = img.naturalHeight || img.height;

      // Compute target size preserving aspect ratio and capping at maxDimension
      const scale = Math.min(1, maxDimension / Math.max(srcWidth, srcHeight));
      const targetWidth = Math.max(1, Math.round(srcWidth * scale));
      const targetHeight = Math.max(1, Math.round(srcHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D not supported");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Probe support once on a tiny canvas instead of serializing the full image.
      const outputType = supportsCanvasMimeType(preferredMime)
        ? preferredMime
        : "image/jpeg";

      const blob = await canvasToBlob(canvas, outputType, outputQuality);
      const newName =
        file.name.replace(/\.(jpeg|jpg|png|gif|webp|heic|heif)$/i, "") +
        (outputType === "image/webp" ? ".webp" : ".jpg");
      return new File([blob], newName, {
        type: outputType,
        lastModified: Date.now(),
      });
    })(),
    timeoutMs,
    "Image processing"
  );
}
