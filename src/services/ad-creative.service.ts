import { prisma } from "@/lib/prisma";
import type { AdCreativeInput } from "@/types/inspiration";
import type { Prisma, AdFormat, InspirationLayerType } from "@/generated/prisma/client";

export async function saveAdCreatives(
  inspirationBrandId: string,
  creatives: AdCreativeInput[]
) {
  const results = [];

  for (const creative of creatives) {
    // Skip if we already have this ad by metaAdId
    if (creative.metaAdId) {
      const existing = await prisma.adCreative.findUnique({
        where: { metaAdId: creative.metaAdId },
      });
      if (existing) continue;
    }

    const result = await prisma.adCreative.create({
      data: {
        brandId: inspirationBrandId,
        metaAdId: creative.metaAdId,
        adLibraryUrl: creative.adLibraryUrl,
        screenshotUrl: creative.screenshotUrl,
        videoUrl: creative.videoUrl,
        thumbnailUrl: creative.thumbnailUrl,
        primaryText: creative.primaryText,
        headline: creative.headline,
        linkDescription: creative.linkDescription,
        ctaType: creative.ctaType,
        landingPageUrl: creative.landingPageUrl,
        format: creative.format as AdFormat | undefined,
        hookType: creative.hookType,
        ctaStyle: creative.ctaStyle,
        emotionalAppeal: creative.emotionalAppeal,
        tags: creative.tags ?? [],
        isActive: creative.isActive ?? true,
        adStartDate: creative.adStartDate
          ? new Date(creative.adStartDate)
          : undefined,
        adEndDate: creative.adEndDate
          ? new Date(creative.adEndDate)
          : undefined,
      },
    });

    results.push(result);
  }

  return results;
}

export async function updateAdCreative(
  creativeId: string,
  data: Partial<AdCreativeInput>
) {
  return prisma.adCreative.update({
    where: { id: creativeId },
    data: {
      primaryText: data.primaryText,
      headline: data.headline,
      ctaType: data.ctaType,
      format: data.format as AdFormat | undefined,
      hookType: data.hookType,
      ctaStyle: data.ctaStyle,
      emotionalAppeal: data.emotionalAppeal,
      tags: data.tags,
    },
  });
}

export async function tagAdCreative(creativeId: string, tags: string[]) {
  return prisma.adCreative.update({
    where: { id: creativeId },
    data: { tags },
  });
}

export async function setAdCreativeAnalysis(
  creativeId: string,
  analysis: Prisma.InputJsonValue,
  score: number
) {
  return prisma.adCreative.update({
    where: { id: creativeId },
    data: {
      aiAnalysis: analysis,
      aiScore: score,
    },
  });
}

export async function getAdCreativesByLayer(layerId: string) {
  const brands = await prisma.inspirationBrand.findMany({
    where: { layerId },
    select: { id: true },
  });

  const brandIds = brands.map((b) => b.id);

  return prisma.adCreative.findMany({
    where: { brandId: { in: brandIds } },
    include: { brand: { select: { name: true, layerId: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdCreativesByFilter(
  boardId: string,
  filters: {
    layerType?: string;
    format?: string;
    hookType?: string;
    ctaStyle?: string;
    emotionalAppeal?: string;
    tagSearch?: string;
  }
) {
  // Get layers for this board
  const layerWhere: Prisma.InspirationLayerWhereInput = { boardId };
  if (filters.layerType) {
    layerWhere.type = filters.layerType as InspirationLayerType;
  }

  const layers = await prisma.inspirationLayer.findMany({
    where: layerWhere,
    select: { id: true },
  });

  const layerIds = layers.map((l) => l.id);

  const brands = await prisma.inspirationBrand.findMany({
    where: { layerId: { in: layerIds } },
    select: { id: true },
  });

  const brandIds = brands.map((b) => b.id);

  const creativeWhere: Prisma.AdCreativeWhereInput = {
    brandId: { in: brandIds },
  };

  if (filters.format) {
    creativeWhere.format = filters.format as AdFormat;
  }
  if (filters.hookType) {
    creativeWhere.hookType = filters.hookType;
  }
  if (filters.ctaStyle) {
    creativeWhere.ctaStyle = filters.ctaStyle;
  }
  if (filters.emotionalAppeal) {
    creativeWhere.emotionalAppeal = filters.emotionalAppeal;
  }
  if (filters.tagSearch) {
    creativeWhere.tags = { has: filters.tagSearch };
  }

  return prisma.adCreative.findMany({
    where: creativeWhere,
    include: {
      brand: {
        select: { name: true, layerId: true, layer: { select: { type: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdCreative(creativeId: string) {
  return prisma.adCreative.findUnique({
    where: { id: creativeId },
    include: {
      brand: {
        select: {
          name: true,
          layerId: true,
          layer: {
            select: {
              type: true,
              board: { select: { brandId: true } },
            },
          },
        },
      },
    },
  });
}

export async function deleteAdCreative(creativeId: string) {
  return prisma.adCreative.delete({ where: { id: creativeId } });
}
