import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getOrCreateBoard, getBoard } from "@/services/inspiration.service";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = request.nextUrl.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const board = await getBoard(brandId);
  return NextResponse.json(board);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId } = await request.json();
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const board = await getOrCreateBoard(brandId);
  return NextResponse.json(board);
}
