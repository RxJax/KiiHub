"use client";

import React from "react";
import { useWallet, isEvmWallet } from "@/contexts/WalletContext";
import { useQuests } from "@/contexts/QuestContext";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Wallet, 
  Droplet, 
  Layers, 
  Compass,
  Cpu
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GettingStarted() {
  const router = useRouter();
  const { isConnected, chainId, addNetworkToMetaMask, walletType } = useWallet();
  const { quests, completeQuest } = useQuests();

  const isFaucetClaimed = quests.find((q) => q.id === "claim_faucet")?.completed || false;
  const isContractDeployed = quests.find((q) => q.id === "deploy_token")?.completed || 
                             quests.find((q) => q.id === "deploy_nft")?.completed || false;

  const steps = [
    {
      id: "connect",
      title: "Connect Developer Wallet",
      description: "Connect MetaMask (EVM) or Keplr/Leap (Cosmos) to start building.",
      isDone: isConnected,
      buttonText: isConnected ? "Wallet Connected" : "Connect Wallet",
      link: "/wallet-tools",
      icon: Wallet,
      action: null,
    },
    {
      id: "network",
      title: isConnected && walletType && isEvmWallet(walletType) 
        ? `Add KiiChain to ${walletType.charAt(0).toUpperCase() + walletType.slice(1)}` 
        : "Add KiiChain to Wallet",
      description: "Automatically add EVM Chain ID 1336 and JSON-RPC settings to your connected wallet.",
      isDone: isConnected && isEvmWallet(walletType) && chainId === 1336,
      buttonText: chainId === 1336 ? "Network Added" : "Configure Network",
      link: null,
      icon: Cpu,
      action: addNetworkToMetaMask,
      disabled: !isConnected || !isEvmWallet(walletType),
    },
    {
      id: "faucet",
      title: "Fund Wallet via Faucet",
      description: "Request testnet KII to fund smart contract deployments and transactions.",
      isDone: isFaucetClaimed,
      buttonText: isFaucetClaimed ? "Tokens Claimed" : "Go to Faucet",
      link: null,
      icon: Droplet,
      action: () => {
        completeQuest("claim_faucet");
        router.push("/faucet");
      },
    },
    {
      id: "deploy",
      title: "Deploy Your First Contract",
      description: "Use one-click templates to deploy standard tokens directly to the KiiChain Testnet.",
      isDone: isContractDeployed,
      buttonText: isContractDeployed ? "Contract Deployed" : "Deploy Center",
      link: "/deploy",
      icon: Layers,
      action: null,
    },
  ];

  const completedSteps = steps.filter((s) => s.isDone).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Compass className="w-8 h-8 text-kii-purple" />
          Onboarding Roadmap
        </h1>
        <p className="text-zinc-400 text-sm">
          Follow this 4-step checklist to learn the fundamentals of building on KiiChain.
        </p>
      </div>

      {/* Progress Summary */}
      <div className="glass-panel rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Overall Progress</div>
          <div className="text-2xl font-extrabold text-white">
            {completedSteps} of {steps.length} Steps Complete
          </div>
        </div>

        <div className="flex-1 md:max-w-md w-full space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-zinc-500">Completion</span>
            <span className="text-kii-blue">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-950 border border-brand-border overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-kii-purple to-kii-blue transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Checklist */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <div 
              key={step.id} 
              className={`glass-panel rounded-xl p-5 flex items-start gap-4 transition-all duration-200 border ${
                step.isDone 
                  ? "border-kii-emerald/20 bg-kii-emerald/[0.01]" 
                  : "border-brand-border"
              }`}
            >
              {/* Checkmark Circle */}
              <div className="pt-1 flex-shrink-0">
                {step.isDone ? (
                  <CheckCircle2 className="w-6 h-6 text-kii-emerald fill-kii-emerald/10" />
                ) : (
                  <Circle className="w-6 h-6 text-zinc-600" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-zinc-500">STEP 0{idx + 1}</span>
                  {step.isDone && (
                    <span className="text-[10px] font-bold text-kii-emerald tracking-wide uppercase px-1.5 py-0.2 rounded bg-kii-emerald/10 border border-kii-emerald/20">
                      Completed
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <StepIcon className={`w-4 h-4 ${step.isDone ? "text-kii-emerald" : "text-kii-blue"}`} />
                  {step.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-normal max-w-2xl">
                  {step.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0 self-center">
                {step.action ? (
                  <button
                    onClick={() => step.action?.()}
                    disabled={step.disabled || step.isDone}
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                      step.isDone
                        ? "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                        : step.disabled
                        ? "bg-white/[0.02] border border-white/[0.04] text-zinc-600 cursor-not-allowed"
                        : "bg-kii-purple hover:bg-kii-purple-hover text-white shadow-lg shadow-kii-purple/15"
                    }`}
                  >
                    {step.buttonText}
                  </button>
                ) : step.link ? (
                  <Link
                    href={step.isDone ? "#" : step.link}
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                      step.isDone
                        ? "bg-zinc-900 border border-zinc-800 text-zinc-500 pointer-events-none"
                        : "bg-zinc-900 border border-brand-border hover:bg-zinc-800 text-white"
                    }`}
                  >
                    {step.buttonText}
                    {!step.isDone && <ArrowRight className="w-3.5 h-3.5" />}
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
