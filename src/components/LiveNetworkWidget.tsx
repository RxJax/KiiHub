"use client";

import React from "react";
import { useWallet } from "../contexts/WalletContext";
import { useTheme } from "../contexts/ThemeContext";
import { Layers, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export const LiveNetworkWidget: React.FC = () => {
  const { latestBlock } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <div className="lg:flex hidden fixed top-5 right-6 z-50 items-center gap-3">
      {/* Theme Toggle Widget */}
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-black/80 backdrop-blur-md border border-brand-border text-xs font-semibold text-zinc-300 hover:border-kii-purple/50 cursor-pointer transition-colors shadow-xl"
        title="Toggle Theme"
      >
        {theme === "light" ? (
          <>
            <Sun className="w-3.5 h-3.5 text-orange-500 animate-spin-slow" />
            <span className="text-[11px] text-zinc-400 font-medium">Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-kii-blue" />
            <span className="text-[11px] text-zinc-400 font-medium">Dark Mode</span>
          </>
        )}
      </button>

      {/* Network Health Capsule */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-brand-black/80 backdrop-blur-md border border-brand-border text-xs font-semibold text-zinc-300 shadow-xl">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kii-teal opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-kii-teal"></span>
        </span>
        <span className="text-[11px] text-zinc-400">
          Testnet EVM
        </span>
        <div className="w-[1px] h-3 bg-zinc-800" />
        <span className="text-kii-teal font-extrabold text-[10px] tracking-wider uppercase">
          ONLINE
        </span>
      </div>

      {/* Block height block widget */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-black/80 backdrop-blur-md border border-brand-border text-xs font-semibold text-zinc-300 shadow-xl">
        <Layers className="w-3 h-3 text-kii-purple" />
        <span className="text-zinc-400 text-[11px]">Block</span>
        <motion.span 
          key={latestBlock}
          initial={{ opacity: 0.5, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-white text-[11px]"
        >
          #{latestBlock.toLocaleString()}
        </motion.span>
      </div>
    </div>
  );
};
