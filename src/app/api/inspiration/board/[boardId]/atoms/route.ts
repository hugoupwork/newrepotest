import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAtomsByBoard, analyzeBatchAtoms } from "@/services/atom-analysis.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const { searchParams } = request.nextUrl;

  const atoms = await getAtomsByBoard(boardId, {
    category: searchParams.get("category") ?? undefined,
    minConfidence: searchParams.get("minConfidence")
      ? parseFloat(searchParams.get("minConfidence")!)
      : undefined,
    search: searchParams.get("search") ?? undefined,
  });

  return NextResponse.json(atoms);
}

// POST to start batch analysis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const { creativeIds } = await request.json();

  if (!Array.isArray(creativeIds) || creativeIds.length === 0) {
    return NextResponse.json(
      { error: "creativeIds array required" },
      { status: 400 }
    );
  }

  // Create job
  const job = await prisma.atomAnalysisJob.create({
    data: {
      boardId,
      totalItems: creativeIds.length,
      creativeIds,
    },
  });

  // Start processing in background (fire and forget)
  analyzeBatchAtoms(job.id).catch(console.error);

  return NextResponse.json({ jobId: job.id, status: "PENDING" });
}
