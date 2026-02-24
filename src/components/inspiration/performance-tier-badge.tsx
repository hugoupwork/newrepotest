"use client";

import { Badge } from "@/components/ui/badge";
import { PERFORMANCE_TIER_OPTIONS } from "@/config/atom-taxonomy";

interface PerformanceTierBadgeProps {
  tier: string;
  className?: string;
}

const tierColors: Record<string, string> = {
  WINNER: "bg-green-100 text-green-800 border-green-200",
  STRONG: "bg-emerald-100 text-emerald-800 border-emerald-200",
  AVERAGE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  WEAK: "bg-orange-100 text-orange-800 border-orange-200",
  NON_SPENDER: "bg-red-100 text-red-800 border-red-200",
  UNKNOWN: "bg-gray-100 text-gray-800 border-gray-200",
};

export function PerformanceTierBadge({
  tier,
  className,
}: PerformanceTierBadgeProps) {
  const option = PERFORMANCE_TIER_OPTIONS.find((o) => o.value === tier);
  const colors = tierColors[tier] ?? tierColors.UNKNOWN;

  return (
    <Badge variant="outline" className={`${colors} ${className ?? ""}`}>
      {option?.label ?? tier}
    </Badge>
  );
}
