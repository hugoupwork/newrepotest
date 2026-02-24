import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  findDuplicates,
  getDuplicateGroups,
} from "@/services/deduplication.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const groups = await getDuplicateGroups(boardId);
  return NextResponse.json(groups);
}

// POST to run deduplication detection
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;
  const groups = await findDuplicates(boardId);
  return NextResponse.json({ groups, count: groups.length });
}
