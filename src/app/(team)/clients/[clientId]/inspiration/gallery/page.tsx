import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdCreativesByFilter } from "@/services/ad-creative.service";
import { AdCreativeGallery } from "@/components/inspiration/ad-creative-gallery";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { clientId } = await params;
  const filters = await searchParams;

  const brand = await prisma.brand.findUnique({ where: { id: clientId } });
  if (!brand) notFound();

  const board = await prisma.inspirationBoard.findUnique({
    where: { brandId: clientId },
  });

  if (!board) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Creative Gallery</h1>
        <p className="mt-4 text-muted-foreground">
          Visit the Inspiration hub first to initialize your board.
        </p>
        <Button asChild className="mt-4">
          <Link href={`/clients/${clientId}/inspiration`}>Go to Hub</Link>
        </Button>
      </div>
    );
  }

  const creatives = await getAdCreativesByFilter(board.id, {
    layerType: filters.layerType,
    format: filters.format,
    hookType: filters.hookType,
    ctaStyle: filters.ctaStyle,
    emotionalAppeal: filters.emotionalAppeal,
    tagSearch: filters.tag,
  });

  const creativesWithBrandName = creatives.map((c) => ({
    ...c,
    brandName: c.brand.name,
    aiAnalysis: c.aiAnalysis as Record<string, unknown> | null,
  }));

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Creative Gallery</h1>
          <p className="text-muted-foreground">
            {brand.name} — All ad creatives across all layers ({creatives.length} total)
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/clients/${clientId}/inspiration`}>Back to Hub</Link>
        </Button>
      </div>

      <AdCreativeGallery
        creatives={creativesWithBrandName}
        showFilters
      />
    </div>
  );
}
