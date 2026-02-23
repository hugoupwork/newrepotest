import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StrategyPage({
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
      strategies: {
        orderBy: { createdAt: "desc" },
        include: {
          decisions: {
            include: { madeBy: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!brand) notFound();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{brand.name} — Strategy</h1>
        <p className="text-muted-foreground">
          AI recommendations and human decisions for brand growth.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategy Recommendations</CardTitle>
          <CardDescription>
            AI generates prioritized strategy suggestions. Your team reviews,
            approves, or modifies them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brand.strategies.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No strategies yet. Complete research and analysis first, then
                generate AI-powered strategy recommendations.
              </p>
              <Badge variant="outline" className="mt-4">
                Strategy engine coming in Phase 5
              </Badge>
            </div>
          ) : (
            <div className="space-y-4">
              {brand.strategies.map((strategy) => (
                <div key={strategy.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{strategy.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {strategy.category} — {strategy.source}
                      </p>
                    </div>
                    <Badge>{strategy.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-2 text-sm">{strategy.description}</p>
                  {strategy.aiRationale && (
                    <p className="mt-1 text-sm italic text-muted-foreground">
                      AI Rationale: {strategy.aiRationale}
                    </p>
                  )}
                  {strategy.decisions.length > 0 && (
                    <div className="mt-3 border-t pt-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Decisions:
                      </p>
                      {strategy.decisions.map((d) => (
                        <div
                          key={d.id}
                          className="mt-1 text-xs text-muted-foreground"
                        >
                          {d.madeBy.firstName} — {d.action}
                          {d.rationale ? `: ${d.rationale}` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
