import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getLayerWithDetails } from "@/services/inspiration.service";
import {
  suggestBrandsForLayer,
  extractBrandContext,
} from "@/services/inspiration-ai.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ layerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { layerId } = await params;
  const layer = await getLayerWithDetails(layerId);

  if (!layer) return NextResponse.json({ error: "Layer not found" }, { status: 404 });

  const onboarding = layer.board.brand.onboarding;
  if (!onboarding) {
    return NextResponse.json(
      { error: "Complete onboarding first to use AI suggestions" },
      { status: 400 }
    );
  }

  const brandContext = extractBrandContext(onboarding);
  const existingBrands = layer.brands.map((b) => b.name);

  const result = await suggestBrandsForLayer(
    brandContext,
    layer.type,
    existingBrands,
    { desireKeyword: layer.desireKeyword ?? undefined, demographic: layer.demographic ?? undefined }
  );

  return NextResponse.json(result);
}
