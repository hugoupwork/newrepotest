"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { PERFORMANCE_TIER_OPTIONS } from "@/config/atom-taxonomy";

interface PerformanceInputFormProps {
  creativeId: string;
  onClose: () => void;
}

export function PerformanceInputForm({
  creativeId,
  onClose,
}: PerformanceInputFormProps) {
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    spend: "",
    impressions: "",
    clicks: "",
    conversions: "",
    roas: "",
    revenue: "",
    performanceTier: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (data.spend) payload.spend = parseFloat(data.spend);
      if (data.impressions) payload.impressions = parseInt(data.impressions);
      if (data.clicks) payload.clicks = parseInt(data.clicks);
      if (data.conversions) payload.conversions = parseInt(data.conversions);
      if (data.roas) payload.roas = parseFloat(data.roas);
      if (data.revenue) payload.revenue = parseFloat(data.revenue);
      if (data.performanceTier) payload.performanceTier = data.performanceTier;

      await fetch(`/api/inspiration/creatives/${creativeId}/performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Set Performance Data</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Spend ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={data.spend}
                  onChange={(e) =>
                    setData((d) => ({ ...d, spend: e.target.value }))
                  }
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">ROAS</label>
                <input
                  type="number"
                  step="0.01"
                  value={data.roas}
                  onChange={(e) =>
                    setData((d) => ({ ...d, roas: e.target.value }))
                  }
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Impressions
                </label>
                <input
                  type="number"
                  value={data.impressions}
                  onChange={(e) =>
                    setData((d) => ({ ...d, impressions: e.target.value }))
                  }
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Clicks
                </label>
                <input
                  type="number"
                  value={data.clicks}
                  onChange={(e) =>
                    setData((d) => ({ ...d, clicks: e.target.value }))
                  }
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Conversions
                </label>
                <input
                  type="number"
                  value={data.conversions}
                  onChange={(e) =>
                    setData((d) => ({ ...d, conversions: e.target.value }))
                  }
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Revenue ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={data.revenue}
                  onChange={(e) =>
                    setData((d) => ({ ...d, revenue: e.target.value }))
                  }
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Performance Tier (override)
              </label>
              <select
                value={data.performanceTier}
                onChange={(e) =>
                  setData((d) => ({ ...d, performanceTier: e.target.value }))
                }
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">Auto-compute from metrics</option>
                {PERFORMANCE_TIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Performance Data
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
