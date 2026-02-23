import { AppSidebar } from "@/components/layout/sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <AppSidebar role="client" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
