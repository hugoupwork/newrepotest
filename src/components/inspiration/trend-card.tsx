"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TrendCardProps {
  trend: {
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
  };
  onDismiss: () => void;
}

export function TrendCard({ trend, onDismiss }: TrendCardProps) {
  const relevancePercent = (trend.relevanceScore ?? 0) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-sm">{trend.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {trend.sourceName && (
              <Badge variant="secondary" className="text-[10px]">
                {trend.sourceName}
              </Badge>
            )}
            {trend.category && (
              <Badge variant="outline" className="text-[10px]">
                {trend.category}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Relevance Score */}
        {trend.relevanceScore != null && (
          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Relevance</span>
              <span className="font-medium">{relevancePercent.toFixed(0)}%</span>
            </div>
            <Progress value={relevancePercent} className="h-1.5" />
          </div>
        )}

        {/* Description */}
        {trend.description && (
          <p className="mb-2 text-xs text-muted-foreground">
            {trend.description}
          </p>
        )}

        {/* AI Relevance Notes */}
        {trend.aiRelevanceNotes && (
          <p className="mb-2 text-xs italic text-muted-foreground">
            {trend.aiRelevanceNotes}
          </p>
        )}

        {/* AI Adaptation Ideas */}
        {trend.aiAdaptation && (
          <div className="mb-2 rounded bg-muted p-2">
            <p className="text-xs font-medium">Adaptation Ideas:</p>
            <p className="text-xs text-muted-foreground">
              {trend.aiAdaptation}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {trend.sourceUrl && (
            <a
              href={trend.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Source
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="ml-auto text-xs text-destructive"
          >
            <X className="mr-1 h-3 w-3" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
