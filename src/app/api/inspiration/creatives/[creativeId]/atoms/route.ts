import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  analyzeCreativeAtoms,
  getAtomsByCreative,
} from "@/services/atom-analysis.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ creativeId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creativeId } = await params;

  try {
    const atoms = await analyzeCreativeAtoms(creativeId);
    return NextResponse.json({ atoms });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ creativeId: string }> }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { creativeId } = await params;
  const atoms = await getAtomsByCreative(creativeId);
  return NextResponse.json(atoms);
}
