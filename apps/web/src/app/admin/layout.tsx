"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.email && SUPER_ADMIN_EMAILS.includes(user.email);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <p className="text-muted animate-pulse">Verifying Access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
        <h1 className="text-4xl font-black text-red-500">Access Denied</h1>
        <p className="text-muted">
          You do not have permission to view this page.
        </p>
        <Link href="/" className="text-primary hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const navItems = [
    { name: "Overview", href: "/admin", icon: "📊" },
    { name: "Users", href: "/admin/users", icon: "👥" },
    { name: "Invites", href: "/admin/invites", icon: "🎟️" },
    { name: "Support", href: "/admin/support", icon: "🛡️" },
    { name: "Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-border bg-sidebar p-6 hidden md:flex flex-col z-20">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tighter">
            Admin<span className="text-primary">.</span>
          </h1>
          <p className="text-[10px] text-muted uppercase tracking-widest font-bold">
            Control Center
          </p>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm ${
                  isActive
                    ? "bg-primary text-white shadow-lg scale-105"
                    : "hover:bg-primary/10 text-muted hover:text-foreground"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-8 border-t border-border">
          <Link
            href="/"
            className="text-xs text-muted hover:text-primary flex items-center gap-2 font-medium transition-colors"
          >
            <span>←</span> Exit Dashboard
          </Link>
        </div>
      </aside>

      {/* Mobile Nav Placeholder (Simple top bar for mobile) */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-sidebar border-b border-border z-20 flex items-center justify-between px-4">
        <span className="font-black">Admin.</span>
        <div className="flex gap-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-xl">
              {item.icon}
            </Link>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 md:ml-64 p-6 md:p-12 pt-20 md:pt-12 min-h-screen bg-background/50">
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
