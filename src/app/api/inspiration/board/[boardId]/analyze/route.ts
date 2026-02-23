import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  analyzeAdPatterns,
  extractBrandContext,
} from "@/services/inspiration-ai.service";
import { getAdCreativesByLayer } from "@/services/ad-creative.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const body = await request.json().catch(() => ({}));
  const { layerType } = body;

  const board = await prisma.inspirationBoard.findUnique({
    where: { id: boardId },
    include: {
      brand: { include: { onboarding: true } },
      layers: { select: { id: true, type: true } },
    },
  });

  if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });
  if (!board.brand.onboarding) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });
  }

  const brandContext = extractBrandContext(board.brand.onboarding);

  // Get creatives for the specified layer or all layers
  const targetLayers = layerType
    ? board.layers.filter((l) => l.type === layerType)
    : board.layers;

  const allCreatives = [];
  for (const layer of targetLayers) {
    const creatives = await getAdCreativesByLayer(layer.id);
    allCreatives.push(...creatives);
  }

  if (allCreatives.length === 0) {
    return NextResponse.json({ error: "No creatives to analyze" }, { status: 400 });
  }

  const analysis = await analyzeAdPatterns(
    allCreatives,
    layerType ?? "ALL_LAYERS",
    brandContext
  );

  return NextResponse.json(analysis);
}
