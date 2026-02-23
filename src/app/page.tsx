import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    // Route based on user role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (user?.role === "TEAM_MEMBER" || user?.role === "ADMIN") {
      redirect("/dashboard");
    }
    redirect("/my-dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Evolve Method</h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          AI-powered brand growth strategy tool. Research, analyze, and make
          informed decisions — without data overload.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/sign-up">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
