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
import { Separator } from "@/components/ui/separator";
import { X, ExternalLink, Sparkles, Loader2 } from "lucide-react";

interface AdCreativeDetailProps {
  creative: {
    id: string;
    primaryText?: string | null;
    headline?: string | null;
    linkDescription?: string | null;
    ctaType?: string | null;
    format?: string | null;
    hookType?: string | null;
    ctaStyle?: string | null;
    emotionalAppeal?: string | null;
    aiScore?: number | null;
    aiAnalysis?: Record<string, unknown> | null;
    screenshotUrl?: string | null;
    adLibraryUrl?: string | null;
    landingPageUrl?: string | null;
    tags?: string[];
    brandName?: string;
  };
  onClose: () => void;
}

export function AdCreativeDetail({ creative, onClose }: AdCreativeDetailProps) {
  const [analysis, setAnalysis] = useState(creative.aiAnalysis);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch(
        `/api/inspiration/creatives/${creative.id}/analyze`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Ad Creative Detail</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {creative.brandName && (
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {creative.brandName}
          </p>
        )}

        {/* Screenshot */}
        {creative.screenshotUrl && (
          <div className="mb-4 overflow-hidden rounded-lg">
            <img
              src={creative.screenshotUrl}
              alt="Ad creative"
              className="w-full"
            />
          </div>
        )}

        {/* Copy */}
        <div className="mb-4 space-y-2">
          {creative.headline && (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Headline
              </p>
              <p className="text-sm font-medium">{creative.headline}</p>
            </div>
          )}
          {creative.primaryText && (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Primary Text
              </p>
              <p className="whitespace-pre-wrap text-sm">{creative.primaryText}</p>
            </div>
          )}
          {creative.ctaType && (
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                CTA
              </p>
              <p className="text-sm">{creative.ctaType}</p>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-1">
          {creative.format && <Badge>{creative.format}</Badge>}
          {creative.hookType && <Badge variant="secondary">{creative.hookType}</Badge>}
          {creative.ctaStyle && <Badge variant="secondary">{creative.ctaStyle}</Badge>}
          {creative.emotionalAppeal && <Badge variant="outline">{creative.emotionalAppeal}</Badge>}
          {creative.tags?.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>

        {/* Links */}
        <div className="mb-4 space-y-1">
          {creative.adLibraryUrl && (
            <a
              href={creative.adLibraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View in Ad Library
            </a>
          )}
          {creative.landingPageUrl && (
            <a
              href={creative.landingPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Landing Page
            </a>
          )}
        </div>

        <Separator className="my-4" />

        {/* AI Analysis */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">AI Analysis</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-3 w-3" />
              )}
              {analysis ? "Re-analyze" : "Analyze"}
            </Button>
          </div>

          {analysis ? (
            <div className="space-y-3 text-sm">
              {"hookAnalysis" in analysis && analysis.hookAnalysis ? (
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-xs">Hook Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 text-xs text-muted-foreground">
                    {String((analysis.hookAnalysis as Record<string, unknown>).hookExplanation ?? "")}
                  </CardContent>
                </Card>
              ) : null}
              {"keyTakeaways" in analysis && Array.isArray(analysis.keyTakeaways) ? (
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-xs">Key Takeaways</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <ul className="list-inside list-disc text-xs text-muted-foreground">
                      {(analysis.keyTakeaways as string[]).map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
              {"adaptationIdeas" in analysis && Array.isArray(analysis.adaptationIdeas) ? (
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-xs">Adaptation Ideas</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <ul className="list-inside list-disc text-xs text-muted-foreground">
                      {(analysis.adaptationIdeas as string[]).map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click Analyze to get AI-powered insights about this ad creative.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
