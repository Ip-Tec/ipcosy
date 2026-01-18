"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu, X, LogOut } from "lucide-react";

interface AdminUser {
  email?: string;
  name?: string;
  image?: string;
  id?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = (session?.user as AdminUser) || {};
  const isAdmin = user?.email && SUPER_ADMIN_EMAILS.includes(user.email);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { name: "Reports", href: "/admin/reports", icon: "🚨" },
    { name: "Support Tickets", href: "/admin/support-tickets", icon: "🎫" },
    { name: "Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 border-r border-border bg-sidebar flex-col z-40">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-black tracking-tighter">
            Admin<span className="text-primary">.</span>
          </h1>
          <p className="text-[10px] text-muted uppercase tracking-widest font-bold mt-1">
            Control Center
          </p>
        </div>

        <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold text-sm ${
                  active
                    ? "bg-primary text-white shadow-lg scale-105"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                }`}
              >
                <span className="text-lg w-6 text-center">{item.icon}</span>
                <span>{item.name}</span>
                {active && <span className="ml-auto text-lg">→</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Exit Dashboard
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-border z-40 flex items-center justify-between px-4">
        <Link href="/admin" className="font-black text-lg">
          Admin<span className="text-primary">.</span>
        </Link>
        
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-primary/10 rounded-lg transition-colors lg:hidden"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-sidebar/95 backdrop-blur-sm z-30 p-4 overflow-y-auto">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold text-sm ${
                    active
                      ? "bg-primary text-white shadow-lg"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{item.name}</span>
                  {active && <span className="text-lg">→</span>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-border">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Exit Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Content Area */}
      <main className="flex-1 lg:ml-72 p-4 md:p-8 pt-20 md:pt-12 lg:pt-8 min-h-screen bg-background/50">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
