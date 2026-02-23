import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function TeamDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const brandCount = await prisma.brand.count();
  const onboardingCount = await prisma.brand.count({
    where: { status: "ONBOARDING" },
  });
  const activeCount = await prisma.brand.count({
    where: { status: { in: ["RESEARCH", "ANALYSIS", "STRATEGY", "ACTIVE"] } },
  });
  const recentBrands = await prisma.brand.findMany({
    take: 5,
    orderBy: { updatedAt: "desc" },
    include: { client: true },
  });

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all client engagements.
          </p>
        </div>
        <Button asChild>
          <Link href="/clients">View All Clients</Link>
        </Button>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Brands</CardDescription>
            <CardTitle className="text-3xl">{brandCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Onboarding</CardDescription>
            <CardTitle className="text-3xl">{onboardingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Brands</CardTitle>
          <CardDescription>Latest client activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBrands.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No brands yet. Clients will appear here after they sign up and
              begin onboarding.
            </p>
          ) : (
            <div className="space-y-3">
              {recentBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/clients/${brand.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{brand.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {brand.client.firstName} {brand.client.lastName} —{" "}
                      {brand.client.email}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                    {brand.status.replace("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
