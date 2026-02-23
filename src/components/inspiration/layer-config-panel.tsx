"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings2, Save } from "lucide-react";

interface LayerConfigPanelProps {
  layerId: string;
  layerType: string;
  currentLabel: string | null;
  currentDescription: string | null;
  currentDesireKeyword: string | null;
  currentDemographic: string | null;
}

export function LayerConfigPanel({
  layerId,
  layerType,
  currentLabel,
  currentDescription,
  currentDesireKeyword,
  currentDemographic,
}: LayerConfigPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: currentLabel ?? "",
    description: currentDescription ?? "",
    desireKeyword: currentDesireKeyword ?? "",
    demographic: currentDemographic ?? "",
  });

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/inspiration/layers/${layerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } finally {
      setSaving(false);
    }
  }

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(true)}
      >
        <Settings2 className="mr-2 h-4 w-4" />
        Layer Settings
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Layer Configuration</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
          >
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="label" className="text-xs">Custom Label</Label>
          <Input
            id="label"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Optional custom name for this layer"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="description" className="text-xs">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What this layer covers for this brand..."
            rows={2}
            className="text-sm"
          />
        </div>
        {layerType === "SAME_DESIRE_OUTCOME" && (
          <div>
            <Label htmlFor="desireKeyword" className="text-xs">
              Core Desire / Outcome
            </Label>
            <Input
              id="desireKeyword"
              value={form.desireKeyword}
              onChange={(e) => setForm({ ...form, desireKeyword: e.target.value })}
              placeholder='e.g., "attractiveness", "confidence", "status"'
              className="h-8 text-sm"
            />
          </div>
        )}
        {layerType === "SAME_DEMOGRAPHIC" && (
          <div>
            <Label htmlFor="demographic" className="text-xs">
              Target Demographic
            </Label>
            <Input
              id="demographic"
              value={form.demographic}
              onChange={(e) => setForm({ ...form, demographic: e.target.value })}
              placeholder="e.g., Men 18-30, Women 25-40"
              className="h-8 text-sm"
            />
          </div>
        )}
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save className="mr-1 h-3 w-3" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
