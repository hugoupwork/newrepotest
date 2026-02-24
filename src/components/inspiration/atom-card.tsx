"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ATOM_CATEGORIES } from "@/config/atom-taxonomy";

interface AtomCardProps {
  atom: Record<string, unknown>;
}

export function AtomCard({ atom }: AtomCardProps) {
  const category = ATOM_CATEGORIES.find((c) => c.value === atom.category);
  const confidence = typeof atom.confidence === "number" ? atom.confidence : 0;

  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {category?.label ?? String(atom.category ?? "")}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {(confidence * 100).toFixed(0)}% confidence
          </span>
        </div>
        <p className="mb-1 text-sm font-medium">
          {String(atom.name ?? "")}
        </p>
        <p className="text-xs text-muted-foreground">
          {String(atom.description ?? "")}
        </p>
        {atom.timestampStart != null && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {formatMs(atom.timestampStart as number)} -{" "}
            {formatMs(atom.timestampEnd as number)}
          </p>
        )}
        {/* Confidence bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary"
            style={{ width: `${confidence * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
