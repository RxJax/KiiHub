"use client";

import React, { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useQuests } from "@/contexts/QuestContext";
import { 
  Code, 
  Settings, 
  CheckCircle2, 
  ExternalLink, 
  Cpu, 
  Sparkles,
  Layers,
  ChevronRight,
  Database,
  ArrowRight,
  HelpCircle,
  Activity,
  AlertTriangle,
  X,
  Circle,
  Image,
  Droplet,
  Lock
} from "lucide-react";

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  fields: { id: string; label: string; placeholder: string; defaultValue: string }[];
}

const TEMPLATES: ContractTemplate[] = [
  {
    id: "fast-deploy",
    name: "Fast Deploy (Token + NFT)",
    description: "Deploy both a standard utility token and a collectible NFT collection sequentially in a single automated flow.",
    difficulty: "Beginner",
    fields: [
      { id: "tokenName", label: "Token Name", placeholder: "e.g. Kii Builder Coin", defaultValue: "Kii Builder Token" },
      { id: "tokenSymbol", label: "Token Symbol", placeholder: "e.g. KBC", defaultValue: "KBC" },
      { id: "nftName", label: "NFT Collection Name", placeholder: "e.g. Kii Pioneers", defaultValue: "Kii Pioneers" },
      { id: "nftSymbol", label: "NFT Collection Symbol", placeholder: "e.g. KPION", defaultValue: "KPION" },
    ]
  },
  {
    id: "token",
    name: "Deploy Token",
    description: "Initialize a standard governance or utility token with a customizable name, symbol, and mintable supply.",
    difficulty: "Beginner",
    fields: [
      { id: "name", label: "Token Name", placeholder: "e.g. Kii Builder Coin", defaultValue: "Kii Builder Token" },
      { id: "symbol", label: "Token Symbol", placeholder: "e.g. KBC", defaultValue: "KBC" },
      { id: "supply", label: "Initial Supply", placeholder: "e.g. 1,000,000", defaultValue: "1000000" },
    ]
  },
  {
    id: "nft",
    name: "Deploy NFT",
    description: "Launch a collectible NFT collection template, ready to mint with customizable metadata storage folders.",
    difficulty: "Beginner",
    fields: [
      { id: "name", label: "Collection Name", placeholder: "e.g. Kii Pioneers", defaultValue: "Kii Pioneers" },
      { id: "symbol", label: "Collection Symbol", placeholder: "e.g. KPION", defaultValue: "KPION" },
      { id: "baseUri", label: "Token URI", placeholder: "e.g. ipfs://...", defaultValue: "ipfs://QmPioneers/" },
    ]
  },
  {
    id: "swap-pool",
    name: "Deploy KiiSwap Pool",
    description: "Launch a custom liquidity pool smart contract. Depositing KII allows users to swap stablecoins for KII and vice versa.",
    difficulty: "Intermediate",
    fields: [
      { id: "name", label: "Stablecoin ERC20 Address", placeholder: "e.g. 0xToken...", defaultValue: "" },
      { id: "symbol", label: "Rate (tokens per 1 KII * 100)", placeholder: "e.g. 245 = 2.45 tokens", defaultValue: "245" },
      { id: "interval", label: "Initial KII Funding Amount", placeholder: "e.g. 1 KII", defaultValue: "1" }
    ]
  }
];

export default function Deploy() {
  const { isConnected, walletType, executeContractDeployment, displayAddress } = useWallet();
  const { addXp } = useQuests();
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [formParams, setFormParams] = useState<{ [key: string]: string }>({});
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployResult, setDeployResult] = useState<{ success: boolean; txHash?: string; contractAddress?: string; error?: string } | null>(null);

  const handleOpenModal = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    // Initialize default values
    const defaults: { [key: string]: string } = {};
    template.fields.forEach((f) => {
      defaults[f.id] = f.defaultValue;
    });
    setFormParams(defaults);
    setDeployResult(null);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
    setDeployResult(null);
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setIsDeploying(true);
    setDeployResult(null);

    try {
      if (selectedTemplate.id === "fast-deploy") {
        // Deploy Token first
        const tokenRes = await executeContractDeployment("token", {
          name: formParams["tokenName"] || "Kii Builder Token",
          symbol: formParams["tokenSymbol"] || "KBC",
          supply: "1000000"
        });

        if (!tokenRes.success) {
          throw new Error(`Token Deployment failed: ${tokenRes.error}`);
        }

        // Deploy NFT second
        const nftRes = await executeContractDeployment("nft", {
          name: formParams["nftName"] || "Kii Pioneers",
          symbol: formParams["nftSymbol"] || "KPION",
          baseUri: "ipfs://QmPioneers/"
        });

        if (!nftRes.success) {
          throw new Error(`NFT Deployment failed: ${nftRes.error}. (Token deployed at ${tokenRes.contractAddress})`);
        }

        setDeployResult({
          success: true,
          contractAddress: `Token: ${tokenRes.contractAddress}\nNFT Collection: ${nftRes.contractAddress}`,
          txHash: `Token Deploy: ${tokenRes.txHash}\nNFT Deploy: ${nftRes.txHash}`
        });

        // Award one-time deployment XP
        if (displayAddress) {
          const userAddr = displayAddress.toLowerCase();
          const xpKey = `kii_deploy_xp_awarded_${selectedTemplate.id}_${userAddr}`;
          const alreadyAwarded = localStorage.getItem(xpKey);
          if (!alreadyAwarded) {
            addXp(200);
            localStorage.setItem(xpKey, "true");
          }
        }
      } else {
        const res = await executeContractDeployment(selectedTemplate.id, formParams);
        setDeployResult(res);

        // Award one-time deployment XP
        if (res.success && displayAddress) {
          const userAddr = displayAddress.toLowerCase();
          const xpKey = `kii_deploy_xp_awarded_${selectedTemplate.id}_${userAddr}`;
          const alreadyAwarded = localStorage.getItem(xpKey);
          if (!alreadyAwarded) {
            let xpToAward = 100;
            if (selectedTemplate.id === "swap-pool") xpToAward = 300;
            addXp(xpToAward);
            localStorage.setItem(xpKey, "true");
          }
        }
      }
    } catch (err: any) {
      setDeployResult({
        success: false,
        error: err.reason || err.message || "Deployment execution rejected or timed out."
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-8">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rocket-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(3deg); }
        }
        .animate-rocket {
          display: inline-block;
          animation: rocket-float 3.5s infinite ease-in-out;
        }
      `}} />
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/40 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-kii-purple/10 border border-kii-purple/20 flex items-center justify-center text-kii-purple-light shadow-lg shadow-kii-purple/5">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
              Deploy
              <span className="text-4xl select-none animate-rocket hover:scale-110 active:scale-95 transition-transform duration-300 cursor-pointer" title="Deploying is rocket science!">🚀</span>
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Deploy pre-compiled smart contract templates directly to KiiChain in one click. <span className="text-kii-teal font-semibold">(XP rewards are one-time only per template)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((tpl) => {
          // Define accent styles based on template ID
          let themeColor = "from-pink-500 to-rose-600 animate-pulse";
          let themeBorder = "hover:border-pink-500/35";
          let iconBg = "bg-pink-500/10 border-pink-500/30 text-pink-400";
          let textColor = "text-pink-400";
          let xpReward = "+200 XP (ONE-TIME)";
          
          if (tpl.id === "token") {
            themeColor = "from-amber-500 to-orange-600";
            themeBorder = "hover:border-orange-500/35";
            iconBg = "bg-orange-500/10 border-orange-500/30 text-orange-400";
            textColor = "text-orange-400";
            xpReward = "+100 XP (ONE-TIME)";
          } else if (tpl.id === "nft") {
            themeColor = "from-cyan-500 to-blue-600";
            themeBorder = "hover:border-cyan-500/35";
            iconBg = "bg-cyan-500/10 border-cyan-500/30 text-cyan-400";
            textColor = "text-cyan-400";
            xpReward = "+100 XP (ONE-TIME)";
          } else if (tpl.id === "swap-pool") {
            themeColor = "from-purple-500 to-indigo-600";
            themeBorder = "hover:border-purple-500/35";
            iconBg = "bg-purple-500/10 border-purple-500/30 text-purple-400";
            textColor = "text-purple-400";
            xpReward = "+300 XP (ONE-TIME)";
          }

          return (
            <div 
              key={tpl.id} 
              className={`relative overflow-hidden rounded-2xl glass-panel ${themeBorder} p-6 flex flex-col justify-between h-[270px] shadow-2xl hover:scale-[1.01] transition-all duration-300 group`}
            >
              {/* Premium Top Glow/Accent Line */}
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${themeColor}`} />

              <div className="space-y-4">
                {/* Row: Icon and Title */}
                <div className="flex start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${iconBg} shadow-inner`}>
                    {/* Render matching icon */}
                    {tpl.id === "fast-deploy" && <Sparkles className="w-5 h-5" />}
                    {tpl.id === "token" && <Circle className="w-5 h-5" />}
                    {tpl.id === "nft" && <Image className="w-5 h-5" />}
                    {tpl.id === "faucet" && <Droplet className="w-5 h-5" />}
                    {tpl.id === "payment" && <Lock className="w-5 h-5" />}
                    {tpl.id === "dao" && <Cpu className="w-5 h-5" />}
                    {tpl.id === "swap-pool" && <Layers className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className={`text-md font-bold text-white tracking-tight leading-snug group-hover:${textColor} transition-colors`}>
                      {tpl.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{tpl.difficulty}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed font-medium line-clamp-3">
                  {tpl.description}
                </p>
              </div>

              {/* Bottom Row: XP Badge and CTA Button */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-800/40">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-kii-teal/5 border border-kii-teal/20 text-[10px] font-extrabold text-kii-teal tracking-wide uppercase">
                  {xpReward}
                </span>

                <button
                  onClick={() => handleOpenModal(tpl)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-brand-border text-white text-xs font-bold transition-all active:scale-[0.98]"
                >
                  Configure & Deploy
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deploy Modal Overlay */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel rounded-xl border border-brand-border overflow-hidden relative shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-brand-border bg-brand-black/90 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">{selectedTemplate.name} Configuration</h3>
                <span className="text-[10px] text-zinc-500 mt-1 block">Specify initialization parameters.</span>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-1 rounded-md hover:bg-white/[0.04] text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleDeploy} className="p-6 space-y-6">
              {deployResult ? (
                // Success/Error View
                <div className="space-y-5">
                  <div className="flex flex-col items-center text-center p-4 space-y-3">
                    {deployResult.success ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-kii-emerald/10 border border-kii-emerald/20 flex items-center justify-center text-kii-emerald">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Contract Successfully Deployed!</h4>
                        <p className="text-xs text-zinc-400 leading-normal max-w-sm">
                          Your contract instance is now active on the KiiChain network.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Deployment Failed</h4>
                        <p className="text-xs text-zinc-400 leading-normal max-w-sm">
                          {deployResult.error || "An error occurred during transaction execution."}
                        </p>
                      </>
                    )}
                  </div>

                  {deployResult.success && (
                    <div className="space-y-3 font-mono text-[11px]">
                      {deployResult.contractAddress?.split('\n').map((line, idx) => {
                        const isMulti = deployResult.contractAddress?.includes('\n');
                        const label = isMulti ? line.split(': ')[0] : 'Contract';
                        const address = isMulti ? line.split(': ')[1] : line;
                        return (
                          <div key={idx} className="p-3 rounded-lg bg-zinc-950 border border-brand-border space-y-2">
                            <div className="flex items-center justify-between text-zinc-500">
                              <span>{label} Address:</span>
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(address || "")}
                                className="text-kii-blue hover:underline font-sans font-bold"
                              >
                                Copy
                              </button>
                            </div>
                            <span className="text-white block select-all break-all">{address}</span>
                          </div>
                        );
                      })}

                      {deployResult.txHash?.split('\n').map((line, idx) => {
                        const isMulti = deployResult.txHash?.includes('\n');
                        const label = isMulti ? line.split(': ')[0] : 'Transaction';
                        const hash = isMulti ? line.split(': ')[1] : line;
                        return (
                          <div key={idx} className="p-3 rounded-lg bg-zinc-950 border border-brand-border space-y-2">
                            <div className="flex items-center justify-between text-zinc-500">
                              <span>{label} Hash:</span>
                              <a
                                href={`https://explorer.kiichain.io/tx/${hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-kii-blue hover:underline font-sans font-bold flex items-center gap-0.5"
                              >
                                View Explorer
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            <span className="text-white block select-all break-all">{hash}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full py-2.5 px-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-white border border-brand-border text-xs font-bold transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                // Input Fields View
                <div className="space-y-4">
                  {!isConnected && (
                    <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      No wallet connected. Please connect MetaMask to deploy contracts on KiiChain.
                    </div>
                  )}

                  {selectedTemplate.fields.map((f) => (
                    <div key={f.id} className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400">{f.label}</label>
                      <input
                        type="text"
                        value={formParams[f.id] || ""}
                        onChange={(e) => setFormParams({ ...formParams, [f.id]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:border-kii-blue/50 font-sans transition-all"
                        required
                      />
                    </div>
                  ))}

                  <div className="pt-4 border-t border-brand-border flex items-center justify-between text-xs font-semibold text-zinc-500">
                    <span>Env: {walletType || "Testnet"}</span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 py-2.5 rounded-lg bg-white/[0.02] border border-brand-border text-white text-xs font-bold transition-all hover:bg-white/[0.05]"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isDeploying}
                      className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-kii-purple to-kii-blue text-white text-xs font-bold transition-all hover:opacity-95 shadow-lg shadow-kii-purple/10 flex items-center justify-center gap-2"
                    >
                      {isDeploying ? (
                        <>
                          <Activity className="w-3.5 h-3.5 animate-spin" />
                          Deploying Contract...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Deploy Contract
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
