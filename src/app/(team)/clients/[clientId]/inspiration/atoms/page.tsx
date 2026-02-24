import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AtomAnalysisDashboard } from "@/components/inspiration/atom-analysis-dashboard";

export default async function AtomsPage({
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
      inspirationBoard: {
        select: { id: true },
      },
    },
  });

  if (!brand) redirect("/clients");

  const boardId = brand.inspirationBoard?.id;

  // Get creatives with atom analysis status
  let creatives: {
    id: string;
    headline: string | null;
    screenshotUrl: string | null;
    thumbnailUrl: string | null;
    format: string | null;
    atomAnalysisStatus: string | null;
    mediaDownloaded: boolean;
    brandName: string;
    atomCount: number;
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
      include: { _count: { select: { atoms: true } } },
      orderBy: { createdAt: "desc" },
    });

    creatives = rawCreatives.map((c) => ({
      id: c.id,
      headline: c.headline,
      screenshotUrl: c.screenshotUrl,
      thumbnailUrl: c.thumbnailUrl,
      format: c.format,
      atomAnalysisStatus: c.atomAnalysisStatus,
      mediaDownloaded: c.mediaDownloaded,
      brandName: brandMap.get(c.brandId) ?? "",
      atomCount: c._count.atoms,
    }));
  }

  // Get active jobs
  const activeJobs = boardId
    ? await prisma.atomAnalysisJob.findMany({
        where: { boardId, status: { in: ["PENDING", "RUNNING"] } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Atom Analysis</h1>
        <p className="text-muted-foreground">
          Break down ad creatives into atomic elements using Gemini AI
        </p>
      </div>

      <AtomAnalysisDashboard
        boardId={boardId ?? ""}
        creatives={creatives}
        activeJobs={activeJobs.map((j) => ({
          id: j.id,
          status: j.status,
          totalItems: j.totalItems,
          processedItems: j.processedItems,
          failedItems: j.failedItems,
        }))}
      />
    </div>
  );
}
