"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { Sidebar } from "./Sidebar";
import { LiveNetworkWidget } from "./LiveNetworkWidget";
import { WalletGuard } from "./WalletGuard";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Sticky Mobile Header Bar (Only visible below lg breakpoint) */}
      <header className="lg:hidden sticky top-0 z-30 w-full bg-brand-black/90 backdrop-blur-xl border-b border-brand-border/40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
          
          <Link href="/" className="flex items-center gap-1.5" onClick={handleCloseSidebar}>
            <img src="/KiiHub.png" alt="KiiHub Logo" className="w-7 h-7 object-contain" />
            <div className="flex items-center gap-0.5">
              <span className="font-black text-white tracking-tight text-lg font-sans">Kii</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 font-black text-lg animate-text-gradient font-sans">Hub</span>
            </div>
          </Link>
        </div>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {theme === "light" ? (
            <Sun className="w-5 h-5 text-orange-500" />
          ) : (
            <Moon className="w-5 h-5 text-kii-blue" />
          )}
        </button>
      </header>

      {/* Backdrop overlay (Only visible on mobile when sidebar is open) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleCloseSidebar}
        />
      )}

      {/* Sidebar Drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      {/* Main Area */}
      <div className="flex-1 min-h-screen lg:pl-64 pl-0 flex flex-col relative">
        {/* Background Glows and Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
        
        {/* Purple Ambient Blob top-left */}
        <div className="absolute top-[-10%] left-[5%] w-[500px] h-[500px] rounded-full bg-kii-purple/10 blur-[120px] pointer-events-none" />
        {/* Blue Ambient Blob bottom-right */}
        <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] rounded-full bg-kii-blue/5 blur-[150px] pointer-events-none" />

        {/* Floating Live Widget */}
        <LiveNetworkWidget />

        {/* Page Contents */}
        <main className="flex-1 w-full max-w-7xl mx-auto lg:px-8 px-4 lg:py-10 py-6 relative z-10">
          <WalletGuard>
            {children}
          </WalletGuard>
        </main>
      </div>
    </>
  );
};
