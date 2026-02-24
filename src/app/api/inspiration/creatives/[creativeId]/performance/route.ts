import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  manuallySetPerformance,
  getCreativePerformance,
} from "@/services/creative-performance.service";
import { performanceInputSchema } from "@/types/atoms";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ creativeId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creativeId } = await params;
  const body = await request.json();
  const parsed = performanceInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const performance = await manuallySetPerformance(creativeId, parsed.data);
  return NextResponse.json(performance);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ creativeId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creativeId } = await params;
  const performance = await getCreativePerformance(creativeId);
  return NextResponse.json(performance);
}
