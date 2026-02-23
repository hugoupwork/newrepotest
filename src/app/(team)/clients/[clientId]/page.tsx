import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClipboardList,
  Search,
  Brain,
  FileText,
  Target,
  BarChart3,
} from "lucide-react";

export default async function ClientOverviewPage({
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
      client: true,
      onboarding: true,
      researchJobs: { select: { id: true, status: true } },
      analysisRuns: { select: { id: true, status: true } },
      documents: { select: { id: true, type: true } },
      strategies: { select: { id: true, status: true } },
    },
  });

  if (!brand) notFound();

  const modules = [
    {
      title: "Onboarding",
      href: `/clients/${clientId}/onboarding`,
      icon: ClipboardList,
      status: brand.onboarding?.isComplete ? "Complete" : "In Progress",
      description: "Client brand questionnaire",
    },
    {
      title: "Research",
      href: `/clients/${clientId}/research`,
      icon: Search,
      status: `${brand.researchJobs.length} jobs`,
      description: "Amazon, Reddit, Instagram scraping",
    },
    {
      title: "Analysis",
      href: `/clients/${clientId}/analysis`,
      icon: Brain,
      status: `${brand.analysisRuns.length} runs`,
      description: "AI-powered consumer insights",
    },
    {
      title: "Documents",
      href: `/clients/${clientId}/documents`,
      icon: FileText,
      status: `${brand.documents.length} docs`,
      description: "Master Document & Growth Guide",
    },
    {
      title: "Strategy",
      href: `/clients/${clientId}/strategy`,
      icon: Target,
      status: `${brand.strategies.length} strategies`,
      description: "Recommendations & decisions",
    },
    {
      title: "Ads",
      href: `/clients/${clientId}/ads`,
      icon: BarChart3,
      status: "Phase 2",
      description: "Meta Ads performance",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{brand.name}</h1>
            <Badge>{brand.status.replace("_", " ")}</Badge>
          </div>
          <p className="text-muted-foreground">
            {brand.client.firstName} {brand.client.lastName} —{" "}
            {brand.client.email}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/clients">Back to Clients</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <Link key={mod.href} href={mod.href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <mod.icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{mod.title}</CardTitle>
                </div>
                <CardDescription>{mod.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{mod.status}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
