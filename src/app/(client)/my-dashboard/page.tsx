import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClientDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome to Evolve</h1>
        <p className="text-muted-foreground">
          Your brand growth journey starts here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Onboarding
              <Badge variant="secondary">Step 1</Badge>
            </CardTitle>
            <CardDescription>
              Complete your brand onboarding questionnaire to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/onboarding"
              className="text-sm font-medium text-primary hover:underline"
            >
              Start Onboarding →
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Research</CardTitle>
            <CardDescription>
              Deep dive into consumer insights from Amazon, Reddit, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">Coming after onboarding</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Your Master Document and Growth Guide will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">Coming soon</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
