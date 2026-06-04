"use client";

import React from "react";
import { useWallet } from "@/contexts/WalletContext";
import { 
  Droplet, 
  HelpCircle, 
  ExternalLink, 
  CheckCircle2, 
  History
} from "lucide-react";

export default function Faucet() {
  const { 
    transactions
  } = useWallet();

  // Get faucet tx logs
  const faucetTxs = transactions.filter((tx) => tx.type.toLowerCase().includes("faucet"));

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Droplet className="w-8 h-8 text-kii-blue" />
          KiiChain Testnet Faucet
        </h1>
        <p className="text-zinc-400 text-sm">
          Claim free testnet KII tokens to run contract compilations, deployments, and playground experiments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Faucet Card */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-8 space-y-6 relative overflow-hidden flex flex-col justify-between min-h-[320px]">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-kii-blue/5 blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <span className="text-[10px] font-extrabold text-kii-blue bg-kii-blue/10 border border-kii-blue/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono inline-block">
              Gas Funding Required
            </span>
            <h2 className="text-xl font-bold text-white">Get Testnet KII Tokens</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              To deploy contracts, mint collections, and interact with template tools on the Kii Builder Hub, you need gas tokens. The official KiiChain Testnet Faucet distributes free testnet KII daily to developer wallets.
            </p>
            
            <div className="p-4 bg-zinc-950 border border-brand-border rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-kii-blue" />
                How to Fund Your Wallet:
              </h4>
              <ul className="text-[11px] text-zinc-400 space-y-2 pl-5 list-disc leading-normal font-sans">
                <li>Copy your wallet address (EVM address for MetaMask, or Bech32 address starting with <code className="text-zinc-300 font-mono">kii...</code> for Keplr/Leap).</li>
                <li>Go to the official faucet, paste your address, solve the captcha, and click request.</li>
                <li>Once the faucet transaction is confirmed, your balance will update in the sidebar and complete your quest!</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-brand-border/40">
            <a
              href="https://explorer.kiichain.io/faucet"
              target="_blank"
              rel="noreferrer"
              className="flex-1 w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg bg-gradient-to-r from-kii-purple to-kii-blue hover:opacity-95 text-white font-bold text-xs tracking-wider uppercase transition-opacity shadow-lg shadow-kii-purple/15 text-center"
            >
              Open Official Faucet Website
              <ExternalLink className="w-4 h-4" />
            </a>
            
            <div className="text-[11px] text-zinc-500 font-mono text-center sm:text-left flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-kii-teal animate-pulse" />
              Official Faucet Online (oro_1336_1)
            </div>
          </div>
        </div>

        {/* Quick Guide Panel */}
        <div className="glass-panel rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-kii-purple" />
            Faucet Guidelines
          </h3>

          <div className="space-y-4 text-xs leading-normal">
            <div className="space-y-1">
              <h4 className="font-bold text-zinc-300">Rate Limit Rules</h4>
              <p className="text-zinc-500">10 KII per address every 24 hours. Rate limits prevent automated sybil claims on testnet.</p>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-bold text-zinc-300">Network Details</h4>
              <p className="text-zinc-500 font-mono text-[11px]">Chain-ID: oro_1336_1 / 1336</p>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-zinc-300">Verification</h4>
              <p className="text-zinc-500 font-sans">Once funded, reconnect or refresh your wallet state in the hub to update your progress.</p>
            </div>

            <div className="pt-3 border-t border-brand-border space-y-2">
              <a 
                href="https://explorer.kiichain.io/faucet" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-2 px-3 rounded bg-white/[0.03] hover:bg-white/[0.06] text-white border border-brand-border text-center text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
              >
                Official KiiChain Faucet
                <ExternalLink className="w-3.5 h-3.5 text-kii-blue" />
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* History Log */}
      <section className="glass-panel rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-400" />
          Your Faucet Claims
        </h3>

        {faucetTxs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-medium text-zinc-400">
              <thead>
                <tr className="border-b border-brand-border text-left text-zinc-500">
                  <th className="pb-3 font-semibold">Transaction Hash</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Block</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40 font-mono">
                {faucetTxs.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-white/[0.01]">
                    <td className="py-3 text-white font-bold truncate max-w-[180px]">{tx.hash}</td>
                    <td className="py-3 text-zinc-400 font-sans">{tx.type}</td>
                    <td className="py-3 text-kii-blue font-bold">+10.00 KII</td>
                    <td className="py-3 text-zinc-500">{tx.blockNumber}</td>
                    <td className="py-3 text-right">
                      <span className="px-1.5 py-0.2 rounded bg-kii-emerald/10 text-kii-emerald border border-kii-emerald/20 text-[10px] font-sans font-bold">
                        SUCCESS
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-600 font-medium">
            No faucet requests recorded. Fill out the input above to request KII.
          </div>
        )}
      </section>
    </div>
  );
}
