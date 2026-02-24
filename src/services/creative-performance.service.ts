import { prisma } from "@/lib/prisma";
import type { PerformanceInput } from "@/types/atoms";
import type { PerformanceTier, Prisma } from "@/generated/prisma/client";

export async function manuallySetPerformance(
  creativeId: string,
  data: PerformanceInput
) {
  const existing = await prisma.creativePerformance.findUnique({
    where: { creativeId },
  });

  const perfData = {
    spend: data.spend,
    impressions: data.impressions,
    clicks: data.clicks,
    ctr: data.ctr,
    cpc: data.cpc,
    cpm: data.cpm,
    conversions: data.conversions,
    conversionRate: data.conversionRate,
    roas: data.roas,
    revenue: data.revenue,
    performanceTier: (data.performanceTier ?? "UNKNOWN") as PerformanceTier,
    isManualEntry: true,
    dateRangeStart: data.dateRangeStart
      ? new Date(data.dateRangeStart)
      : undefined,
    dateRangeEnd: data.dateRangeEnd ? new Date(data.dateRangeEnd) : undefined,
  };

  if (existing) {
    return prisma.creativePerformance.update({
      where: { id: existing.id },
      data: perfData,
    });
  }

  return prisma.creativePerformance.create({
    data: {
      creativeId,
      ...perfData,
    },
  });
}

export async function importPerformanceFromMeta(
  adAccountId: string,
  _dateRange: { start: Date; end: Date }
) {
  // Placeholder for Meta API integration
  // In production, this would call the Meta Marketing API
  // to fetch ad-level metrics and create CreativePerformance records
  const account = await prisma.adAccount.findUnique({
    where: { id: adAccountId },
  });
  if (!account) throw new Error("Ad account not found");

  // TODO: Implement Meta Marketing API call
  // For now, return a placeholder response
  return { imported: 0, message: "Meta API integration pending" };
}

export async function computePerformanceTiers(boardId: string) {
  // Get all creatives with performance data for this board
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

  const performances = await prisma.creativePerformance.findMany({
    where: {
      creative: { brandId: { in: brandIds } },
      OR: [
        { roas: { not: null } },
        { spend: { not: null } },
      ],
    },
    orderBy: { roas: "desc" },
  });

  if (performances.length === 0) return { updated: 0 };

  // Sort by ROAS (primary) or spend (fallback)
  const sorted = [...performances].sort((a, b) => {
    if (a.roas != null && b.roas != null) return b.roas - a.roas;
    if (a.spend != null && b.spend != null) return b.spend - a.spend;
    return 0;
  });

  const total = sorted.length;
  let updated = 0;

  for (let i = 0; i < total; i++) {
    const percentile = i / total;
    let tier: PerformanceTier;

    if (percentile < 0.2) tier = "WINNER";
    else if (percentile < 0.4) tier = "STRONG";
    else if (percentile < 0.7) tier = "AVERAGE";
    else if (percentile < 0.9) tier = "WEAK";
    else tier = "NON_SPENDER";

    await prisma.creativePerformance.update({
      where: { id: sorted[i].id },
      data: { performanceTier: tier },
    });
    updated++;
  }

  return { updated };
}

export async function getPerformanceSummary(boardId: string) {
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

  const creativesWithPerf = await prisma.adCreative.findMany({
    where: { brandId: { in: brandIds } },
    include: {
      performance: true,
      atoms: { select: { category: true, name: true } },
    },
  });

  const totalCreatives = creativesWithPerf.length;
  const withPerf = creativesWithPerf.filter((c) => c.performance);

  // Count by tier
  const byTier: Record<string, number> = {};
  for (const c of withPerf) {
    const tier = c.performance!.performanceTier;
    byTier[tier] = (byTier[tier] ?? 0) + 1;
  }

  // Average ROAS
  const roasValues = withPerf
    .map((c) => c.performance!.roas)
    .filter((r): r is number => r != null);
  const avgRoas =
    roasValues.length > 0
      ? roasValues.reduce((s, r) => s + r, 0) / roasValues.length
      : null;

  // Total spend
  const spendValues = withPerf
    .map((c) => c.performance!.spend)
    .filter((s): s is number => s != null);
  const totalSpend =
    spendValues.length > 0
      ? spendValues.reduce((s, v) => s + v, 0)
      : null;

  // Top atoms in winners
  const winnerCreatives = withPerf.filter(
    (c) => c.performance!.performanceTier === "WINNER"
  );
  const atomCounts = new Map<string, { category: string; count: number }>();
  for (const c of winnerCreatives) {
    for (const atom of c.atoms) {
      const key = `${atom.category}:${atom.name}`;
      const existing = atomCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        atomCounts.set(key, { category: atom.category, count: 1 });
      }
    }
  }

  const topAtoms = Array.from(atomCounts.entries())
    .map(([key, val]) => ({
      name: key.split(":")[1],
      category: val.category,
      winRate:
        winnerCreatives.length > 0
          ? val.count / winnerCreatives.length
          : 0,
    }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 10);

  return {
    totalCreatives,
    byTier,
    avgRoas,
    totalSpend,
    topAtoms,
  };
}

export async function getCreativePerformance(creativeId: string) {
  return prisma.creativePerformance.findUnique({
    where: { creativeId },
  });
}

export async function getPerformanceByBoard(
  boardId: string,
  tier?: string
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

  const where: Prisma.CreativePerformanceWhereInput = {
    creative: { brandId: { in: brandIds } },
  };

  if (tier) {
    where.performanceTier = tier as PerformanceTier;
  }

  return prisma.creativePerformance.findMany({
    where,
    include: {
      creative: {
        select: {
          id: true,
          headline: true,
          screenshotUrl: true,
          thumbnailUrl: true,
          format: true,
          brand: { select: { name: true } },
        },
      },
    },
    orderBy: { roas: "desc" },
  });
}
