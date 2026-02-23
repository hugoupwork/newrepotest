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
import { onboardingSteps } from "@/config/onboarding-questions";

export default async function TeamOnboardingViewPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { clientId } = await params;

  const brand = await prisma.brand.findUnique({
    where: { id: clientId },
    include: { client: true, onboarding: true },
  });

  if (!brand) notFound();
  const onboarding = brand.onboarding;

  if (!onboarding) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Onboarding</h1>
        <p className="mt-2 text-muted-foreground">
          The client has not started onboarding yet.
        </p>
      </div>
    );
  }

  const stepData: Record<string, unknown>[] = [
    onboarding.brandInfo as Record<string, unknown>,
    onboarding.goals as Record<string, unknown>,
    onboarding.targetAudience as Record<string, unknown>,
    onboarding.currentState as Record<string, unknown>,
    (onboarding.competitors as Record<string, unknown>) ?? {},
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {brand.name} — Onboarding
          </h1>
          <p className="text-muted-foreground">
            {brand.client.firstName} {brand.client.lastName}
          </p>
        </div>
        <Badge variant={onboarding.isComplete ? "default" : "secondary"}>
          {onboarding.isComplete
            ? "Complete"
            : `Step ${onboarding.currentStep} of ${onboardingSteps.length + 1}`}
        </Badge>
      </div>

      <div className="space-y-6">
        {onboardingSteps.map((step, idx) => {
          const data = stepData[idx] as Record<string, string> | undefined;
          return (
            <Card key={step.id}>
              <CardHeader>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {data && Object.keys(data).length > 0 ? (
                  <dl className="space-y-2">
                    {step.fields.map((field) => {
                      const val = data[field.name];
                      if (!val) return null;
                      return (
                        <div key={field.name}>
                          <dt className="text-sm font-medium text-muted-foreground">
                            {field.label}
                          </dt>
                          <dd className="text-sm">{val}</dd>
                        </div>
                      );
                    })}
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Not yet completed
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {onboarding.additionalNotes && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{onboarding.additionalNotes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
