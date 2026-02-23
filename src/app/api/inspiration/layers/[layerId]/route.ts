import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getLayerWithDetails, updateLayerConfig } from "@/services/inspiration.service";
import { layerConfigSchema } from "@/types/inspiration";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ layerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { layerId } = await params;
  const layer = await getLayerWithDetails(layerId);

  if (!layer) return NextResponse.json({ error: "Layer not found" }, { status: 404 });
  return NextResponse.json(layer);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ layerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { layerId } = await params;
  const body = await request.json();
  const parsed = layerConfigSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const layer = await updateLayerConfig(layerId, parsed.data);
  return NextResponse.json(layer);
}
