"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon } from "lucide-react";

interface AdCreativeCardProps {
  creative: {
    id: string;
    primaryText?: string | null;
    headline?: string | null;
    ctaType?: string | null;
    format?: string | null;
    hookType?: string | null;
    emotionalAppeal?: string | null;
    aiScore?: number | null;
    screenshotUrl?: string | null;
    thumbnailUrl?: string | null;
    brandName?: string;
    isActive?: boolean;
  };
  onClick?: () => void;
}

export function AdCreativeCard({ creative, onClick }: AdCreativeCardProps) {
  const imageUrl = creative.thumbnailUrl || creative.screenshotUrl;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      {/* Thumbnail / Image Area */}
      <div className="relative h-40 overflow-hidden rounded-t-lg bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={creative.headline ?? "Ad creative"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
        {creative.aiScore != null && (
          <div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            {(creative.aiScore * 100).toFixed(0)}%
          </div>
        )}
      </div>

      <CardContent className="p-3">
        {/* Brand name */}
        {creative.brandName && (
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {creative.brandName}
          </p>
        )}

        {/* Headline */}
        {creative.headline && (
          <p className="mb-2 line-clamp-2 text-sm font-medium">
            {creative.headline}
          </p>
        )}

        {/* Copy preview */}
        {creative.primaryText && (
          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
            {creative.primaryText}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {creative.format && (
            <Badge variant="secondary" className="text-[10px]">
              {creative.format}
            </Badge>
          )}
          {creative.hookType && (
            <Badge variant="outline" className="text-[10px]">
              {creative.hookType}
            </Badge>
          )}
          {creative.emotionalAppeal && (
            <Badge variant="outline" className="text-[10px]">
              {creative.emotionalAppeal}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
