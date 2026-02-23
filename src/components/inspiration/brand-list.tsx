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
import { AddBrandDialog } from "./add-brand-dialog";
import { ScrapeStatusBadge } from "./scrape-status-badge";
import { Trash2, ExternalLink, Search } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  website: string | null;
  metaPageUrl: string | null;
  revenueCategory: string | null;
  socialFollowing: number | null;
  lastScrapedAt: string | Date | null;
  isUserAdded: boolean;
  adCreatives: { id: string }[];
  adLibraryScrapeJob: { id: string; status: string } | null;
}

interface BrandListProps {
  layerId: string;
  brands: Brand[];
}

export function BrandList({ layerId, brands: initialBrands }: BrandListProps) {
  const [brands, setBrands] = useState(initialBrands);
  const [showAdd, setShowAdd] = useState(false);

  async function handleDelete(brandId: string) {
    if (!confirm("Remove this brand and all its creatives?")) return;

    const res = await fetch(
      `/api/inspiration/layers/${layerId}/brands?brandId=${brandId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setBrands((prev) => prev.filter((b) => b.id !== brandId));
    }
  }

  async function handleScrape(brandId: string) {
    await fetch(`/api/inspiration/brands/${brandId}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    // Refresh the page to show updated scrape status
    window.location.reload();
  }

  function handleBrandAdded(brand: unknown) {
    setBrands((prev) => [brand as Brand, ...prev]);
    setShowAdd(false);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Brands ({brands.length})</h2>
        <Button onClick={() => setShowAdd(true)} size="sm">
          Add Brand
        </Button>
      </div>

      {brands.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No brands added yet. Add brands manually or use AI suggestions.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{brand.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    {brand.revenueCategory && (
                      <Badge variant="outline" className="text-xs">
                        {brand.revenueCategory === "top_performer"
                          ? "Top Performer"
                          : "Similar Level"}
                      </Badge>
                    )}
                    {!brand.isUserAdded && (
                      <Badge variant="secondary" className="text-xs">
                        From Onboarding
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 space-y-1 text-sm text-muted-foreground">
                  {brand.website && (
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {brand.website}
                      </a>
                    </div>
                  )}
                  <div>
                    {brand.adCreatives.length} creatives captured
                  </div>
                  {brand.adLibraryScrapeJob && (
                    <ScrapeStatusBadge
                      status={brand.adLibraryScrapeJob.status}
                      brandId={brand.id}
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleScrape(brand.id)}
                  >
                    <Search className="mr-1 h-3 w-3" />
                    Scrape Ads
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(brand.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAdd && (
        <AddBrandDialog
          layerId={layerId}
          onClose={() => setShowAdd(false)}
          onAdded={handleBrandAdded}
        />
      )}
    </div>
  );
}
