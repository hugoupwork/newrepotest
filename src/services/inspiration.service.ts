import { prisma } from "@/lib/prisma";
import type { InspirationLayerType } from "@/generated/prisma/client";
import type { LayerConfigInput, InspirationBrandInput } from "@/types/inspiration";

const ALL_LAYER_TYPES = [
  "DIRECT_COMPETITORS",
  "SAME_NICHE",
  "SAME_DESIRE_OUTCOME",
  "SAME_DEMOGRAPHIC",
  "TREND_SPOTTER",
] as const;

/**
 * Get or create an InspirationBoard for a brand.
 * Creates all 5 layers on first visit.
 * Optionally seeds Layer 1 from onboarding competitors.
 */
export async function getOrCreateBoard(brandId: string) {
  const existing = await prisma.inspirationBoard.findUnique({
    where: { brandId },
    include: {
      layers: {
        include: {
          brands: { include: { adCreatives: { select: { id: true } } } },
          trends: { select: { id: true } },
        },
        orderBy: { type: "asc" },
      },
    },
  });

  if (existing) return existing;

  // Create board with all 5 layers
  const board = await prisma.inspirationBoard.create({
    data: {
      brandId,
      layers: {
        create: ALL_LAYER_TYPES.map((type) => ({ type })),
      },
    },
    include: {
      layers: {
        include: {
          brands: { include: { adCreatives: { select: { id: true } } } },
          trends: { select: { id: true } },
        },
        orderBy: { type: "asc" },
      },
    },
  });

  // Seed from onboarding data
  await seedFromOnboarding(brandId, board.layers);

  // Re-fetch to include seeded data
  return prisma.inspirationBoard.findUnique({
    where: { id: board.id },
    include: {
      layers: {
        include: {
          brands: { include: { adCreatives: { select: { id: true } } } },
          trends: { select: { id: true } },
        },
        orderBy: { type: "asc" },
      },
    },
  });
}

/**
 * Seed layers from onboarding data on first board creation.
 */
async function seedFromOnboarding(
  brandId: string,
  layers: { id: string; type: string }[]
) {
  const onboarding = await prisma.onboardingResponse.findUnique({
    where: { brandId },
  });

  if (!onboarding) return;

  const competitors = onboarding.competitors as Record<string, unknown> | null;
  const targetAudience = onboarding.targetAudience as Record<string, unknown> | null;

  // Seed Layer 1 with known competitors
  if (competitors?.keyCompetitors) {
    const layer1 = layers.find((l) => l.type === "DIRECT_COMPETITORS");
    if (layer1) {
      const names = String(competitors.keyCompetitors)
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);

      for (const name of names) {
        await prisma.inspirationBrand.create({
          data: {
            layerId: layer1.id,
            name,
            isUserAdded: false,
          },
        });
      }
    }
  }

  // Pre-fill Layer 4 demographic from target audience
  if (targetAudience?.demographics) {
    const layer4 = layers.find((l) => l.type === "SAME_DEMOGRAPHIC");
    if (layer4) {
      await prisma.inspirationLayer.update({
        where: { id: layer4.id },
        data: { demographic: String(targetAudience.demographics) },
      });
    }
  }
}

export async function getBoard(brandId: string) {
  return prisma.inspirationBoard.findUnique({
    where: { brandId },
    include: {
      layers: {
        include: {
          brands: { include: { adCreatives: { select: { id: true } } } },
          trends: { select: { id: true } },
        },
        orderBy: { type: "asc" },
      },
    },
  });
}

export async function getLayerWithDetails(layerId: string) {
  return prisma.inspirationLayer.findUnique({
    where: { id: layerId },
    include: {
      board: { include: { brand: { include: { onboarding: true } } } },
      brands: {
        include: {
          adCreatives: true,
          adLibraryScrapeJob: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      trends: { orderBy: { relevanceScore: "desc" } },
    },
  });
}

export async function getLayerByBoardAndType(boardId: string, type: string) {
  return prisma.inspirationLayer.findUnique({
    where: {
      boardId_type: {
        boardId,
        type: type as InspirationLayerType,
      },
    },
    include: {
      board: { include: { brand: { include: { onboarding: true } } } },
      brands: {
        include: {
          adCreatives: true,
          adLibraryScrapeJob: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      trends: { orderBy: { relevanceScore: "desc" } },
    },
  });
}

export async function updateLayerConfig(layerId: string, data: LayerConfigInput) {
  return prisma.inspirationLayer.update({
    where: { id: layerId },
    data: {
      label: data.label,
      description: data.description,
      desireKeyword: data.desireKeyword,
      demographic: data.demographic,
    },
  });
}

export async function addBrand(layerId: string, data: InspirationBrandInput) {
  return prisma.inspirationBrand.create({
    data: {
      layerId,
      name: data.name,
      metaPageId: data.metaPageId,
      metaPageUrl: data.metaPageUrl || undefined,
      website: data.website || undefined,
      estimatedRevenue: data.estimatedRevenue,
      revenueCategory: data.revenueCategory,
      socialFollowing: data.socialFollowing,
      adSpendEstimate: data.adSpendEstimate,
      notes: data.notes,
      isUserAdded: true,
    },
  });
}

export async function updateBrand(brandId: string, data: Partial<InspirationBrandInput>) {
  return prisma.inspirationBrand.update({
    where: { id: brandId },
    data: {
      name: data.name,
      metaPageId: data.metaPageId,
      metaPageUrl: data.metaPageUrl || undefined,
      website: data.website || undefined,
      estimatedRevenue: data.estimatedRevenue,
      revenueCategory: data.revenueCategory,
      socialFollowing: data.socialFollowing,
      adSpendEstimate: data.adSpendEstimate,
      notes: data.notes,
    },
  });
}

export async function removeBrand(brandId: string) {
  return prisma.inspirationBrand.delete({ where: { id: brandId } });
}

export async function saveTrendItem(
  layerId: string,
  data: {
    title: string;
    description?: string;
    sourceUrl?: string;
    sourceName?: string;
    imageUrl?: string;
    category?: string;
    trendDate?: string;
    relevanceScore?: number;
    aiAdaptation?: string;
    aiRelevanceNotes?: string;
  }
) {
  return prisma.trendItem.create({
    data: {
      layerId,
      title: data.title,
      description: data.description,
      sourceUrl: data.sourceUrl || undefined,
      sourceName: data.sourceName,
      imageUrl: data.imageUrl,
      category: data.category,
      trendDate: data.trendDate ? new Date(data.trendDate) : undefined,
      relevanceScore: data.relevanceScore,
      aiAdaptation: data.aiAdaptation,
      aiRelevanceNotes: data.aiRelevanceNotes,
    },
  });
}

export async function removeTrendItem(trendId: string) {
  return prisma.trendItem.delete({ where: { id: trendId } });
}

export async function updateTrendItem(
  trendId: string,
  data: { isRelevant?: boolean; aiAdaptation?: string; aiRelevanceNotes?: string; relevanceScore?: number }
) {
  return prisma.trendItem.update({
    where: { id: trendId },
    data,
  });
}
