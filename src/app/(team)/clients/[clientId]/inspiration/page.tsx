import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateBoard } from "@/services/inspiration.service";
import { LayerOverviewCard } from "@/components/inspiration/layer-overview-card";
import { LAYER_CONFIGS } from "@/config/inspiration-layers";
import { Button } from "@/components/ui/button";

export default async function InspirationHubPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { clientId } = await params;

  const brand = await prisma.brand.findUnique({ where: { id: clientId } });
  if (!brand) notFound();

  const board = await getOrCreateBoard(clientId);
  if (!board) notFound();

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Ad Inspiration Layers
          </h1>
          <p className="text-muted-foreground">
            {brand.name} — Systematic ad creative inspiration across 5 expanding layers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/clients/${clientId}/inspiration/gallery`}>
              Gallery View
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {LAYER_CONFIGS.map((config) => {
          const layer = board.layers.find((l) => l.type === config.type);
          const brandCount = layer?.brands.length ?? 0;
          const creativeCount =
            layer?.brands.reduce(
              (acc, b) => acc + b.adCreatives.length,
              0
            ) ?? 0;
          const trendCount = layer?.trends.length ?? 0;

          return (
            <LayerOverviewCard
              key={config.type}
              clientId={clientId}
              config={config}
              brandCount={brandCount}
              creativeCount={creativeCount}
              trendCount={trendCount}
              status={layer?.status ?? "PENDING"}
            />
          );
        })}
      </div>
    </div>
  );
}
