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
import { X } from "lucide-react";

interface AddBrandDialogProps {
  layerId: string;
  onClose: () => void;
  onAdded: (brand: unknown) => void;
}

export function AddBrandDialog({ layerId, onClose, onAdded }: AddBrandDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    website: "",
    metaPageUrl: "",
    estimatedRevenue: "",
    revenueCategory: "similar_level" as "top_performer" | "similar_level",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/inspiration/layers/${layerId}/brands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const brand = await res.json();
        onAdded(brand);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add Brand</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Nike"
                required
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="metaPageUrl">Facebook Page URL</Label>
              <Input
                id="metaPageUrl"
                value={form.metaPageUrl}
                onChange={(e) => setForm({ ...form, metaPageUrl: e.target.value })}
                placeholder="https://facebook.com/brandname"
              />
            </div>
            <div>
              <Label>Revenue Level</Label>
              <div className="mt-1 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={form.revenueCategory === "top_performer" ? "default" : "outline"}
                  onClick={() => setForm({ ...form, revenueCategory: "top_performer" })}
                >
                  Top Performer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={form.revenueCategory === "similar_level" ? "default" : "outline"}
                  onClick={() => setForm({ ...form, revenueCategory: "similar_level" })}
                >
                  Similar Level
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any notes about this brand..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !form.name.trim()}>
                {loading ? "Adding..." : "Add Brand"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
