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

export default async function AdsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Meta Ads Performance</h1>
        <p className="text-muted-foreground">
          Live ad performance data from Meta Marketing API.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ad Performance Dashboard</CardTitle>
          <CardDescription>
            Connect your Meta ad account to see live KPIs, champion ad sets,
            and performance trends.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Meta Ads integration is planned for Phase 2. Once connected, you
              will see CTR, ROAS, CPM, CPA, and other KPIs here.
            </p>
            <Badge variant="outline" className="mt-4">
              Coming in Phase 6
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
