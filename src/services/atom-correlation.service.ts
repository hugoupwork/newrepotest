import { prisma } from "@/lib/prisma";
import { analyzeWithClaude } from "@/lib/claude";
import { CORRELATION_INSIGHT_PROMPT } from "@/config/atom-prompts";
import type { CorrelationInsightReport } from "@/types/atoms";
import type { AtomCategory, Prisma } from "@/generated/prisma/client";

export async function correlateAtomsWithPerformance(boardId: string) {
  // Get all creatives with both atoms and performance data
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
    where: {
      brandId: { in: brandIds },
      performance: { isNot: null },
      atoms: { some: {} },
    },
    include: {
      performance: true,
      atoms: true,
    },
  });

  if (creatives.length === 0) return [];

  // Build atom-performance map
  const atomStats = new Map<
    string,
    {
      category: AtomCategory;
      name: string;
      winnerCount: number;
      strongCount: number;
      averageCount: number;
      weakCount: number;
      nonSpenderCount: number;
      totalOccurrences: number;
      roasValues: number[];
    }
  >();

  for (const creative of creatives) {
    const tier = creative.performance?.performanceTier;
    const roas = creative.performance?.roas;

    for (const atom of creative.atoms) {
      const key = `${atom.category}:${atom.name}`;
      if (!atomStats.has(key)) {
        atomStats.set(key, {
          category: atom.category,
          name: atom.name,
          winnerCount: 0,
          strongCount: 0,
          averageCount: 0,
          weakCount: 0,
          nonSpenderCount: 0,
          totalOccurrences: 0,
          roasValues: [],
        });
      }
      const stats = atomStats.get(key)!;
      stats.totalOccurrences++;

      if (tier === "WINNER") stats.winnerCount++;
      else if (tier === "STRONG") stats.strongCount++;
      else if (tier === "AVERAGE") stats.averageCount++;
      else if (tier === "WEAK") stats.weakCount++;
      else if (tier === "NON_SPENDER") stats.nonSpenderCount++;

      if (roas != null) stats.roasValues.push(roas);
    }
  }

  // Delete old correlations for this board
  await prisma.atomPerformanceCorrelation.deleteMany({
    where: { boardId },
  });

  // Compute correlation strength and save
  const correlations = [];
  for (const [, stats] of atomStats) {
    const total = stats.totalOccurrences;
    if (total < 2) continue; // Need at least 2 occurrences

    // Correlation strength: (winner% - nonSpender%) normalized
    const winRate = stats.winnerCount / total;
    const loseRate = stats.nonSpenderCount / total;
    const correlationStrength = winRate - loseRate; // -1 to 1

    const avgRoas =
      stats.roasValues.length > 0
        ? stats.roasValues.reduce((s, v) => s + v, 0) /
          stats.roasValues.length
        : null;

    const correlation = await prisma.atomPerformanceCorrelation.create({
      data: {
        boardId,
        atomCategory: stats.category,
        atomName: stats.name,
        winnerCount: stats.winnerCount,
        nonSpenderCount: stats.nonSpenderCount,
        totalOccurrences: stats.totalOccurrences,
        avgPerformanceScore: avgRoas,
        correlationStrength,
        sampleSize: total,
      },
    });
    correlations.push(correlation);
  }

  return correlations;
}

export async function getWinningAtoms(boardId: string) {
  return prisma.atomPerformanceCorrelation.findMany({
    where: {
      boardId,
      correlationStrength: { gt: 0 },
    },
    orderBy: { correlationStrength: "desc" },
    take: 20,
  });
}

export async function getLosingAtoms(boardId: string) {
  return prisma.atomPerformanceCorrelation.findMany({
    where: {
      boardId,
      correlationStrength: { lt: 0 },
    },
    orderBy: { correlationStrength: "asc" },
    take: 20,
  });
}

export async function getCorrelations(boardId: string) {
  return prisma.atomPerformanceCorrelation.findMany({
    where: { boardId },
    orderBy: { correlationStrength: "desc" },
  });
}

export async function generateCorrelationInsights(
  boardId: string
): Promise<CorrelationInsightReport> {
  const winning = await getWinningAtoms(boardId);
  const losing = await getLosingAtoms(boardId);
  const all = await getCorrelations(boardId);

  const totalCreatives = all.reduce(
    (max, c) => Math.max(max, c.sampleSize),
    0
  );

  const prompt = CORRELATION_INSIGHT_PROMPT.replace(
    "{winningAtoms}",
    JSON.stringify(
      winning.map((w) => ({
        category: w.atomCategory,
        name: w.atomName,
        strength: w.correlationStrength,
        winnerCount: w.winnerCount,
        totalOccurrences: w.totalOccurrences,
      }))
    )
  )
    .replace(
      "{losingAtoms}",
      JSON.stringify(
        losing.map((l) => ({
          category: l.atomCategory,
          name: l.atomName,
          strength: l.correlationStrength,
          nonSpenderCount: l.nonSpenderCount,
          totalOccurrences: l.totalOccurrences,
        }))
      )
    )
    .replace(
      "{stats}",
      JSON.stringify({
        totalAtomTypes: all.length,
        totalCreativesAnalyzed: totalCreatives,
        winningAtomCount: winning.length,
        losingAtomCount: losing.length,
      })
    );

  const { text } = await analyzeWithClaude({
    systemPrompt:
      "You are a performance marketing analyst. Return ONLY valid JSON.",
    userPrompt: prompt,
  });

  try {
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    return JSON.parse(cleaned);
  } catch {
    return {
      winningPatterns: [],
      losingPatterns: [],
      recommendations: ["Unable to generate insights — insufficient data"],
      summary: text,
    };
  }
}
