import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { scrapeAdLibrary, checkScrapeStatus } from "@/services/meta-ad-library.service";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId } = await params;

  const brand = await prisma.inspirationBrand.findUnique({
    where: { id: brandId },
  });

  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));

  const result = await scrapeAdLibrary(brandId, {
    pageId: brand.metaPageId ?? undefined,
    searchTerm: body.searchTerm ?? brand.name,
    country: body.country ?? "US",
    adType: body.adType ?? "active",
    maxResults: body.maxResults ?? 50,
  });

  return NextResponse.json(result);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId } = await params;

  const brand = await prisma.inspirationBrand.findUnique({
    where: { id: brandId },
    select: { adLibraryScrapeJobId: true },
  });

  if (!brand?.adLibraryScrapeJobId) {
    return NextResponse.json({ status: "NO_JOB" });
  }

  const status = await checkScrapeStatus(brand.adLibraryScrapeJobId);
  return NextResponse.json(status);
}
