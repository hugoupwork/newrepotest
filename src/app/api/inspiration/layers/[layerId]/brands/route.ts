import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { addBrand, removeBrand, updateBrand } from "@/services/inspiration.service";
import { inspirationBrandSchema } from "@/types/inspiration";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ layerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { layerId } = await params;
  const brands = await prisma.inspirationBrand.findMany({
    where: { layerId },
    include: {
      adCreatives: { select: { id: true } },
      adLibraryScrapeJob: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(brands);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ layerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { layerId } = await params;
  const body = await request.json();
  const parsed = inspirationBrandSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const brand = await addBrand(layerId, parsed.data);
  return NextResponse.json(brand, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { brandId, ...data } = body;

  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  const brand = await updateBrand(brandId, data);
  return NextResponse.json(brand);
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = request.nextUrl.searchParams.get("brandId");
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  await removeBrand(brandId);
  return NextResponse.json({ success: true });
}
