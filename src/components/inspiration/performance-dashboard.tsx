"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCcw, Image as ImageIcon } from "lucide-react";
import { PerformanceTierBadge } from "./performance-tier-badge";
import { PerformanceInputForm } from "./performance-input-form";
import { PERFORMANCE_TIER_OPTIONS } from "@/config/atom-taxonomy";

interface Creative {
  id: string;
  headline: string | null;
  screenshotUrl: string | null;
  thumbnailUrl: string | null;
  format: string | null;
  brandName: string;
  performanceTier: string | null;
  spend: number | null;
  roas: number | null;
  impressions: number | null;
  clicks: number | null;
}

interface PerformanceDashboardProps {
  boardId: string;
  creatives: Creative[];
}

export function PerformanceDashboard({
  boardId,
  creatives,
}: PerformanceDashboardProps) {
  const [selectedCreative, setSelectedCreative] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);
  const [filterTier, setFilterTier] = useState<string>("");

  const withPerf = creatives.filter((c) => c.performanceTier && c.performanceTier !== "UNKNOWN");
  const withoutPerf = creatives.filter((c) => !c.performanceTier || c.performanceTier === "UNKNOWN");

  // Tier distribution
  const tierCounts: Record<string, number> = {};
  for (const c of creatives) {
    const tier = c.performanceTier ?? "UNKNOWN";
    tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
  }

  const filtered = filterTier
    ? creatives.filter((c) => c.performanceTier === filterTier)
    : creatives;

  async function handleRecompute() {
    setRecomputing(true);
    try {
      await fetch(`/api/inspiration/board/${boardId}/performance`, {
        method: "POST",
      });
      window.location.reload();
    } finally {
      setRecomputing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{creatives.length}</div>
            <p className="text-sm text-muted-foreground">Total Creatives</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{withPerf.length}</div>
            <p className="text-sm text-muted-foreground">With Performance Data</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{withoutPerf.length}</div>
            <p className="text-sm text-muted-foreground">Missing Data</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {tierCounts["WINNER"] ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">Winners</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Tier Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {PERFORMANCE_TIER_OPTIONS.map((tier) => {
              const count = tierCounts[tier.value] ?? 0;
              return (
                <button
                  key={tier.value}
                  onClick={() =>
                    setFilterTier(filterTier === tier.value ? "" : tier.value)
                  }
                  className={`flex flex-1 flex-col items-center rounded-lg border p-3 transition-colors ${
                    filterTier === tier.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="text-lg font-bold">{count}</span>
                  <PerformanceTierBadge tier={tier.value} />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleRecompute}
          disabled={recomputing}
        >
          {recomputing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Recompute Tiers
        </Button>
      </div>

      {/* Creatives List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((creative) => (
          <Card
            key={creative.id}
            className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
            onClick={() => setSelectedCreative(creative.id)}
          >
            <div className="relative h-32 bg-muted">
              {creative.thumbnailUrl || creative.screenshotUrl ? (
                <img
                  src={creative.thumbnailUrl ?? creative.screenshotUrl ?? ""}
                  alt={creative.headline ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
              {creative.performanceTier && (
                <div className="absolute right-2 top-2">
                  <PerformanceTierBadge tier={creative.performanceTier} />
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">
                {creative.brandName}
              </p>
              <p className="mb-1 line-clamp-1 text-sm font-medium">
                {creative.headline ?? "Untitled"}
              </p>
              <div className="flex gap-2 text-xs text-muted-foreground">
                {creative.spend != null && (
                  <span>${creative.spend.toFixed(2)}</span>
                )}
                {creative.roas != null && (
                  <span>ROAS: {creative.roas.toFixed(2)}x</span>
                )}
                {creative.impressions != null && (
                  <span>{creative.impressions.toLocaleString()} impr.</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Input Panel */}
      {selectedCreative && (
        <PerformanceInputForm
          creativeId={selectedCreative}
          onClose={() => setSelectedCreative(null)}
        />
      )}
    </div>
  );
}
