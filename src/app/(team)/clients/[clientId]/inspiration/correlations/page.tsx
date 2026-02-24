import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CorrelationDashboard } from "@/components/inspiration/correlation-dashboard";

export default async function CorrelationsPage({
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

  // Get existing correlations
  let correlations: {
    id: string;
    atomCategory: string;
    atomName: string;
    winnerCount: number;
    nonSpenderCount: number;
    totalOccurrences: number;
    correlationStrength: number | null;
    avgPerformanceScore: number | null;
  }[] = [];

  if (boardId) {
    const raw = await prisma.atomPerformanceCorrelation.findMany({
      where: { boardId },
      orderBy: { correlationStrength: "desc" },
    });
    correlations = raw.map((c) => ({
      id: c.id,
      atomCategory: c.atomCategory,
      atomName: c.atomName,
      winnerCount: c.winnerCount,
      nonSpenderCount: c.nonSpenderCount,
      totalOccurrences: c.totalOccurrences,
      correlationStrength: c.correlationStrength,
      avgPerformanceScore: c.avgPerformanceScore,
    }));
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Correlation Insights</h1>
        <p className="text-muted-foreground">
          Discover which creative atoms drive performance — winners vs.
          non-spenders
        </p>
      </div>

      <CorrelationDashboard
        boardId={boardId ?? ""}
        correlations={correlations}
      />
    </div>
  );
}
