"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle } from "lucide-react";

interface BatchAnalysisProgressProps {
  job: {
    id: string;
    status: string;
    totalItems: number;
    processedItems: number;
    failedItems: number;
  };
  boardId: string;
}

export function BatchAnalysisProgress({
  job: initialJob,
  boardId,
}: BatchAnalysisProgressProps) {
  const [job, setJob] = useState(initialJob);

  useEffect(() => {
    if (job.status === "COMPLETED" || job.status === "FAILED") return;

    const interval = setInterval(async () => {
      const res = await fetch(
        `/api/inspiration/board/${boardId}/atoms/job/${job.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setJob(data);
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [job.id, job.status, boardId]);

  const progress =
    job.totalItems > 0
      ? ((job.processedItems + job.failedItems) / job.totalItems) * 100
      : 0;

  const isComplete = job.status === "COMPLETED" || job.status === "FAILED";

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-3">
        {isComplete ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        )}
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">
              {isComplete ? "Analysis Complete" : "Analyzing Creatives..."}
            </span>
            <span className="text-muted-foreground">
              {job.processedItems}/{job.totalItems}
              {job.failedItems > 0 && ` (${job.failedItems} failed)`}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
