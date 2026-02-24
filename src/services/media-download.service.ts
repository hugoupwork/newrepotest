import { prisma } from "@/lib/prisma";
import { uploadMedia, downloadFromUrl } from "@/lib/storage";
import type { MediaProcessingStatus } from "@/generated/prisma/client";

export async function downloadCreativeMedia(creativeId: string) {
  const creative = await prisma.adCreative.findUnique({
    where: { id: creativeId },
    include: { brand: { select: { name: true } } },
  });

  if (!creative) throw new Error("Creative not found");

  const assets = [];

  // Download screenshot/image
  if (creative.screenshotUrl) {
    try {
      const asset = await downloadAndStore({
        creativeId,
        originalUrl: creative.screenshotUrl,
        prefix: `creatives/${creativeId}/image`,
      });
      assets.push(asset);
    } catch (e) {
      console.error("Failed to download image:", e);
      await createFailedAsset(creativeId, creative.screenshotUrl, String(e));
    }
  }

  // Download video
  if (creative.videoUrl) {
    try {
      const asset = await downloadAndStore({
        creativeId,
        originalUrl: creative.videoUrl,
        prefix: `creatives/${creativeId}/video`,
      });
      assets.push(asset);
    } catch (e) {
      console.error("Failed to download video:", e);
      await createFailedAsset(creativeId, creative.videoUrl, String(e));
    }
  }

  // Mark creative as media downloaded
  if (assets.length > 0) {
    await prisma.adCreative.update({
      where: { id: creativeId },
      data: { mediaDownloaded: true },
    });
  }

  return assets;
}

async function downloadAndStore({
  creativeId,
  originalUrl,
  prefix,
}: {
  creativeId: string;
  originalUrl: string;
  prefix: string;
}) {
  // Update status to downloading
  const asset = await prisma.mediaAsset.create({
    data: {
      creativeId,
      originalUrl,
      storagePath: "",
      storageUrl: "",
      mimeType: "",
      status: "DOWNLOADING" as MediaProcessingStatus,
    },
  });

  try {
    const { buffer, contentType } = await downloadFromUrl(originalUrl);

    // Determine file extension from content type
    const ext = contentType.split("/")[1]?.split(";")[0] ?? "bin";
    const key = `${prefix}.${ext}`;

    const { storagePath, storageUrl } = await uploadMedia({
      key,
      body: buffer,
      contentType,
    });

    // Compute basic dimensions for images
    let width: number | undefined;
    let height: number | undefined;
    if (contentType.startsWith("image/")) {
      try {
        const sharp = (await import("sharp")).default;
        const metadata = await sharp(buffer).metadata();
        width = metadata.width;
        height = metadata.height;
      } catch {
        // sharp may not process all formats
      }
    }

    // Compute perceptual hash for images
    let perceptualHash: string | undefined;
    if (contentType.startsWith("image/")) {
      perceptualHash = await computePerceptualHash(buffer);
    }

    const updated = await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        storagePath,
        storageUrl,
        mimeType: contentType,
        fileSizeBytes: buffer.length,
        width,
        height,
        perceptualHash,
        status: "ANALYZED" as MediaProcessingStatus,
      },
    });

    return updated;
  } catch (e) {
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        status: "FAILED" as MediaProcessingStatus,
        errorMessage: String(e),
      },
    });
    throw e;
  }
}

async function createFailedAsset(
  creativeId: string,
  originalUrl: string,
  errorMessage: string
) {
  return prisma.mediaAsset.create({
    data: {
      creativeId,
      originalUrl,
      storagePath: "",
      storageUrl: "",
      mimeType: "",
      status: "FAILED" as MediaProcessingStatus,
      errorMessage,
    },
  });
}

export async function downloadBatchMedia(creativeIds: string[]) {
  const results = [];
  for (const id of creativeIds) {
    try {
      const assets = await downloadCreativeMedia(id);
      results.push({ creativeId: id, assets, error: null });
    } catch (e) {
      results.push({ creativeId: id, assets: [], error: String(e) });
    }
  }
  return results;
}

export async function computePerceptualHash(
  buffer: Buffer
): Promise<string | undefined> {
  try {
    const sharp = (await import("sharp")).default;
    // Resize to 8x8 grayscale for a simple average hash
    const pixels = await sharp(buffer)
      .resize(8, 8, { fit: "fill" })
      .grayscale()
      .raw()
      .toBuffer();

    // Compute average
    let sum = 0;
    for (let i = 0; i < pixels.length; i++) {
      sum += pixels[i];
    }
    const avg = sum / pixels.length;

    // Build hash: each bit is 1 if pixel > average
    let hash = "";
    for (let i = 0; i < pixels.length; i++) {
      hash += pixels[i] > avg ? "1" : "0";
    }

    // Convert binary string to hex
    let hex = "";
    for (let i = 0; i < hash.length; i += 4) {
      hex += parseInt(hash.substring(i, i + 4), 2).toString(16);
    }

    return hex;
  } catch {
    return undefined;
  }
}

export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const b1 = parseInt(hash1[i], 16);
    const b2 = parseInt(hash2[i], 16);
    let xor = b1 ^ b2;
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

export async function getMediaAssets(creativeId: string) {
  return prisma.mediaAsset.findMany({
    where: { creativeId },
    orderBy: { createdAt: "desc" },
  });
}
