import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Find user and their most recent brand with onboarding data
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      clientBrands: {
        include: { onboarding: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  const brand = user?.clientBrands[0];
  const onboarding = brand?.onboarding;

  const initialData = onboarding
    ? {
        brandId: brand.id,
        currentStep: onboarding.currentStep,
        brandInfo: onboarding.brandInfo as Record<string, string>,
        goals: onboarding.goals as Record<string, string>,
        targetAudience: onboarding.targetAudience as Record<string, string>,
        currentState: onboarding.currentState as Record<string, string>,
        competitors: (onboarding.competitors as Record<string, string>) ?? {},
        additionalNotes: onboarding.additionalNotes ?? "",
      }
    : undefined;

  return (
    <div className="p-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Brand Onboarding</h1>
        <p className="text-muted-foreground">
          {onboarding?.isComplete
            ? "Your onboarding is complete. You can update your answers below."
            : "Tell us about your brand so we can build your growth strategy."}
        </p>
      </div>
      <OnboardingWizard initialData={initialData} />
    </div>
  );
}
