import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { saveOnboarding, getClientBrands } from "@/services/onboarding.service";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brands = await getClientBrands(userId);
  return NextResponse.json(brands);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const result = await saveOnboarding({
    brandId: body.brandId,
    clientClerkId: userId,
    brandName: body.brandInfo?.companyName || "Unnamed Brand",
    currentStep: body.currentStep ?? 1,
    brandInfo: body.brandInfo ?? {},
    goals: body.goals ?? {},
    targetAudience: body.targetAudience ?? {},
    currentState: body.currentState ?? {},
    competitors: body.competitors ?? {},
    additionalNotes: body.additionalNotes,
    isComplete: body.isComplete ?? false,
  });

  return NextResponse.json(result);
}
