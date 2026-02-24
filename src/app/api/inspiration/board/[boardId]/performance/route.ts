import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  computePerformanceTiers,
  getPerformanceSummary,
  getPerformanceByBoard,
} from "@/services/creative-performance.service";

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
  const tier = searchParams.get("tier") ?? undefined;

  if (view === "summary") {
    const summary = await getPerformanceSummary(boardId);
    return NextResponse.json(summary);
  }

  const performances = await getPerformanceByBoard(boardId, tier);
  return NextResponse.json(performances);
}

// POST to recompute tiers
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const result = await computePerformanceTiers(boardId);
  return NextResponse.json(result);
}
