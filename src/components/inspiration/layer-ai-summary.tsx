"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";

interface LayerAiSummaryProps {
  layerId: string;
  boardId: string;
  layerType: string;
}

interface SummaryData {
  dominantFormats?: { format: string; percentage: number; insight?: string }[];
  topHookTypes?: { hookType: string; frequency: number; effectiveness?: string }[];
  winningFormulas?: string[];
  gapOpportunities?: string[];
  gapsAndOpportunities?: string[];
  recommendedApproaches?: { approach: string; rationale: string; inspiredBy?: string }[];
  topInsights?: string[];
  creativeDirections?: { direction: string; inspiredBy: string; rationale: string }[];
}

export function LayerAiSummary({ boardId, layerType }: LayerAiSummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await fetch(`/api/inspiration/board/${boardId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layerType }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-lg font-semibold">Layer Insights</h2>
        <Button
          onClick={handleAnalyze}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {loading ? "Analyzing..." : summary ? "Re-analyze" : "Analyze Patterns"}
        </Button>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          {summary.topInsights && summary.topInsights.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {summary.topInsights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {summary.winningFormulas && summary.winningFormulas.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Winning Formulas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {summary.winningFormulas.map((formula, i) => (
                    <li key={i}>{formula}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(summary.gapOpportunities ?? summary.gapsAndOpportunities)?.length && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Gap Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {(summary.gapOpportunities ?? summary.gapsAndOpportunities ?? []).map(
                    (gap, i) => (
                      <li key={i}>{gap}</li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {summary.creativeDirections && summary.creativeDirections.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Creative Directions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.creativeDirections.map((dir, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium">{dir.direction}</p>
                      <p className="text-xs text-muted-foreground">
                        Inspired by: {dir.inspiredBy}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dir.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {summary.dominantFormats && summary.dominantFormats.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Format Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.dominantFormats.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{f.format}</span>
                      <span className="text-muted-foreground">{f.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
