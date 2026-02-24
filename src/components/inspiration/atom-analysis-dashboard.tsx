"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Download,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { AtomCard } from "./atom-card";
import { BatchAnalysisProgress } from "./batch-analysis-progress";

interface Creative {
  id: string;
  headline: string | null;
  screenshotUrl: string | null;
  thumbnailUrl: string | null;
  format: string | null;
  atomAnalysisStatus: string | null;
  mediaDownloaded: boolean;
  brandName: string;
  atomCount: number;
}

interface Job {
  id: string;
  status: string;
  totalItems: number;
  processedItems: number;
  failedItems: number;
}

interface AtomAnalysisDashboardProps {
  boardId: string;
  creatives: Creative[];
  activeJobs: Job[];
}

export function AtomAnalysisDashboard({
  boardId,
  creatives,
  activeJobs,
}: AtomAnalysisDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>(activeJobs);
  const [selectedCreative, setSelectedCreative] = useState<string | null>(null);
  const [atoms, setAtoms] = useState<Record<string, unknown>[]>([]);
  const [loadingAtoms, setLoadingAtoms] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const analyzed = creatives.filter((c) => c.atomAnalysisStatus === "ANALYZED");
  const pending = creatives.filter(
    (c) => !c.atomAnalysisStatus || c.atomAnalysisStatus === "PENDING"
  );

  async function handleBatchAnalyze() {
    const ids = creatives
      .filter((c) => c.mediaDownloaded && c.atomAnalysisStatus !== "ANALYZED")
      .map((c) => c.id);

    if (ids.length === 0) return;

    const res = await fetch(`/api/inspiration/board/${boardId}/atoms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creativeIds: ids }),
    });

    if (res.ok) {
      const data = await res.json();
      setJobs((prev) => [
        { id: data.jobId, status: "PENDING", totalItems: ids.length, processedItems: 0, failedItems: 0 },
        ...prev,
      ]);
    }
  }

  async function handleDownloadMedia(creativeId: string) {
    setDownloading(creativeId);
    try {
      await fetch(`/api/inspiration/creatives/${creativeId}/media`, {
        method: "POST",
      });
    } finally {
      setDownloading(null);
    }
  }

  async function handleAnalyzeSingle(creativeId: string) {
    setAnalyzing(creativeId);
    try {
      await fetch(`/api/inspiration/creatives/${creativeId}/atoms`, {
        method: "POST",
      });
    } finally {
      setAnalyzing(null);
    }
  }

  async function handleViewAtoms(creativeId: string) {
    setSelectedCreative(creativeId);
    setLoadingAtoms(true);
    try {
      const res = await fetch(
        `/api/inspiration/creatives/${creativeId}/atoms`
      );
      if (res.ok) {
        setAtoms(await res.json());
      }
    } finally {
      setLoadingAtoms(false);
    }
  }

  function statusIcon(status: string | null) {
    if (status === "ANALYZED")
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "PROCESSING")
      return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
    if (status === "FAILED")
      return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{creatives.length}</div>
            <p className="text-sm text-muted-foreground">Total Creatives</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{analyzed.length}</div>
            <p className="text-sm text-muted-foreground">Analyzed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pending.length}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          {jobs.map((job) => (
            <BatchAnalysisProgress key={job.id} job={job} boardId={boardId} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleBatchAnalyze} disabled={pending.length === 0}>
          <Sparkles className="mr-2 h-4 w-4" />
          Analyze All ({pending.length})
        </Button>
      </div>

      {/* Creatives Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {creatives.map((creative) => (
          <Card key={creative.id} className="overflow-hidden">
            <div className="relative h-32 bg-muted">
              {creative.thumbnailUrl || creative.screenshotUrl ? (
                <img
                  src={creative.thumbnailUrl ?? creative.screenshotUrl ?? ""}
                  alt={creative.headline ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
              <div className="absolute right-2 top-2">
                {statusIcon(creative.atomAnalysisStatus)}
              </div>
            </div>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">
                {creative.brandName}
              </p>
              <p className="mb-2 line-clamp-1 text-sm font-medium">
                {creative.headline ?? "Untitled"}
              </p>
              <div className="mb-2 flex gap-1">
                {creative.format && (
                  <Badge variant="secondary" className="text-[10px]">
                    {creative.format}
                  </Badge>
                )}
                {creative.atomCount > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    {creative.atomCount} atoms
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                {!creative.mediaDownloaded && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleDownloadMedia(creative.id)}
                    disabled={downloading === creative.id}
                  >
                    {downloading === creative.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="mr-1 h-3 w-3" />
                    )}
                    Media
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleAnalyzeSingle(creative.id)}
                  disabled={analyzing === creative.id}
                >
                  {analyzing === creative.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1 h-3 w-3" />
                  )}
                  Analyze
                </Button>
                {creative.atomCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => handleViewAtoms(creative.id)}
                  >
                    View Atoms
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Atom Detail Panel */}
      {selectedCreative && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50">
          <div className="h-full w-full max-w-lg overflow-y-auto bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Creative Atoms</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCreative(null)}
              >
                Close
              </Button>
            </div>
            {loadingAtoms ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading atoms...
              </div>
            ) : (
              <div className="space-y-3">
                {atoms.map((atom, i) => (
                  <AtomCard key={i} atom={atom} />
                ))}
                {atoms.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No atoms found. Run analysis first.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
