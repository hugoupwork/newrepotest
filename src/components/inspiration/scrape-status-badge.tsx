"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ScrapeStatusBadgeProps {
  status: string;
  brandId: string;
}

export function ScrapeStatusBadge({ status: initialStatus, brandId }: ScrapeStatusBadgeProps) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status !== "RUNNING" && status !== "PENDING") return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/inspiration/brands/${brandId}/scrape`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          clearInterval(interval);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, brandId]);

  const variant =
    status === "COMPLETED"
      ? "default"
      : status === "FAILED"
        ? "destructive"
        : "secondary";

  return (
    <Badge variant={variant} className="text-xs">
      {(status === "RUNNING" || status === "PENDING") && (
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      )}
      Scrape: {status}
    </Badge>
  );
}
