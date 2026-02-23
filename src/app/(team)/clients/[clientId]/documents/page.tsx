import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { clientId } = await params;

  const brand = await prisma.brand.findUnique({
    where: { id: clientId },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!brand) notFound();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{brand.name} — Documents</h1>
        <p className="text-muted-foreground">
          Generated Master Documents and Growth Guides.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Documents</CardTitle>
          <CardDescription>
            Documents are generated as Google Docs and Sheets from your research
            and analysis data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brand.documents.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No documents generated yet. Complete analysis first, then
                generate your Master Document and Growth Guide.
              </p>
              <Badge variant="outline" className="mt-4">
                Document generation coming in Phase 4
              </Badge>
            </div>
          ) : (
            <div className="space-y-3">
              {brand.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.type.replace("_", " ")} — v{doc.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.googleDriveUrl && (
                      <a
                        href={doc.googleDriveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Open in Drive
                      </a>
                    )}
                    <Badge
                      variant={
                        doc.status === "COMPLETED" ? "default" : "secondary"
                      }
                    >
                      {doc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
