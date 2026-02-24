import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  downloadCreativeMedia,
  getMediaAssets,
} from "@/services/media-download.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ creativeId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creativeId } = await params;

  try {
    const assets = await downloadCreativeMedia(creativeId);
    return NextResponse.json({ assets });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ creativeId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creativeId } = await params;
  const assets = await getMediaAssets(creativeId);
  return NextResponse.json(assets);
}
