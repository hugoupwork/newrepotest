import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getAdCreative, updateAdCreative, deleteAdCreative } from "@/services/ad-creative.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ creativeId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creativeId } = await params;
  const creative = await getAdCreative(creativeId);

  if (!creative) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(creative);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ creativeId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creativeId } = await params;
  const body = await request.json();

  const creative = await updateAdCreative(creativeId, body);
  return NextResponse.json(creative);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ creativeId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creativeId } = await params;
  await deleteAdCreative(creativeId);
  return NextResponse.json({ success: true });
}
