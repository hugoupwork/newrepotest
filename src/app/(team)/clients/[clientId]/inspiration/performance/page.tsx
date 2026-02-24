import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PerformanceDashboard } from "@/components/inspiration/performance-dashboard";

export default async function PerformancePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { clientId } = await params;

  const brand = await prisma.brand.findUnique({
    where: { id: clientId },
    include: {
      inspirationBoard: { select: { id: true } },
    },
  });

  if (!brand) redirect("/clients");

  const boardId = brand.inspirationBoard?.id;

  // Get creatives with performance data
  let creativesWithPerf: {
    id: string;
    headline: string | null;
    screenshotUrl: string | null;
    thumbnailUrl: string | null;
    format: string | null;
    brandName: string;
    performanceTier: string | null;
    spend: number | null;
    roas: number | null;
    impressions: number | null;
    clicks: number | null;
  }[] = [];

  if (boardId) {
    const layers = await prisma.inspirationLayer.findMany({
      where: { boardId },
      select: { id: true },
    });
    const layerIds = layers.map((l) => l.id);

    const brands = await prisma.inspirationBrand.findMany({
      where: { layerId: { in: layerIds } },
      select: { id: true, name: true },
    });

    const brandMap = new Map(brands.map((b) => [b.id, b.name]));
    const brandIds = brands.map((b) => b.id);

    const rawCreatives = await prisma.adCreative.findMany({
      where: { brandId: { in: brandIds } },
      include: { performance: true },
      orderBy: { createdAt: "desc" },
    });

    creativesWithPerf = rawCreatives.map((c) => ({
      id: c.id,
      headline: c.headline,
      screenshotUrl: c.screenshotUrl,
      thumbnailUrl: c.thumbnailUrl,
      format: c.format,
      brandName: brandMap.get(c.brandId) ?? "",
      performanceTier: c.performance?.performanceTier ?? null,
      spend: c.performance?.spend ?? null,
      roas: c.performance?.roas ?? null,
      impressions: c.performance?.impressions ?? null,
      clicks: c.performance?.clicks ?? null,
    }));
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>
        <p className="text-muted-foreground">
          Track ad creative performance and identify winners vs. non-spenders
        </p>
      </div>

      <PerformanceDashboard
        boardId={boardId ?? ""}
        creatives={creativesWithPerf}
      />
    </div>
  );
}
