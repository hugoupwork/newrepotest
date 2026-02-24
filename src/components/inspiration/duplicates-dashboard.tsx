"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Check,
  X,
  Image as ImageIcon,
} from "lucide-react";

interface DuplicateGroup {
  id: string;
  name: string | null;
  status: string;
  members: {
    id: string;
    similarityScore: number;
    isPrimary: boolean;
    creative: {
      id: string;
      headline: string | null;
      screenshotUrl: string | null;
      thumbnailUrl: string | null;
      format: string | null;
      brandName: string;
    };
  }[];
}

interface DuplicatesDashboardProps {
  boardId: string;
  groups: DuplicateGroup[];
}

export function DuplicatesDashboard({
  boardId,
  groups: initialGroups,
}: DuplicatesDashboardProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [detecting, setDetecting] = useState(false);

  async function handleDetect() {
    setDetecting(true);
    try {
      const res = await fetch(
        `/api/inspiration/board/${boardId}/duplicates`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setGroups((prev) => [...data.groups, ...prev]);
      }
    } finally {
      setDetecting(false);
    }
  }

  async function handleUpdateGroup(
    groupId: string,
    status: "CONFIRMED" | "DISMISSED"
  ) {
    const res = await fetch(
      `/api/inspiration/board/${boardId}/duplicates/${groupId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    if (res.ok) {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, status } : g))
      );
    }
  }

  const pending = groups.filter((g) => g.status === "AUTO_DETECTED");
  const confirmed = groups.filter((g) => g.status === "CONFIRMED");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dismissed = groups.filter((g) => g.status === "DISMISSED");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-sm text-muted-foreground">Total Groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pending.length}</div>
            <p className="text-sm text-muted-foreground">Needs Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{confirmed.length}</div>
            <p className="text-sm text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Button onClick={handleDetect} disabled={detecting}>
        {detecting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Search className="mr-2 h-4 w-4" />
        )}
        Detect Duplicates
      </Button>

      {/* Groups */}
      <div className="space-y-4">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">
                  {group.name ?? "Duplicate Group"}
                </CardTitle>
                <Badge
                  variant={
                    group.status === "CONFIRMED"
                      ? "default"
                      : group.status === "DISMISSED"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {group.status.replace("_", " ")}
                </Badge>
              </div>
              {group.status === "AUTO_DETECTED" && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    onClick={() => handleUpdateGroup(group.id, "CONFIRMED")}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => handleUpdateGroup(group.id, "DISMISSED")}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Dismiss
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className={`flex-shrink-0 rounded-lg border p-2 ${
                      member.isPrimary ? "border-primary" : ""
                    }`}
                    style={{ width: 160 }}
                  >
                    <div className="mb-2 h-24 overflow-hidden rounded bg-muted">
                      {member.creative.screenshotUrl ||
                      member.creative.thumbnailUrl ? (
                        <img
                          src={
                            member.creative.thumbnailUrl ??
                            member.creative.screenshotUrl ??
                            ""
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {member.creative.brandName}
                    </p>
                    <p className="line-clamp-1 text-xs font-medium">
                      {member.creative.headline ?? "Untitled"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {(member.similarityScore * 100).toFixed(0)}% similar
                      {member.isPrimary && " (primary)"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {groups.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No duplicate groups found. Click Detect Duplicates to scan your
                creatives.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
