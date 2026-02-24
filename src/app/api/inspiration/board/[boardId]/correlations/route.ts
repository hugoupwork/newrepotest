import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  correlateAtomsWithPerformance,
  getCorrelations,
  getWinningAtoms,
  getLosingAtoms,
  generateCorrelationInsights,
} from "@/services/atom-correlation.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const { searchParams } = request.nextUrl;
  const view = searchParams.get("view");

  if (view === "insights") {
    const insights = await generateCorrelationInsights(boardId);
    return NextResponse.json(insights);
  }

  if (view === "winning") {
    const winning = await getWinningAtoms(boardId);
    return NextResponse.json(winning);
  }

  if (view === "losing") {
    const losing = await getLosingAtoms(boardId);
    return NextResponse.json(losing);
  }

  const correlations = await getCorrelations(boardId);
  return NextResponse.json(correlations);
}

// POST to compute correlations
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const correlations = await correlateAtomsWithPerformance(boardId);
  return NextResponse.json({
    correlations,
    count: correlations.length,
  });
}
