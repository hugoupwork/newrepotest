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

export default async function AnalysisPage({
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
      analysisRuns: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!brand) notFound();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{brand.name} — Analysis</h1>
        <p className="text-muted-foreground">
          AI-powered insights from consumer research data.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Runs</CardTitle>
          <CardDescription>
            Claude AI analyzes scraped data to extract consumer insights,
            sentiment patterns, and growth opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brand.analysisRuns.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No analysis runs yet. Complete the research phase first, then
                run AI analysis on the collected data.
              </p>
              <Badge variant="outline" className="mt-4">
                Analysis engine coming in Phase 3
              </Badge>
            </div>
          ) : (
            <div className="space-y-3">
              {brand.analysisRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {run.type.replace("_", " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {run.tokenCount
                        ? `${run.tokenCount.toLocaleString()} tokens used`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      run.status === "COMPLETED" ? "default" : "secondary"
                    }
                  >
                    {run.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
