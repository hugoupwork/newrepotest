"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  Search,
  Brain,
  FileText,
  Target,
  BarChart3,
  Settings,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const clientNav: NavItem[] = [
  { title: "Dashboard", href: "/my-dashboard", icon: LayoutDashboard },
  { title: "Onboarding", href: "/onboarding", icon: ClipboardList },
];

const teamNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Clients", href: "/clients", icon: Users },
];

function clientDetailNav(clientId: string): NavItem[] {
  return [
    {
      title: "Overview",
      href: `/clients/${clientId}`,
      icon: LayoutDashboard,
    },
    {
      title: "Onboarding",
      href: `/clients/${clientId}/onboarding`,
      icon: ClipboardList,
    },
    {
      title: "Research",
      href: `/clients/${clientId}/research`,
      icon: Search,
    },
    {
      title: "Analysis",
      href: `/clients/${clientId}/analysis`,
      icon: Brain,
    },
    {
      title: "Documents",
      href: `/clients/${clientId}/documents`,
      icon: FileText,
    },
    {
      title: "Strategy",
      href: `/clients/${clientId}/strategy`,
      icon: Target,
    },
    {
      title: "Ads",
      href: `/clients/${clientId}/ads`,
      icon: BarChart3,
    },
  ];
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.title}
    </Link>
  );
}

export function AppSidebar({
  role,
  clientId,
}: {
  role: "client" | "team";
  clientId?: string;
}) {
  const pathname = usePathname();

  const mainNav = role === "client" ? clientNav : teamNav;
  const detailNav = clientId ? clientDetailNav(clientId) : [];

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="text-lg font-bold">Evolve</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {detailNav.length > 0 && (
          <>
            <Separator className="my-3" />
            <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
              Client
            </p>
            {detailNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center justify-between">
          <Link
            href={role === "team" ? "/settings" : "#"}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            {role === "team" ? "Settings" : ""}
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  );
}
