import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const statusColors: Record<string, "default" | "secondary" | "outline"> = {
  ONBOARDING: "outline",
  RESEARCH: "secondary",
  ANALYSIS: "secondary",
  STRATEGY: "secondary",
  ACTIVE: "default",
  PAUSED: "outline",
  COMPLETED: "default",
};

export default async function ClientsListPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const brands = await prisma.brand.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      client: true,
      onboarding: { select: { isComplete: true } },
    },
  });

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-muted-foreground">
          All client brands and their engagement status.
        </p>
      </div>

      {brands.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No clients yet</CardTitle>
            <CardDescription>
              When clients sign up and begin onboarding, they will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link key={brand.id} href={`/clients/${brand.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{brand.name}</CardTitle>
                    <Badge variant={statusColors[brand.status] ?? "outline"}>
                      {brand.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardDescription>
                    {brand.client.firstName} {brand.client.lastName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {brand.client.email}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Onboarding:{" "}
                    {brand.onboarding?.isComplete ? "Complete" : "In progress"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
