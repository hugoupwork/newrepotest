"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Swords,
  Layers,
  Heart,
  Users,
  TrendingUp,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Swords,
  Layers,
  Heart,
  Users,
  TrendingUp,
};

interface LayerOverviewCardProps {
  clientId: string;
  config: {
    type: string;
    number: number;
    title: string;
    slug: string;
    description: string;
    icon: string;
  };
  brandCount: number;
  creativeCount: number;
  trendCount: number;
  status: string;
}

export function LayerOverviewCard({
  clientId,
  config,
  brandCount,
  creativeCount,
  trendCount,
  status,
}: LayerOverviewCardProps) {
  const Icon = ICON_MAP[config.icon] ?? Layers;
  const isTrend = config.type === "TREND_SPOTTER";

  const statusLabel =
    status === "COMPLETED"
      ? "Analyzed"
      : brandCount > 0 || trendCount > 0
        ? "In Progress"
        : "Not Started";

  const statusVariant =
    statusLabel === "Analyzed"
      ? "default"
      : statusLabel === "In Progress"
        ? "secondary"
        : "outline";

  return (
    <Link href={`/clients/${clientId}/inspiration/${config.slug}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">
                  Layer {config.number}
                </CardTitle>
                <CardDescription className="text-xs">
                  {config.title}
                </CardDescription>
              </div>
            </div>
            <Badge variant={statusVariant as "default" | "secondary" | "outline"}>
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            {config.description}
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            {isTrend ? (
              <span>{trendCount} trends</span>
            ) : (
              <>
                <span>{brandCount} brands</span>
                <span>{creativeCount} creatives</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
