"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Compass, 
  Droplet, 
  Cpu, 
  Activity, 
  Wallet, 
  Code, 
  Trophy, 
  BookOpen, 
  Terminal,
  Layers,
  LogOut,
  User,
  Award,
  Gamepad2,
  RefreshCw,
  BarChart2,
  X
} from "lucide-react";
import { useWallet } from "../contexts/WalletContext";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navigationGroups = [
  {
    category: "CORE",
    items: [
      { name: "Dashboard", path: "/", icon: LayoutDashboard },
      { name: "Getting started", path: "/getting-started", icon: Compass },
    ]
  },
  {
    category: "ECOSYSTEM",
    items: [
      { name: "KiiSwap DEX", path: "/kiiswap", icon: RefreshCw, isNew: true },
      { name: "Kii Arcade", path: "/gaming", icon: Gamepad2 },
    ]
  },
  {
    category: "CAMPAIGNS",
    items: [
      { name: "Testnet Quests", path: "/quests", icon: Trophy },
      { name: "Builder profile", path: "/profile", icon: User },
      { name: "Hall of fame", path: "/hall-of-fame", icon: Award },
    ]
  },
  {
    category: "BUILDER TOOLS",
    items: [
      { name: "Deploy contracts", path: "/deploy", icon: Code },
      { name: "Faucet", path: "/faucet", icon: Droplet },
      { name: "Explorer", path: "/explorer", icon: Activity },
      { name: "Wallet tools", path: "/wallet-tools", icon: Wallet },
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { 
    isConnected, 
    walletType, 
    displayAddress, 
    disconnectWallet, 
    balance,
    connectWallet,
    chainId,
    addNetworkToMetaMask,
    latestBlock
  } = useWallet();
  
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <aside className={`w-64 h-screen border-r border-brand-border bg-brand-black/90 flex flex-col justify-between select-none fixed left-0 top-0 z-50 backdrop-blur-xl transition-transform duration-300 ${
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    }`}>
      {/* Top Section - Logo & Level */}
      <div className="flex flex-col pt-6 overflow-y-auto flex-1">
        {/* Logo */}
        <div className="px-6 pb-7 border-b border-brand-border/40 relative">
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes logo-float {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-4px) scale(1.03); }
            }
            @keyframes logo-glow {
              0%, 100% { opacity: 0.4; transform: scale(1); filter: blur(8px); }
              50% { opacity: 0.75; transform: scale(1.2); filter: blur(12px); }
            }
            @keyframes text-gradient-shift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animate-logo-float {
              animation: logo-float 3.5s ease-in-out infinite;
            }
            .animate-logo-glow {
              animation: logo-glow 3.5s ease-in-out infinite;
            }
            .animate-text-gradient {
              background-size: 200% auto;
              animation: text-gradient-shift 3s linear infinite;
            }
          `}} />

          <Link href="/" className="flex flex-col items-center justify-center text-center group relative gap-3">
            {/* Logo Icon */}
            <div className="relative w-20 h-20 flex items-center justify-center animate-logo-float flex-shrink-0">
              {/* Glowing pulsing aura behind the icon */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-kii-purple via-indigo-500 to-kii-blue opacity-55 animate-logo-glow pointer-events-none blur-lg" />
              <img 
                src="/KiiHub.png" 
                alt="KiiHub Logo" 
                className="relative w-full h-full object-contain scale-[1.35] group-hover:scale-[1.45] transition-transform duration-300 filter drop-shadow-[0_0_12px_rgba(168,85,247,0.25)]" 
              />
            </div>

            {/* Logo Text & Glowing Line */}
            <div className="w-full flex flex-col items-center">
              <div className="flex items-center justify-center gap-0.5">
                <span className="font-black text-white tracking-tight text-2xl font-sans">Kii</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 font-black text-2xl animate-text-gradient font-sans">Hub</span>
              </div>
              
              {/* Glowing divider line from mockup */}
              <div className="relative w-full h-[1px] my-2.5 flex items-center justify-center">
                <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute w-12 h-[2px] bg-indigo-300 blur-[0.5px] shadow-[0_0_10px_#8b5cf6,0_0_4px_#ffffff]" />
              </div>

              <div className="text-[9.5px] font-semibold tracking-wide font-sans leading-relaxed text-zinc-300">
                <span>Your Gateway to </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-bold">KiiChain</span>
                <span> Testnet</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Mobile Network Info Widgets */}
        <div className="lg:hidden px-5 py-3 border-b border-brand-border/40 bg-zinc-950/20 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span>Status</span>
            <div className="flex items-center gap-1.5 text-kii-teal font-extrabold">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kii-teal opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-kii-teal"></span>
              </span>
              ONLINE
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-brand-border/60 text-xs">
              <span className="text-zinc-500 text-[10.5px]">Network</span>
              <span className="text-zinc-300 font-bold text-[10.5px]">Testnet EVM</span>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-brand-border/60 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10.5px]">
                <Layers className="w-3 h-3 text-kii-purple" />
                Block
              </div>
              <span className="font-mono text-white text-[10.5px] font-bold">
                #{latestBlock?.toLocaleString() || "0"}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="mt-4 px-3 space-y-4">
          {navigationGroups.map((group) => (
            <div key={group.category} className="space-y-1">
              {/* Category Header */}
              <span className="px-3 text-[9px] font-bold text-zinc-500 uppercase tracking-widest block select-none">
                {group.category}
              </span>
              
              {/* Items List */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 group border border-transparent ${
                        isActive
                          ? "bg-cyan-500/[0.03] text-white border-l-2 border-l-cyan-400 border-t-transparent border-b-transparent border-r-transparent shadow-[inset_0_0_8px_rgba(6,182,212,0.03)] font-black"
                          : "text-zinc-400 hover:text-cyan-200/90 hover:bg-white/[0.02] border-l-transparent border-t-transparent border-b-transparent border-r-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 transition-colors flex-shrink-0 ${
                        isActive ? "text-cyan-400" : "text-zinc-500/80 group-hover:text-cyan-400/80"
                      }`} />
                      <span>{item.name}</span>
                      {item.isNew && (
                        <span className="ml-auto text-[8.5px] font-black text-zinc-950 border border-emerald-400 bg-emerald-400 px-1.5 py-0.2 rounded uppercase tracking-wider animate-pulse leading-none flex items-center justify-center">
                          NEW
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Section - Wallet Status */}
      <div className="p-4 border-t border-brand-border/40 bg-brand-dark/50 space-y-3.5">

        {/* Wallet Status Area */}
        {isConnected && displayAddress ? (
          walletType === "metamask" && chainId !== 1336 ? (
            <button
              onClick={addNetworkToMetaMask}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-xs font-semibold cursor-pointer transition-colors text-center shadow-lg"
              title="Wrong network. Click to switch to KiiChain Testnet."
            >
              <span>⚠️ Wrong Network</span>
              <span className="text-[10px] underline block">(Switch Chain)</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-brand-border flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-kii-purple to-kii-blue flex-shrink-0 flex items-center justify-center text-xs shadow-md border border-white/10">
                  {walletType === "metamask" ? "🦊" : "🌌"}
                </div>
                <div className="flex flex-col min-w-0 font-mono">
                  <span className="text-[9.5px] text-zinc-500 leading-none">{walletType === "metamask" ? "Metamask Connected" : "Keplr Connected"}</span>
                  <span className="text-[10px] font-black text-white truncate max-w-[100px] mt-0.5">
                    {truncateAddress(displayAddress)}
                  </span>
                  <span className="text-[10px] font-bold text-kii-blue mt-0.5">
                    {balance} KII
                  </span>
                </div>
              </div>
              <button
                onClick={disconnectWallet}
                className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                title="Disconnect Wallet"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        ) : (
          <button
            onClick={() => connectWallet("metamask")}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-kii-purple to-kii-blue hover:opacity-95 text-white font-bold text-xs tracking-wider uppercase transition-opacity shadow-lg shadow-kii-purple/10"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        )}

        {/* Footer Credits */}
        <div className="text-[10px] text-zinc-500 font-medium text-center pt-3 border-t border-brand-border/20 mt-2 font-mono leading-relaxed flex flex-wrap justify-center items-center gap-x-1.5 gap-y-0.5">
          <span className="text-zinc-300 whitespace-nowrap">
            Designed & Developed by{" "}
            <a
              href="https://x.com/rxjax007"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 hover:[text-shadow:0_0_6px_rgba(34,211,238,0.6)] transition-all duration-300 font-bold"
            >
              rxjax
            </a>
          </span>
          <span className="text-zinc-600 select-none">•</span>
          <span className="text-zinc-600 text-[9.5px] whitespace-nowrap">
            Special Thanks:{" "}
            <a
              href="https://x.com/cryptoadvancers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-cyan-400 hover:[text-shadow:0_0_6px_rgba(34,211,238,0.6)] transition-all duration-300 font-medium"
            >
              Crypto Advancers
            </a>
          </span>
        </div>
      </div>
    </aside>
  );
};
