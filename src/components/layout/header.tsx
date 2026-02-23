"use client";

import { UserButton } from "@clerk/nextjs";

export function Header({ title }: { title?: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <h1 className="text-lg font-semibold">{title ?? "Evolve Method"}</h1>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
