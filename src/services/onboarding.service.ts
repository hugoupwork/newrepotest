import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

interface SaveOnboardingInput {
  brandId?: string;
  clientClerkId: string;
  brandName: string;
  currentStep: number;
  brandInfo: Prisma.InputJsonValue;
  goals: Prisma.InputJsonValue;
  targetAudience: Prisma.InputJsonValue;
  currentState: Prisma.InputJsonValue;
  competitors: Prisma.InputJsonValue;
  additionalNotes?: string;
  isComplete?: boolean;
}

export async function saveOnboarding(input: SaveOnboardingInput) {
  const user = await prisma.user.findUnique({
    where: { clerkId: input.clientClerkId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Create or update brand
  let brand;
  if (input.brandId) {
    brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
    if (!brand) throw new Error("Brand not found");
  } else {
    brand = await prisma.brand.create({
      data: {
        name: input.brandName || "Unnamed Brand",
        clientId: user.id,
      },
    });
  }

  // Upsert onboarding response
  const onboarding = await prisma.onboardingResponse.upsert({
    where: { brandId: brand.id },
    update: {
      brandInfo: input.brandInfo,
      goals: input.goals,
      targetAudience: input.targetAudience,
      currentState: input.currentState,
      competitors: input.competitors,
      additionalNotes: input.additionalNotes,
      currentStep: input.currentStep,
      isComplete: input.isComplete ?? false,
      completedAt: input.isComplete ? new Date() : undefined,
    },
    create: {
      brandId: brand.id,
      brandInfo: input.brandInfo,
      goals: input.goals,
      targetAudience: input.targetAudience,
      currentState: input.currentState,
      competitors: input.competitors,
      additionalNotes: input.additionalNotes,
      currentStep: input.currentStep,
      isComplete: input.isComplete ?? false,
      completedAt: input.isComplete ? new Date() : undefined,
    },
  });

  // Update brand name from onboarding data if provided
  const companyName =
    typeof input.brandInfo === "object" &&
    input.brandInfo !== null &&
    "companyName" in input.brandInfo
      ? (input.brandInfo.companyName as string)
      : null;

  if (companyName) {
    await prisma.brand.update({
      where: { id: brand.id },
      data: { name: companyName },
    });
  }

  // Advance brand status when onboarding completes
  if (input.isComplete) {
    await prisma.brand.update({
      where: { id: brand.id },
      data: { status: "RESEARCH" },
    });
  }

  return { brand, onboarding };
}

export async function getOnboarding(brandId: string) {
  return prisma.onboardingResponse.findUnique({
    where: { brandId },
    include: { brand: { include: { client: true } } },
  });
}

export async function getClientBrands(clerkId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      clientBrands: {
        include: { onboarding: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  return user?.clientBrands ?? [];
}
