import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const primaryEmail = email_addresses?.[0]?.email_address;
    if (!primaryEmail) {
      return new Response("No email address", { status: 400 });
    }

    await prisma.user.upsert({
      where: { clerkId: id },
      update: {
        email: primaryEmail,
        firstName: first_name ?? undefined,
        lastName: last_name ?? undefined,
        avatarUrl: image_url ?? undefined,
      },
      create: {
        clerkId: id,
        email: primaryEmail,
        firstName: first_name ?? undefined,
        lastName: last_name ?? undefined,
        avatarUrl: image_url ?? undefined,
        role: "CLIENT",
      },
    });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      await prisma.user.delete({ where: { clerkId: id } }).catch(() => {
        // User may not exist in our DB yet
      });
    }
  }

  return new Response("OK", { status: 200 });
}
