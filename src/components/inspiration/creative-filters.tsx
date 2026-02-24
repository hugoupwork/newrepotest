"use client";

import {
  AD_FORMAT_OPTIONS,
  HOOK_TYPE_OPTIONS,
  CTA_STYLE_OPTIONS,
  EMOTIONAL_APPEAL_OPTIONS,
} from "@/config/inspiration-layers";
import { PERFORMANCE_TIER_OPTIONS } from "@/config/atom-taxonomy";

interface CreativeFiltersProps {
  filters: {
    format: string;
    hookType: string;
    ctaStyle: string;
    emotionalAppeal: string;
    performanceTier?: string;
  };
  onChange: (filters: {
    format: string;
    hookType: string;
    ctaStyle: string;
    emotionalAppeal: string;
    performanceTier?: string;
  }) => void;
  totalCount: number;
  filteredCount: number;
  showPerformanceFilter?: boolean;
}

export function CreativeFilters({
  filters,
  onChange,
  totalCount,
  filteredCount,
  showPerformanceFilter,
}: CreativeFiltersProps) {
  function handleChange(key: string, value: string) {
    onChange({ ...filters, [key]: value });
  }

  function handleClear() {
    onChange({
      format: "",
      hookType: "",
      ctaStyle: "",
      emotionalAppeal: "",
      performanceTier: "",
    });
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <select
        value={filters.format}
        onChange={(e) => handleChange("format", e.target.value)}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
      >
        <option value="">All Formats</option>
        {AD_FORMAT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.hookType}
        onChange={(e) => handleChange("hookType", e.target.value)}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
      >
        <option value="">All Hooks</option>
        {HOOK_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.ctaStyle}
        onChange={(e) => handleChange("ctaStyle", e.target.value)}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
      >
        <option value="">All CTA Styles</option>
        {CTA_STYLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.emotionalAppeal}
        onChange={(e) => handleChange("emotionalAppeal", e.target.value)}
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
      >
        <option value="">All Emotions</option>
        {EMOTIONAL_APPEAL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {showPerformanceFilter && (
        <select
          value={filters.performanceTier ?? ""}
          onChange={(e) => handleChange("performanceTier", e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All Tiers</option>
          {PERFORMANCE_TIER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {hasFilters && (
        <button
          onClick={handleClear}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Clear filters
        </button>
      )}

      <span className="ml-auto text-sm text-muted-foreground">
        {filteredCount === totalCount
          ? `${totalCount} creatives`
          : `${filteredCount} of ${totalCount} creatives`}
      </span>
    </div>
  );
}
