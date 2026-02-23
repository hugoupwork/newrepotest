"use client";

import { useState } from "react";
import { AdCreativeCard } from "./ad-creative-card";
import { AdCreativeDetail } from "./ad-creative-detail";
import { CreativeFilters } from "./creative-filters";

interface Creative {
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
  thumbnailUrl?: string | null;
  adLibraryUrl?: string | null;
  landingPageUrl?: string | null;
  tags?: string[];
  brandName?: string;
  isActive?: boolean;
}

interface AdCreativeGalleryProps {
  creatives: Creative[];
  showFilters?: boolean;
}

export function AdCreativeGallery({
  creatives,
  showFilters = false,
}: AdCreativeGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    format: "",
    hookType: "",
    ctaStyle: "",
    emotionalAppeal: "",
  });

  const filtered = creatives.filter((c) => {
    if (filters.format && c.format !== filters.format) return false;
    if (filters.hookType && c.hookType !== filters.hookType) return false;
    if (filters.ctaStyle && c.ctaStyle !== filters.ctaStyle) return false;
    if (filters.emotionalAppeal && c.emotionalAppeal !== filters.emotionalAppeal)
      return false;
    return true;
  });

  const selected = filtered.find((c) => c.id === selectedId);

  return (
    <div>
      {showFilters && (
        <CreativeFilters
          filters={filters}
          onChange={setFilters}
          totalCount={creatives.length}
          filteredCount={filtered.length}
        />
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No creatives match the current filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((creative) => (
            <AdCreativeCard
              key={creative.id}
              creative={creative}
              onClick={() => setSelectedId(creative.id)}
            />
          ))}
        </div>
      )}

      {selected && (
        <AdCreativeDetail
          creative={selected}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
