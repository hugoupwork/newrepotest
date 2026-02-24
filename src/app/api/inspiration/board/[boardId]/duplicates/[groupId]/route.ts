import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { updateDuplicateGroup } from "@/services/deduplication.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; groupId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await params;
  const { status } = await request.json();

  if (!["CONFIRMED", "DISMISSED"].includes(status)) {
    return NextResponse.json(
      { error: "Status must be CONFIRMED or DISMISSED" },
      { status: 400 }
    );
  }

  const group = await updateDuplicateGroup(groupId, status);
  return NextResponse.json(group);
}
