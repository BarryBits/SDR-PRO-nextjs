"use client";

import { SidebarProvider } from "./sidebar-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { DashboardProvider } from "@/context/dashboard-context";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardProvider>
        <div className="flex min-h-screen bg-white">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* Header */}
            <Header />
            
            {/* Main Content */}
            <main className="flex-1 relative">
              {/* Content Container */}
              <div className="relative z-10 h-full overflow-auto">
                <div className="container mx-auto px-4 md:px-6 py-6">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </DashboardProvider>
    </SidebarProvider>
  );
}

