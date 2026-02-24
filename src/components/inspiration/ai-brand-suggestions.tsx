"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, X, Loader2 } from "lucide-react";

interface BrandSuggestion {
  name: string;
  rationale: string;
  metaPageUrl?: string;
  website?: string;
  estimatedRevenue: string;
  revenueCategory: string;
  relevanceScore: number;
}

interface AiBrandSuggestionsProps {
  layerId: string;
  layerType: string;
}

export function AiBrandSuggestions({ layerId }: AiBrandSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<BrandSuggestion[]>([]);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  async function handleSuggest() {
    setLoading(true);
    try {
      const res = await fetch(`/api/inspiration/layers/${layerId}/ai-suggest`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setInsight(data.layerInsight ?? "");
        setDismissed(new Set());
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(suggestion: BrandSuggestion) {
    const res = await fetch(`/api/inspiration/layers/${layerId}/brands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: suggestion.name,
        website: suggestion.website,
        metaPageUrl: suggestion.metaPageUrl,
        revenueCategory: suggestion.revenueCategory,
      }),
    });

    if (res.ok) {
      setDismissed((prev) => new Set([...prev, suggestion.name]));
    }
  }

  function handleDismiss(name: string) {
    setDismissed((prev) => new Set([...prev, name]));
  }

  const visibleSuggestions = suggestions.filter(
    (s) => !dismissed.has(s.name)
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Button
          onClick={handleSuggest}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {loading ? "Finding brands..." : "AI Suggest Brands"}
        </Button>
      </div>

      {insight && (
        <p className="mb-4 text-sm italic text-muted-foreground">
          {insight}
        </p>
      )}

      {visibleSuggestions.length > 0 && (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {visibleSuggestions.map((s) => (
            <Card key={s.name} className="border-dashed border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{s.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {(s.relevanceScore * 100).toFixed(0)}% match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-xs text-muted-foreground">
                  {s.rationale}
                </p>
                {s.website && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {s.website}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(s)}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(s.name)}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
