import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { saveAdCreatives } from "@/services/ad-creative.service";
import { adCreativeSchema } from "@/types/inspiration";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId } = await params;
  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "20");

  const [creatives, total] = await Promise.all([
    prisma.adCreative.findMany({
      where: { brandId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adCreative.count({ where: { brandId } }),
  ]);

  return NextResponse.json({ creatives, total, page, limit });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandId } = await params;
  const body = await request.json();
  const parsed = adCreativeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const creatives = await saveAdCreatives(brandId, [parsed.data]);
  return NextResponse.json(creatives[0], { status: 201 });
}
