"use client";

import React, { useState } from "react";
import { useWallet, isEvmWallet, getEvmProviderObject } from "@/contexts/WalletContext";
import { 
  Wallet, 
  Settings, 
  Copy, 
  Check, 
  HelpCircle, 
  ShieldAlert, 
  Terminal, 
  CheckCircle2, 
  RefreshCw,
  Edit2
} from "lucide-react";
import { ethers } from "ethers";

export default function WalletTools() {
  const { 
    isConnected, 
    walletType, 
    displayAddress, 
    balance, 
    chainId, 
    connectWallet, 
    disconnectWallet, 
    addNetworkToMetaMask,
    addTransaction
  } = useWallet();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [signMessage, setSignMessage] = useState<string>("Sign this message to authenticate on KiiChain");
  const [signature, setSignature] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSign = async () => {
    if (!displayAddress || !isEvmWallet(walletType)) {
      alert("Please connect an EVM wallet to sign messages.");
      return;
    }
    setIsSigning(true);
    setSignature(null);

    // Real EVM signing
    try {
      const providerObj = getEvmProviderObject(walletType);
      if (!providerObj) {
        throw new Error("Provider object not found for the selected wallet.");
      }
      const provider = new ethers.BrowserProvider(providerObj);
      const signer = await provider.getSigner();
      const sig = await signer.signMessage(signMessage);
      setSignature(sig);

      addTransaction({
        hash: "0x_sign_" + Math.random().toString(36).substring(2, 12),
        type: "Personal Sign",
        status: "success",
        gasUsed: "0",
        blockNumber: 4821000,
        details: `Signed message: "${signMessage}"`
      });
    } catch (err: any) {
      console.error("Sign message failed:", err);
      alert(err.message || "Message signing was cancelled or failed");
    } finally {
      setIsSigning(false);
    }
  };

  const wallets = [
    { id: "metamask", name: "MetaMask", type: "EVM Wallet", logo: "/Metamask.png", color: "from-orange-500/10 to-amber-500/5 border-orange-500/20 text-orange-400 hover:border-orange-500/40" },
    { id: "coinbase", name: "Coinbase Wallet", type: "EVM Wallet", logo: "/coinbase.png", color: "from-blue-600/10 to-blue-500/5 border-blue-500/20 text-blue-400 hover:border-blue-500/40" },
    { id: "trust", name: "Trust Wallet", type: "EVM Wallet", logo: "/trust.png", color: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40" },
    { id: "rainbow", name: "Rainbow Wallet", type: "EVM Wallet", logo: "/Rainbow.png", color: "from-pink-500/10 to-violet-500/5 border-pink-500/20 text-pink-400 hover:border-pink-500/40" },
    { id: "rabby", name: "Rabby Wallet", type: "EVM Wallet", logo: "/Rabby.png", color: "from-cyan-500/10 to-blue-500/5 border-cyan-500/20 text-cyan-400 hover:border-cyan-500/40" },
    { id: "keplr", name: "Keplr Wallet", type: "Cosmos Wallet", logo: "/Keplr.png", color: "from-indigo-500/10 to-purple-500/5 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/40" },
    { id: "leap", name: "Leap Wallet", type: "Cosmos Wallet", logo: "/Leap.png", color: "from-green-500/10 to-emerald-500/5 border-green-500/20 text-green-400 hover:border-green-500/40" },
  ];

  const wrongNetwork = isEvmWallet(walletType) && chainId !== 1336;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Settings className="w-8 h-8 text-kii-purple" />
          Wallet Diagnostics & Tools
        </h1>
        <p className="text-zinc-400 text-sm">
          Diagnose connection parameters, sign messages, and configure developer wallets for KiiChain.
        </p>
      </div>

      {/* Network Alert (Wrong Network Banner) */}
      {wrongNetwork && (
        <div className="p-4 rounded-xl border border-amber-500/35 bg-amber-500/[0.02] flex items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2.5 text-amber-400">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-bold">Wrong Network Detected:</span> Connected to Chain ID {chainId} instead of KiiChain EVM Testnet (Chain ID 1336).
            </div>
          </div>
          
          <button
            onClick={addNetworkToMetaMask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider text-[10px] transition-colors"
          >
            Switch to KiiChain
          </button>
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Connect grid */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Diagnostic Info */}
          <div className="glass-panel rounded-xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white">Wallet Connection Profile</h3>
            
            {isConnected ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-950 border border-brand-border space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Connection Wallet</span>
                  <span className="text-sm font-bold text-white block capitalize">{walletType}</span>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950 border border-brand-border space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">KII Balance</span>
                  <span className="text-sm font-bold text-kii-blue block">{balance} KII</span>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950 border border-brand-border sm:col-span-2 space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Wallet Public Key Address</span>
                  <div className="flex items-center justify-between gap-3 bg-brand-dark/60 p-2 rounded border border-brand-border/40">
                    <span className="text-xs font-mono text-zinc-300 truncate select-all">{displayAddress}</span>
                    <button
                      onClick={() => handleCopy(displayAddress || "", "addr")}
                      className="p-1 rounded hover:bg-white/[0.04] text-zinc-500 hover:text-white"
                    >
                      {copiedField === "addr" ? (
                        <Check className="w-3.5 h-3.5 text-kii-teal" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    onClick={disconnectWallet}
                    className="py-2.5 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs tracking-wider uppercase border border-red-500/20 transition-colors"
                  >
                    Disconnect Wallet Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Spotlight Recommended MetaMask Card */}
                <div className="p-5 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-amber-500/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-orange-500/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500/5 to-transparent w-36 h-full skew-x-12 pointer-events-none" />
                  <div className="flex items-center gap-4 text-left">
                    <img src="/Metamask.png" alt="MetaMask Logo" className="w-10 h-10 object-contain filter drop-shadow" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">MetaMask</h4>
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-widest animate-pulse">Recommended</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">Primary EVM Web3 wallet provider for KiiChain</span>
                    </div>
                  </div>
                  <button
                    onClick={() => connectWallet("metamask")}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-wider text-xs transition-all shadow-md active:scale-98"
                  >
                    Connect MetaMask
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-[1px] flex-1 bg-zinc-800" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Other Supported Wallets</span>
                  <div className="h-[1px] flex-1 bg-zinc-800" />
                </div>

                {/* Grid for alternative wallets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {wallets.filter(w => w.id !== "metamask").map((w) => (
                    <button
                      key={w.id}
                      onClick={() => connectWallet(w.id as any)}
                      className={`glass-panel p-4 rounded-xl border hover:border-white/10 hover:scale-[1.01] active:scale-99 transition-all bg-gradient-to-br ${w.color} flex flex-col items-center justify-center text-center gap-2`}
                    >
                      <img src={w.logo} alt={`${w.name} Logo`} className="w-8 h-8 object-contain flex-shrink-0" />
                      <div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-wider block truncate max-w-full">{w.name}</h4>
                        <span className="text-[8px] text-zinc-500 font-bold block mt-0.5">{w.type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Signing tool */}
          {isConnected && (
            <div className="glass-panel rounded-xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-kii-blue" />
                Diagnostic Message Signer
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400">Message to Sign</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={signMessage}
                      onChange={(e) => setSignMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950 border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:border-kii-blue/50 font-sans transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSign}
                  disabled={isSigning || !signMessage}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-kii-purple to-kii-blue text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-kii-purple/10 hover:opacity-95 transition-all flex items-center gap-2"
                >
                  {isSigning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Signing Message...
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-3.5 h-3.5" />
                      Sign Message Payload
                    </>
                  )}
                </button>

                {signature && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Cryptographic Signature</label>
                      <button
                        onClick={() => handleCopy(signature, "sig")}
                        className="text-[10px] font-semibold text-kii-blue hover:underline flex items-center gap-0.5"
                      >
                        {copiedField === "sig" ? "Copied" : "Copy Signature"}
                      </button>
                    </div>
                    <pre className="p-3 bg-zinc-950 border border-brand-border rounded-lg text-[10px] font-mono text-zinc-400 select-all leading-relaxed break-all whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {signature}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Info Panels */}
        <div className="space-y-6">
          
          {/* MetaMask Setup panel */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-kii-purple" />
              MetaMask Setup
            </h3>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              If you want to use real browser integrations, use this button to register the KiiChain testnet parameters automatically in MetaMask.
            </p>

            <button
              onClick={addNetworkToMetaMask}
              className="w-full py-2.5 px-4 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-white border border-brand-border text-xs font-bold transition-all"
            >
              Add KiiChain to MetaMask
            </button>
          </div>

          {/* Troubleshooting Guidelines */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-zinc-400" />
              Cosmos Key Details
            </h3>

            <div className="space-y-3 text-xs text-zinc-500 leading-normal">
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-300">Supported Cosmos Wallets</h4>
                <p>Keplr extension is supported. The extension requires adding the chain details under the chain configuration panels.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-300">Cosmos Chain ID</h4>
                <p className="font-mono text-[10px] text-zinc-400">oro_1336_1</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
