import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getLayerWithDetails, saveTrendItem } from "@/services/inspiration.service";
import {
  discoverTrends,
  extractBrandContext,
} from "@/services/inspiration-ai.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ layerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { layerId } = await params;
  const layer = await getLayerWithDetails(layerId);

  if (!layer) return NextResponse.json({ error: "Layer not found" }, { status: 404 });

  const onboarding = layer.board.brand.onboarding;
  if (!onboarding) {
    return NextResponse.json(
      { error: "Complete onboarding first" },
      { status: 400 }
    );
  }

  const brandContext = extractBrandContext(onboarding);
  const result = await discoverTrends(brandContext);

  // Save discovered trends
  const savedTrends = [];
  for (const trend of result.trends) {
    const saved = await saveTrendItem(layerId, {
      title: trend.title,
      description: trend.description,
      sourceName: trend.sourceName,
      category: trend.category,
      relevanceScore: trend.relevanceScore,
      aiRelevanceNotes: trend.relevanceExplanation,
      aiAdaptation: trend.adaptationIdeas?.join("\n") ?? undefined,
      sourceUrl: trend.url,
    });
    savedTrends.push(saved);
  }

  return NextResponse.json({ trends: savedTrends, count: savedTrends.length });
}
