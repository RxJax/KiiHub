"use client";

import React from "react";
import { useWallet, WalletType } from "@/contexts/WalletContext";
import { ShieldAlert, Zap, AlertTriangle } from "lucide-react";
import { usePathname } from "next/navigation";

interface WalletGuardProps {
  children: React.ReactNode;
}

export const WalletGuard: React.FC<WalletGuardProps> = ({ children }) => {
  const { isConnected, connectWallet } = useWallet();
  const pathname = usePathname();

  // Exclude simple info/onboarding routes and dashboard home from block
  const isExcluded = pathname === "/getting-started" || pathname === "/";

  if (isConnected || isExcluded) {
    return <>{children}</>;
  }

  const wallets = [
    { id: "metamask", name: "MetaMask", desc: "EVM Wallet", logo: "/Metamask.png", color: "from-orange-500/10 to-amber-500/5 border-orange-500/20 text-orange-400 hover:border-orange-500/40" },
    { id: "coinbase", name: "Coinbase", desc: "EVM Wallet", logo: "/coinbase.png", color: "from-blue-600/10 to-blue-500/5 border-blue-500/20 text-blue-400 hover:border-blue-500/40" },
    { id: "trust", name: "Trust Wallet", desc: "EVM Wallet", logo: "/trust.png", color: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40" },
    { id: "rainbow", name: "Rainbow", desc: "EVM Wallet", logo: "/Rainbow.png", color: "from-pink-500/10 to-violet-500/5 border-pink-500/20 text-pink-400 hover:border-pink-500/40" },
    { id: "rabby", name: "Rabby", desc: "EVM Wallet", logo: "/Rabby.png", color: "from-cyan-500/10 to-blue-500/5 border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40" },
    { id: "keplr", name: "Keplr", desc: "Cosmos Wallet", logo: "/Keplr.png", color: "from-indigo-500/10 to-purple-500/5 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40" },
    { id: "leap", name: "Leap Wallet", desc: "Cosmos Wallet", logo: "/Leap.png", color: "from-green-500/10 to-emerald-500/5 border-green-500/20 text-green-400 hover:border-green-500/40" },
  ];

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center p-4">
      {/* Blurred background panel mock */}
      <div className="absolute inset-0 bg-brand-dark/20 backdrop-blur-md z-0 rounded-2xl border border-brand-border/40 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl glass-panel border border-brand-border/80 shadow-2xl bg-zinc-950/70 text-center space-y-6">
        {/* Glow behind Shield */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-kii-purple/20 blur-xl pointer-events-none" />
        
        {/* Icon Lock */}
        <div className="w-16 h-16 rounded-full bg-kii-purple/15 border border-kii-purple/35 flex items-center justify-center mx-auto shadow-lg shadow-kii-purple/10">
          <ShieldAlert className="w-8 h-8 text-kii-purple-light animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-wide">
            KiiChain Connection Required
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            This module requires a connected Web3 developer wallet. Connect MetaMask (recommended) or another supported EVM/Cosmos wallet to deploy contracts, claim faucet tokens, and swap assets.
          </p>
        </div>

        {/* Connect Buttons */}
        <div className="space-y-3 pt-2">
          {/* Recommended MetaMask Card */}
          <button
            onClick={() => connectWallet("metamask")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r from-orange-500/20 to-amber-500/5 border-orange-500/40 hover:border-orange-500/70 hover:scale-[1.01] active:scale-99 transition-all text-left shadow-lg shadow-orange-500/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500/10 to-transparent w-24 h-full skew-x-12 pointer-events-none group-hover:translate-x-2 transition-transform duration-500" />
            <img src="/Metamask.png" alt="MetaMask Logo" className="w-9 h-9 object-contain filter drop-shadow" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase tracking-wider text-white">
                  MetaMask
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-widest animate-pulse">
                  Recommended
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                Primary EVM Wallet for KiiChain Developer tools
              </span>
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 py-1">
            <div className="h-[1px] flex-1 bg-zinc-800" />
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Other Supported Wallets</span>
            <div className="h-[1px] flex-1 bg-zinc-800" />
          </div>

          {/* Grid for alternative wallets */}
          <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {wallets.filter(w => w.id !== "metamask").map((w) => (
              <button
                key={w.id}
                onClick={() => connectWallet(w.id as WalletType)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border bg-gradient-to-b hover:scale-[1.01] active:scale-99 transition-all text-left ${w.color}`}
              >
                <img src={w.logo} alt={`${w.name} Logo`} className="w-6 h-6 object-contain flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white block truncate">
                    {w.name}
                  </span>
                  <span className="text-[8px] text-zinc-400 block truncate">
                    {w.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 text-[10px] text-zinc-500 font-mono flex items-center justify-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Ensure your wallet is switched to KiiChain Testnet (Chain ID 1336).
        </div>
      </div>
    </div>
  );
};
