"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendCard } from "./trend-card";
import { AddTrendDialog } from "./add-trend-dialog";
import { Loader2, Sparkles } from "lucide-react";

interface Trend {
  id: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  imageUrl: string | null;
  category: string | null;
  relevanceScore: number | null;
  aiAdaptation: string | null;
  aiRelevanceNotes: string | null;
  isRelevant: boolean;
}

interface TrendListProps {
  layerId: string;
  trends: Trend[];
  clientId: string;
}

export function TrendList({ layerId, trends: initialTrends }: TrendListProps) {
  const [trends, setTrends] = useState(initialTrends);
  const [showAdd, setShowAdd] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  async function handleDiscover() {
    setDiscovering(true);
    try {
      const res = await fetch(
        `/api/inspiration/layers/${layerId}/trends/scrape`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setTrends((prev) => [...data.trends, ...prev]);
      }
    } finally {
      setDiscovering(false);
    }
  }

  async function handleDismiss(trendId: string) {
    const res = await fetch(
      `/api/inspiration/layers/${layerId}/trends?trendId=${trendId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setTrends((prev) => prev.filter((t) => t.id !== trendId));
    }
  }

  function handleAdded(trend: unknown) {
    setTrends((prev) => [trend as Trend, ...prev]);
    setShowAdd(false);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trends ({trends.length})</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleDiscover}
            disabled={discovering}
            variant="outline"
            size="sm"
          >
            {discovering ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {discovering ? "Discovering..." : "Discover Trends"}
          </Button>
          <Button onClick={() => setShowAdd(true)} size="sm">
            Add Trend
          </Button>
        </div>
      </div>

      {trends.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No trends yet. Use AI discovery or add trends manually.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {trends
            .filter((t) => t.isRelevant)
            .map((trend) => (
              <TrendCard
                key={trend.id}
                trend={trend}
                onDismiss={() => handleDismiss(trend.id)}
              />
            ))}
        </div>
      )}

      {showAdd && (
        <AddTrendDialog
          layerId={layerId}
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
