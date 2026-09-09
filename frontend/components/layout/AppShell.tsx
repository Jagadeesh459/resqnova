"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";

type AppShellProps = {
  title: string;
  description?: string;
  activePath?: string;
  children: ReactNode;
};

export function AppShell({
  title,
  description,
  activePath,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="min-h-screen">
        <Sidebar
          activePath={activePath}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex min-h-screen min-w-0 flex-col gap-5 p-4 md:pl-[19rem] md:pr-6 md:pt-6">
          <TopNavbar
            title={title}
            description={description}
            onMenuClick={() => setSidebarOpen((current) => !current)}
          />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
