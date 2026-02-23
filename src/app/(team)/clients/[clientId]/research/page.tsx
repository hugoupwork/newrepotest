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

export default async function ResearchPage({
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
      researchJobs: {
        orderBy: { createdAt: "desc" },
        include: {
          scrapedDataSet: {
            include: { items: { select: { id: true, isFlagged: true } } },
          },
        },
      },
    },
  });

  if (!brand) notFound();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{brand.name} — Research</h1>
        <p className="text-muted-foreground">
          Deep dive into consumer reviews, comments, and discussions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scraping Jobs</CardTitle>
          <CardDescription>
            Configure and run scraping across Amazon, Reddit, and Instagram.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brand.researchJobs.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No research jobs yet. The scraping integration (Phase 2) will
                allow you to pull data from Amazon reviews, Reddit, and
                Instagram.
              </p>
              <Badge variant="outline" className="mt-4">
                Apify integration coming in Phase 2
              </Badge>
            </div>
          ) : (
            <div className="space-y-3">
              {brand.researchJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {job.source.replace("_", " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {job.scrapedDataSet?.items.length ?? 0} items scraped
                    </p>
                  </div>
                  <Badge
                    variant={
                      job.status === "COMPLETED" ? "default" : "secondary"
                    }
                  >
                    {job.status}
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
