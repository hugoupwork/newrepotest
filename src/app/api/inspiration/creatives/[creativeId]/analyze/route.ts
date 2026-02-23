import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getAdCreative, setAdCreativeAnalysis } from "@/services/ad-creative.service";
import {
  analyzeAdCreative,
  extractBrandContext,
} from "@/services/inspiration-ai.service";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ creativeId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creativeId } = await params;
  const creative = await getAdCreative(creativeId);

  if (!creative) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get the brand context from onboarding
  const brandId = creative.brand.layer.board.brandId;
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { onboarding: true },
  });

  if (!brand?.onboarding) {
    return NextResponse.json(
      { error: "Complete onboarding first" },
      { status: 400 }
    );
  }

  const brandContext = extractBrandContext(brand.onboarding);

  const analysis = await analyzeAdCreative(
    creative,
    creative.brand.name,
    brandContext
  );

  // Save analysis back to the creative
  await setAdCreativeAnalysis(
    creativeId,
    analysis as unknown as Prisma.InputJsonValue,
    analysis.overallScore
  );

  return NextResponse.json(analysis);
}
