import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrCreateBoard, getLayerByBoardAndType } from "@/services/inspiration.service";
import { LAYER_SLUG_TO_TYPE } from "@/types/inspiration";
import type { InspirationLayerSlug } from "@/types/inspiration";
import { LAYER_CONFIGS } from "@/config/inspiration-layers";
import { BrandList } from "@/components/inspiration/brand-list";
import { TrendList } from "@/components/inspiration/trend-list";
import { AdCreativeGallery } from "@/components/inspiration/ad-creative-gallery";
import { LayerConfigPanel } from "@/components/inspiration/layer-config-panel";
import { AiBrandSuggestions } from "@/components/inspiration/ai-brand-suggestions";
import { LayerAiSummary } from "@/components/inspiration/layer-ai-summary";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function LayerDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; layerType: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { clientId, layerType: slug } = await params;

  const layerTypeEnum = LAYER_SLUG_TO_TYPE[slug as InspirationLayerSlug];
  if (!layerTypeEnum) notFound();

  const brand = await prisma.brand.findUnique({ where: { id: clientId } });
  if (!brand) notFound();

  const board = await getOrCreateBoard(clientId);
  if (!board) notFound();

  const layer = await getLayerByBoardAndType(board.id, layerTypeEnum);
  if (!layer) notFound();

  const config = LAYER_CONFIGS.find((c) => c.type === layerTypeEnum);
  const isTrendLayer = layerTypeEnum === "TREND_SPOTTER";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerAny = layer as any;
  const brands = layerAny.brands ?? [];
  const trends = layerAny.trends ?? [];

  // Flatten all creatives for the gallery
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCreatives = brands.flatMap((b: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (b.adCreatives ?? []).map((c: any) => ({
      ...c,
      brandName: b.name,
      aiAnalysis: c.aiAnalysis ?? null,
    }))
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              Layer {config?.number}: {config?.title ?? slug}
            </h1>
            <Badge variant="secondary">{layer.status}</Badge>
          </div>
          <p className="text-muted-foreground">
            {config?.description ?? ""}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/clients/${clientId}/inspiration`}>
            Back to Hub
          </Link>
        </Button>
      </div>

      {/* Layer Configuration */}
      <div className="mb-6">
        <LayerConfigPanel
          layerId={layer.id}
          layerType={layerTypeEnum}
          currentLabel={layer.label}
          currentDescription={layer.description}
          currentDesireKeyword={layer.desireKeyword}
          currentDemographic={layer.demographic}
        />
      </div>

      {isTrendLayer ? (
        /* Layer 5: Trends */
        <div className="space-y-6">
          <TrendList
            layerId={layer.id}
            trends={trends}
            clientId={clientId}
          />
        </div>
      ) : (
        /* Layers 1-4: Brands + Ads */
        <div className="space-y-8">
          {/* AI Suggestions */}
          <AiBrandSuggestions
            layerId={layer.id}
            layerType={layerTypeEnum}
          />

          {/* Brand List */}
          <BrandList
            layerId={layer.id}
            brands={brands}
          />

          {/* Ad Creative Gallery for this layer */}
          {allCreatives.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Ad Creatives ({allCreatives.length})
              </h2>
              <AdCreativeGallery
                creatives={allCreatives}
                showFilters
              />
            </div>
          )}

          {/* Layer AI Summary */}
          {allCreatives.length > 0 && (
            <LayerAiSummary
              layerId={layer.id}
              boardId={board.id}
              layerType={layerTypeEnum}
            />
          )}
        </div>
      )}
    </div>
  );
}
