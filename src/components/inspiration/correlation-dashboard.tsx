"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCcw, TrendingUp, TrendingDown } from "lucide-react";
import { ATOM_CATEGORIES } from "@/config/atom-taxonomy";

interface Correlation {
  id: string;
  atomCategory: string;
  atomName: string;
  winnerCount: number;
  nonSpenderCount: number;
  totalOccurrences: number;
  correlationStrength: number | null;
  avgPerformanceScore: number | null;
}

interface Insight {
  winningPatterns: { pattern: string; strength: number; examples: string[] }[];
  losingPatterns: { pattern: string; strength: number; examples: string[] }[];
  recommendations: string[];
  summary: string;
}

interface CorrelationDashboardProps {
  boardId: string;
  correlations: Correlation[];
}

export function CorrelationDashboard({
  boardId,
  correlations: initialCorrelations,
}: CorrelationDashboardProps) {
  const [correlations, setCorrelations] = useState(initialCorrelations);
  const [insights, setInsights] = useState<Insight | null>(null);
  const [computing, setComputing] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const winning = correlations.filter(
    (c) => c.correlationStrength != null && c.correlationStrength > 0
  );
  const losing = correlations.filter(
    (c) => c.correlationStrength != null && c.correlationStrength < 0
  );

  async function handleCompute() {
    setComputing(true);
    try {
      const res = await fetch(
        `/api/inspiration/board/${boardId}/correlations`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setCorrelations(data.correlations);
      }
    } finally {
      setComputing(false);
    }
  }

  async function handleGetInsights() {
    setLoadingInsights(true);
    try {
      const res = await fetch(
        `/api/inspiration/board/${boardId}/correlations?view=insights`
      );
      if (res.ok) {
        setInsights(await res.json());
      }
    } finally {
      setLoadingInsights(false);
    }
  }

  function getCategoryLabel(value: string) {
    return ATOM_CATEGORIES.find((c) => c.value === value)?.label ?? value;
  }

  function strengthBar(strength: number) {
    const width = Math.abs(strength) * 100;
    const isPositive = strength > 0;
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-24 rounded-full bg-muted">
          <div
            className={`h-2 rounded-full ${
              isPositive ? "bg-green-500" : "bg-red-500"
            }`}
            style={{ width: `${width}%` }}
          />
        </div>
        <span className="text-xs">
          {isPositive ? "+" : ""}
          {(strength * 100).toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleCompute} disabled={computing}>
          {computing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          {correlations.length > 0 ? "Recompute" : "Compute"} Correlations
        </Button>
        {correlations.length > 0 && (
          <Button
            variant="outline"
            onClick={handleGetInsights}
            disabled={loadingInsights}
          >
            {loadingInsights ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            Generate AI Insights
          </Button>
        )}
      </div>

      {/* AI Insights */}
      {insights && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">AI-Generated Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{insights.summary}</p>
            {insights.recommendations.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Recommendations:</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {insights.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Side by Side */}
      {correlations.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Winning Atoms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Winning Atoms ({winning.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {winning.slice(0, 15).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {getCategoryLabel(c.atomCategory)}
                      </Badge>
                      <span className="text-sm font-medium">
                        {c.atomName.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.winnerCount} winners / {c.totalOccurrences} total
                    </p>
                  </div>
                  {c.correlationStrength != null &&
                    strengthBar(c.correlationStrength)}
                </div>
              ))}
              {winning.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No winning atoms found yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Losing Atoms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Losing Atoms ({losing.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {losing.slice(0, 15).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {getCategoryLabel(c.atomCategory)}
                      </Badge>
                      <span className="text-sm font-medium">
                        {c.atomName.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.nonSpenderCount} non-spenders / {c.totalOccurrences}{" "}
                      total
                    </p>
                  </div>
                  {c.correlationStrength != null &&
                    strengthBar(c.correlationStrength)}
                </div>
              ))}
              {losing.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No losing atoms found yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {correlations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No correlations computed yet. Make sure you have creatives with both
              atom analysis and performance data, then click Compute Correlations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
