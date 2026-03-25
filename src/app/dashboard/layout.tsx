"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Plus,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Templates", href: "/dashboard/templates", icon: FileText },
  { label: "New Proposal", href: "/dashboard/proposals/new", icon: Plus },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => setHasApiKey(data.hasApiKey || false))
        .catch(() => setHasApiKey(false));
    }
  }, [status]);

  if (status === "loading" || (status === "authenticated" && hasApiKey === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFBFC]">
        <div className="h-8 w-8 border-2 border-[#4A7C6F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/signin";
    }
    return null;
  }

  // Redirect to setup if no API key (but allow access to setup and settings pages)
  const isSetupPage = pathname === "/dashboard/setup";
  const isSettingsPage = pathname === "/dashboard/settings";
  if (!hasApiKey && !isSetupPage && !isSettingsPage) {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard/setup";
    }
    return null;
  }

  // Render setup page without the sidebar layout
  if (isSetupPage) {
    return <>{children}</>;
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-[#FAFBFC]">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-[#E5E7EB] flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#E5E7EB]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#4A7C6F] flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#111827] tracking-tight">
              PropBuild
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${
                    active
                      ? "bg-[#4A7C6F]/10 text-[#4A7C6F]"
                      : "text-[#6B7280] hover:bg-gray-50 hover:text-[#111827]"
                  }
                `}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <ChevronRight className="h-4 w-4 opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-[#E5E7EB] p-4">
          <div className="flex items-center gap-3 mb-3">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#4A7C6F]/10 flex items-center justify-center text-[#4A7C6F] text-sm font-semibold">
                {(session.user?.name || session.user?.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {session.user?.name && (
                <p className="text-sm font-medium text-[#111827] truncate">
                  {session.user.name}
                </p>
              )}
              <p className="text-xs text-[#6B7280] truncate">
                {session.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-red-500 transition-colors w-full px-1"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
