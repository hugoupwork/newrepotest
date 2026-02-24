import { prisma } from "@/lib/prisma";
import { analyzeImageWithGemini, analyzeVideoWithGemini } from "@/lib/gemini";
import { downloadFromUrl } from "@/lib/storage";
import {
  IMAGE_ATOM_EXTRACTION_PROMPT,
  VIDEO_ATOM_EXTRACTION_PROMPT,
} from "@/config/atom-prompts";
import type { AtomExtractionResult } from "@/types/atoms";
import type {
  AtomCategory,
  MediaProcessingStatus,
  Prisma,
} from "@/generated/prisma/client";

const VALID_CATEGORIES: AtomCategory[] = [
  "VISUAL_HOOK",
  "TEXT_OVERLAY",
  "COLOR_PALETTE",
  "SCENE_COMPOSITION",
  "TALENT_ACTOR",
  "EMOTION",
  "MUSIC_AUDIO",
  "TRANSITION",
  "CTA_ELEMENT",
  "PRODUCT_PLACEMENT",
  "PACING",
  "LIGHTING_MOOD",
  "TYPOGRAPHY",
  "BRANDING_ELEMENT",
  "SOCIAL_PROOF_ELEMENT",
  "OTHER",
];

export async function analyzeCreativeAtoms(creativeId: string) {
  const creative = await prisma.adCreative.findUnique({
    where: { id: creativeId },
    include: { mediaAssets: true },
  });

  if (!creative) throw new Error("Creative not found");

  // Update status to processing
  await prisma.adCreative.update({
    where: { id: creativeId },
    data: { atomAnalysisStatus: "PROCESSING" as MediaProcessingStatus },
  });

  try {
    let result: AtomExtractionResult;

    // Determine if we have stored media or need to download
    const imageAsset = creative.mediaAssets.find((a) =>
      a.mimeType.startsWith("image/")
    );
    const videoAsset = creative.mediaAssets.find((a) =>
      a.mimeType.startsWith("video/")
    );

    if (videoAsset && videoAsset.storageUrl) {
      // Analyze video
      const { buffer, contentType } = await downloadFromUrl(
        videoAsset.storageUrl
      );
      const response = await analyzeVideoWithGemini({
        videoData: buffer,
        mimeType: contentType,
        prompt: VIDEO_ATOM_EXTRACTION_PROMPT,
      });
      result = parseGeminiResponse(response);
    } else if (imageAsset && imageAsset.storageUrl) {
      // Analyze image from stored asset
      const { buffer, contentType } = await downloadFromUrl(
        imageAsset.storageUrl
      );
      const response = await analyzeImageWithGemini({
        imageData: buffer,
        mimeType: contentType,
        prompt: IMAGE_ATOM_EXTRACTION_PROMPT,
      });
      result = parseGeminiResponse(response);
    } else if (creative.videoUrl) {
      // Download and analyze video directly
      const { buffer, contentType } = await downloadFromUrl(creative.videoUrl);
      const response = await analyzeVideoWithGemini({
        videoData: buffer,
        mimeType: contentType,
        prompt: VIDEO_ATOM_EXTRACTION_PROMPT,
      });
      result = parseGeminiResponse(response);
    } else if (creative.screenshotUrl) {
      // Download and analyze image directly
      const { buffer, contentType } = await downloadFromUrl(
        creative.screenshotUrl
      );
      const response = await analyzeImageWithGemini({
        imageData: buffer,
        mimeType: contentType,
        prompt: IMAGE_ATOM_EXTRACTION_PROMPT,
      });
      result = parseGeminiResponse(response);
    } else {
      throw new Error("No media available for analysis");
    }

    // Delete existing atoms for this creative (re-analysis)
    await prisma.creativeAtom.deleteMany({ where: { creativeId } });

    // Create atom records
    const atoms = [];
    for (const atom of result.atoms) {
      const category = VALID_CATEGORIES.includes(atom.category as AtomCategory)
        ? (atom.category as AtomCategory)
        : ("OTHER" as AtomCategory);

      const created = await prisma.creativeAtom.create({
        data: {
          creativeId,
          category,
          name: atom.name,
          description: atom.description,
          confidence: atom.confidence,
          timestampStart: atom.timestampStart,
          timestampEnd: atom.timestampEnd,
          boundingBox: atom.boundingBox
            ? (atom.boundingBox as Prisma.InputJsonValue)
            : undefined,
          attributes: (atom.attributes ?? {}) as Prisma.InputJsonValue,
        },
      });
      atoms.push(created);
    }

    // Update creative status and store raw response
    await prisma.adCreative.update({
      where: { id: creativeId },
      data: {
        atomAnalysisStatus: "ANALYZED" as MediaProcessingStatus,
        geminiAnalysis: result as unknown as Prisma.InputJsonValue,
      },
    });

    return atoms;
  } catch (e) {
    await prisma.adCreative.update({
      where: { id: creativeId },
      data: { atomAnalysisStatus: "FAILED" as MediaProcessingStatus },
    });
    throw e;
  }
}

function parseGeminiResponse(response: string): AtomExtractionResult {
  // Strip markdown code fences if present
  let cleaned = response.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return { atoms: [], overallAssessment: response };
  }
}

export async function analyzeBatchAtoms(jobId: string) {
  const job = await prisma.atomAnalysisJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");

  await prisma.atomAnalysisJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  let processed = 0;
  let failed = 0;

  for (const creativeId of job.creativeIds) {
    try {
      await analyzeCreativeAtoms(creativeId);
      processed++;
    } catch (e) {
      console.error(`Failed to analyze creative ${creativeId}:`, e);
      failed++;
    }

    await prisma.atomAnalysisJob.update({
      where: { id: jobId },
      data: { processedItems: processed, failedItems: failed },
    });

    // Rate limit: wait 2 seconds between Gemini calls
    if (processed + failed < job.creativeIds.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  await prisma.atomAnalysisJob.update({
    where: { id: jobId },
    data: {
      status: failed === job.creativeIds.length ? "FAILED" : "COMPLETED",
      completedAt: new Date(),
      processedItems: processed,
      failedItems: failed,
    },
  });
}

export async function getAtomsByCreative(creativeId: string) {
  return prisma.creativeAtom.findMany({
    where: { creativeId },
    orderBy: [{ category: "asc" }, { confidence: "desc" }],
  });
}

export async function getAtomsByBoard(
  boardId: string,
  filters?: {
    category?: string;
    minConfidence?: number;
    search?: string;
  }
) {
  const layers = await prisma.inspirationLayer.findMany({
    where: { boardId },
    select: { id: true },
  });
  const layerIds = layers.map((l) => l.id);

  const brands = await prisma.inspirationBrand.findMany({
    where: { layerId: { in: layerIds } },
    select: { id: true },
  });
  const brandIds = brands.map((b) => b.id);

  const creatives = await prisma.adCreative.findMany({
    where: { brandId: { in: brandIds } },
    select: { id: true },
  });
  const creativeIds = creatives.map((c) => c.id);

  const where: Prisma.CreativeAtomWhereInput = {
    creativeId: { in: creativeIds },
  };

  if (filters?.category) {
    where.category = filters.category as AtomCategory;
  }
  if (filters?.minConfidence) {
    where.confidence = { gte: filters.minConfidence };
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.creativeAtom.findMany({
    where,
    include: {
      creative: {
        select: {
          id: true,
          headline: true,
          screenshotUrl: true,
          thumbnailUrl: true,
          brand: { select: { name: true } },
        },
      },
    },
    orderBy: { confidence: "desc" },
  });
}
