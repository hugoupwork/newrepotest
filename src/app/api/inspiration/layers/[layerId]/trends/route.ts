import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { saveTrendItem, removeTrendItem } from "@/services/inspiration.service";
import { trendItemSchema } from "@/types/inspiration";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ layerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { layerId } = await params;
  const trends = await prisma.trendItem.findMany({
    where: { layerId },
    orderBy: { relevanceScore: "desc" },
  });

  return NextResponse.json(trends);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ layerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { layerId } = await params;
  const body = await request.json();
  const parsed = trendItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const trend = await saveTrendItem(layerId, parsed.data);
  return NextResponse.json(trend, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trendId = request.nextUrl.searchParams.get("trendId");
  if (!trendId) return NextResponse.json({ error: "trendId required" }, { status: 400 });

  await removeTrendItem(trendId);
  return NextResponse.json({ success: true });
}
