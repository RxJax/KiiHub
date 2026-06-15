"use client";

import React, { useState, useEffect } from "react";
import { useWallet, isEvmWallet } from "../contexts/WalletContext";
import { useQuests } from "../contexts/QuestContext";
import { useTheme } from "../contexts/ThemeContext";
import { 
  Search, 
  ChevronDown, 
  ShieldCheck, 
  AlertCircle, 
  Coins, 
  ArrowRight, 
  Clock, 
  Zap, 
  Layers, 
  Award, 
  TrendingUp, 
  Compass, 
  Wallet, 
  Server, 
  CheckCircle2, 
  HelpCircle, 
  Activity, 
  ArrowLeftRight, 
  Copy, 
  QrCode, 
  Crown, 
  Play, 
  Check, 
  FileCode, 
  ExternalLink,
  FileText,
  Gamepad2,
  Trophy,
  RefreshCw,
  Sun,
  Moon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchItem {
  title: string;
  description: string;
  category: "Pages & Tools" | "Developer Quests" | "Smart Contracts";
  path: string;
  icon: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  // Pages & Tools
  { title: "Faucet", description: "Claim testnet KII gas tokens", category: "Pages & Tools", path: "/faucet", icon: "Coins" },
  { title: "Smart Contract Deployer", description: "Deploy token, NFT, or custom templates", category: "Pages & Tools", path: "/deploy", icon: "Layers" },
  { title: "Block Explorer", description: "Scan testnet blocks and transactions", category: "Pages & Tools", path: "/explorer", icon: "Compass" },
  { title: "Kii Arcade", description: "Play Web3 games and send greetings", category: "Pages & Tools", path: "/gaming", icon: "Gamepad2" },
  { title: "KiiSwap DEX & Transfer", description: "Swap assets and execute direct transfers", category: "Pages & Tools", path: "/kiiswap", icon: "ArrowLeftRight" },
  { title: "Developer Quests", description: "Complete challenges and earn XP", category: "Pages & Tools", path: "/quests", icon: "Award" },
  { title: "Hall of Fame", description: "Check leaderboards and top builders", category: "Pages & Tools", path: "/hall-of-fame", icon: "Trophy" },
  { title: "Builder Profile", description: "Manage achievements and project showcase", category: "Pages & Tools", path: "/profile", icon: "Crown" },
  { title: "Wallet Configurations", description: "Connect MetaMask and developer keys", category: "Pages & Tools", path: "/wallet-tools", icon: "Wallet" },
  { title: "Getting Started Guide", description: "View developer documentation and RPC endpoints", category: "Pages & Tools", path: "/getting-started", icon: "HelpCircle" },

  // Quests
  { title: "Quest: Claim Faucet", description: "Request testnet KII tokens from the portal faucet", category: "Developer Quests", path: "/faucet", icon: "Zap" },
  { title: "Quest: Connect Wallet", description: "Securely link your MetaMask or Cosmos developer wallet", category: "Developer Quests", path: "/wallet-tools", icon: "Zap" },
  { title: "Quest: First Transaction", description: "Execute your first transaction on KiiChain Testnet", category: "Developer Quests", path: "/explorer", icon: "Zap" },
  { title: "Quest: Send 5 Transactions", description: "Submit 5 transactions to the KiiChain testnet", category: "Developer Quests", path: "/explorer", icon: "Zap" },
  { title: "Quest: Send 25 Transactions", description: "Submit 25 transactions to the KiiChain testnet", category: "Developer Quests", path: "/explorer", icon: "Zap" },
  { title: "Quest: Deploy Token", description: "Deploy a standard token contract to the KiiChain Testnet", category: "Developer Quests", path: "/deploy", icon: "Zap" },
  { title: "Quest: Deploy NFT", description: "Deploy an NFT Collection contract using templates", category: "Developer Quests", path: "/deploy", icon: "Zap" },
  { title: "Quest: Interact with Contract", description: "Interact with a template contract after deployment", category: "Developer Quests", path: "/deploy", icon: "Zap" },
  { title: "Quest: Daily Greetings", description: "Send a GM or GN greeting to the network", category: "Developer Quests", path: "/gaming", icon: "Zap" },
  { title: "Quest: Kii Gamer", description: "Play any arcade game on the builder portal", category: "Developer Quests", path: "/gaming", icon: "Zap" },
  { title: "Quest: Complete First Swap", description: "Execute a swap transaction on KiiSwap", category: "Developer Quests", path: "/kiiswap", icon: "Zap" },
  { title: "Quest: Swap KII → USDC", description: "Swap KII native gas to USDC stablecoin", category: "Developer Quests", path: "/kiiswap", icon: "Zap" },
  { title: "Quest: Swap KII → USDT", description: "Swap KII native gas to USDT stablecoin", category: "Developer Quests", path: "/kiiswap", icon: "Zap" },
  { title: "Quest: Hub Overlord", description: "Deploy 20+ smart contracts, complete 500+ swaps, stake 5000 sKII, rank top 10", category: "Developer Quests", path: "/profile", icon: "Crown" },
  { title: "Quest: Arcade Deployed Legend", description: "Reach a monumental 50,000+ total XP", category: "Developer Quests", path: "/kiiswap", icon: "Crown" },

  // Contracts
  { title: "Template: ERC20 Token", description: "Deploy standard ERC-20 token contract", category: "Smart Contracts", path: "/deploy", icon: "FileCode" },
  { title: "Template: ERC721 NFT Collection", description: "Deploy digital art NFT contract", category: "Smart Contracts", path: "/deploy", icon: "FileCode" },
  { title: "Template: ESCROW & Faucet", description: "Deploy time-locked release or token faucet", category: "Smart Contracts", path: "/deploy", icon: "FileCode" }
];

export default function Dashboard() {
  const { 
    isConnected, 
    displayAddress, 
    balance, 
    connectWallet,
    latestBlock,
    transactions,
    walletType,
    chainId,
    addNetworkToMetaMask,
    isLoadingSwaps,
    globalActivities,
    isLoadingActivities
  } = useWallet();

  const { theme, toggleTheme } = useTheme();

  const { 
    level, 
    totalXp, 
    profileUsername, 
    profileTitle, 
    profileAvatar,
    dailyCountdown,
    dailyChallenges,
    quests,
    xpProgress,
    nextLevelXpRequired
  } = useQuests();

  const [copied, setCopied] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [searchIndex, setSearchIndex] = useState<number>(0);

  const getSearchIcon = (iconName: string) => {
    switch (iconName) {
      case "Coins": return <Coins className="w-3.5 h-3.5" />;
      case "Layers": return <Layers className="w-3.5 h-3.5" />;
      case "Compass": return <Compass className="w-3.5 h-3.5" />;
      case "Gamepad2": return <Gamepad2 className="w-3.5 h-3.5" />;
      case "ArrowLeftRight": return <ArrowLeftRight className="w-3.5 h-3.5" />;
      case "Award": return <Award className="w-3.5 h-3.5" />;
      case "Trophy": return <Trophy className="w-3.5 h-3.5" />;
      case "Crown": return <Crown className="w-3.5 h-3.5 text-yellow-400" />;
      case "Wallet": return <Wallet className="w-3.5 h-3.5" />;
      case "HelpCircle": return <HelpCircle className="w-3.5 h-3.5" />;
      case "Zap": return <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />;
      case "FileCode": return <FileCode className="w-3.5 h-3.5" />;
      default: return <Search className="w-3.5 h-3.5" />;
    }
  };

  const filteredItems = searchQuery.trim() === "" 
    ? SEARCH_ITEMS.slice(0, 5) 
    : SEARCH_ITEMS.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[searchIndex]) {
        router.push(filteredItems[searchIndex].path);
        setSearchQuery("");
        setShowSearchResults(false);
        (e.target as HTMLInputElement).blur();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowSearchResults(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  // Cmd+K / Ctrl+K search focus shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("dashboard-search-input") as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Quick Swap calculation state
  const [swapInput, setSwapInput] = useState<string>("1.00");
  const [swapOutput, setSwapOutput] = useState<string>("~2.45");

  useEffect(() => {
    const val = Number(swapInput);
    if (val && !isNaN(val)) {
      setSwapOutput(`~${(val * 2.45).toFixed(4)}`);
    } else {
      setSwapOutput("~0.00");
    }
  }, [swapInput]);

  const handleCopy = () => {
    if (displayAddress) {
      navigator.clipboard.writeText(displayAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [genuineLeaderboard, setGenuineLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<string>("-");

  useEffect(() => {
    const sanitizeAddr = (address: string | null | undefined): string => {
      if (!address) return "";
      return address.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    };

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();

        // Map database profiles to state format
        let profiles = data.map((p: any, index: number) => {
          const pAddr = sanitizeAddr(p.address);
          const dAddr = displayAddress ? sanitizeAddr(displayAddress) : "";
          const isUser = dAddr ? pAddr === dAddr : false;
          return {
            username: isUser ? (profileUsername || p.name) : p.name,
            name: isUser ? (profileUsername || p.name) : p.name,
            avatar: isUser ? (profileAvatar || p.avatar) : p.avatar,
            title: isUser ? (profileTitle || p.title) : p.title,
            level: isUser ? (level || p.level) : p.level,
            xp: isUser ? (totalXp || p.xp) : p.xp,
            contracts: isUser ? (transactions.filter(t => t.type.toLowerCase().includes("deploy") && t.status === "success").length || p.contracts) : p.contracts,
            isUser,
            address: pAddr,
            rank: index + 1
          };
        });

        // Optimistic update: if current active user isn't in database yet, add manually
        const hasCurrentUser = profiles.some((p: any) => p.isUser);
        if (!hasCurrentUser && displayAddress && totalXp > 0) {
          const dAddr = sanitizeAddr(displayAddress);
          const userDeploys = transactions.filter(t => t.type.toLowerCase().includes("deploy") && t.status === "success").length;
          
          profiles.push({
            username: profileUsername || "Guest",
            name: profileUsername || "Guest",
            avatar: profileAvatar,
            title: profileTitle,
            level: level,
            xp: totalXp,
            contracts: userDeploys,
            isUser: true,
            address: dAddr,
            rank: profiles.length + 1
          });
        }

        // ALWAYS sort descending by XP, then level, then contracts, then name (alphabetical fallback) after applying client overrides
        profiles.sort((a: any, b: any) => {
          if (b.xp !== a.xp) return b.xp - a.xp;
          if (b.level !== a.level) return b.level - a.level;
          if (b.contracts !== a.contracts) return b.contracts - a.contracts;
          return (a.name || "").localeCompare(b.name || "");
        });

        // ALWAYS re-assign ranks based on final sorted order
        profiles.forEach((entry: any, index: number) => {
          entry.rank = index + 1;
          entry.isCrown = index < 3;
        });

        setGenuineLeaderboard(profiles);

        // Find active user's rank
        const userEntry = profiles.find((p: any) => p.isUser);
        if (userEntry) {
          setUserRank(`#${userEntry.rank}`);
        } else {
          setUserRank("-");
        }
      } catch (err) {
        console.error("Failed to load global leaderboard in sidebar:", err);
      }
    };

    fetchLeaderboard();

    // Set up real-time polling every 5 seconds
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [displayAddress, totalXp, transactions, profileUsername, profileTitle, profileAvatar, level]);

  const leaderboardData = genuineLeaderboard.slice(0, 5); // top 5 profiles

  // Find daily quest progress from context
  const dailyQuest = dailyChallenges.find(c => c.id === "daily_tx_3") || {
    title: "Send 3 Transactions",
    progress: 0,
    target: 3,
    xp: 50,
    completed: false
  };

  // Compile recent transactions list, falling back to empty if transactions array is empty
  // Compile recent transactions list, falling back to empty if globalActivities array is empty
  const activityLogs = globalActivities.length > 0
    ? globalActivities
        .filter((tx) => {
          const isTransfer = tx.type === "Direct Transfer" || 
                             tx.type === "Transaction" ||
                             tx.type.toLowerCase().includes("transfer");
          if (isTransfer) {
            return displayAddress && tx.userAddress.toLowerCase() === displayAddress.toLowerCase();
          }
          return true;
        })
        .slice(0, 5)
        .map((tx) => {
        let title = tx.type;
        let badgeType = "TX";
        if (tx.type.toLowerCase().includes("deploy")) {
          badgeType = "CONTRACT";
        } else if (tx.type.toLowerCase().includes("faucet")) {
          badgeType = "FAUCET";
        } else if (tx.type.toLowerCase().includes("swap")) {
          badgeType = "SWAP";
        } else if (tx.type.toLowerCase().includes("arcade") || tx.type.toLowerCase().includes("game")) {
          badgeType = "ARCADE";
        } else if (tx.type.toLowerCase().includes("staking") || tx.type.toLowerCase().includes("stake")) {
          badgeType = "STAKING";
        } else if (tx.type.toLowerCase().includes("unstaking") || tx.type.toLowerCase().includes("unstake")) {
          badgeType = "UNSTAKING";
        } else if (tx.type.toLowerCase().includes("transfer") || tx.type.toLowerCase().includes("direct")) {
          badgeType = "TRANSFER";
        }
        
        let details = tx.details || tx.hash.slice(0, 10);
        const matchAddr = details.match(/0x[a-fA-F0-9]{40}/i);
        if (matchAddr) {
          details = `${matchAddr[0].slice(0, 6)}...${matchAddr[0].slice(-4)}`;
        }
        
        // Calculate simplified relative time
        const elapsedMin = Math.floor((Date.now() - tx.timestamp) / 60000);
        let timeStr = "Just now";
        if (elapsedMin > 0 && elapsedMin < 60) {
          timeStr = `${elapsedMin}m ago`;
        } else if (elapsedMin >= 60 && elapsedMin < 1440) {
          timeStr = `${Math.floor(elapsedMin / 60)}h ago`;
        } else if (elapsedMin >= 1440) {
          timeStr = `${Math.floor(elapsedMin / 1440)}d ago`;
        }

        return {
          title,
          detail: details,
          time: timeStr,
          badge: badgeType
        };
      })
    : [];

  const quickActions = [
    { name: "Request Faucet", path: "/faucet", icon: Zap, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { name: "Deploy Contract", path: "/deploy", icon: FileCode, color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
    { name: "KiiSwap DEX", path: "/kiiswap", icon: RefreshCw, color: "text-blue-400 bg-blue-500/10 border-blue-500/20", hasBadge: true },
    { name: "Explorer", path: "/explorer", icon: Activity, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
    { name: "Wallet Tools", path: "/wallet-tools", icon: Wallet, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { name: "Testnet Quests", path: "/quests", icon: Trophy, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { name: "Kii Arcade", path: "/gaming", icon: Gamepad2, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
    { name: "Contract Templates", path: "/deploy", icon: Layers, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" }
  ];

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kii-blue"></div>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider font-mono">Loading KiiHub Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic inline styles for premium animations (Float, Orbit) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.01); }
        }
        @keyframes orbit-1 {
          0% { transform: rotate(30deg) rotateY(0deg); }
          100% { transform: rotate(30deg) rotateY(360deg); }
        }
        @keyframes orbit-2 {
          0% { transform: rotate(-15deg) rotateY(360deg); }
          100% { transform: rotate(-15deg) rotateY(0deg); }
        }
        @keyframes border-rainbow-glow {
          0%, 100% { border-color: rgba(99, 102, 241, 0.35); box-shadow: 0 0 15px rgba(99, 102, 241, 0.08); }
          25% { border-color: rgba(6, 182, 212, 0.5); box-shadow: 0 0 25px rgba(6, 182, 212, 0.16); }
          50% { border-color: rgba(16, 185, 129, 0.35); box-shadow: 0 0 15px rgba(16, 185, 129, 0.08); }
          75% { border-color: rgba(245, 158, 11, 0.5); box-shadow: 0 0 25px rgba(245, 158, 11, 0.16); }
        }
        .animate-float {
          animation: float 5s infinite ease-in-out;
        }
        .animate-orbit-1 {
          animation: orbit-1 15s infinite linear;
        }
        .animate-orbit-2 {
          animation: orbit-2 18s infinite linear;
        }
        .animate-rainbow-glow {
          animation: border-rainbow-glow 8s infinite linear;
        }
      `}} />

      {/* TOP HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/40 pb-6">
        {/* Search bar widget */}
        <div className="relative w-full max-w-md" id="dashboard-search-container">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-500" />
          </span>
          <input 
            id="dashboard-search-input"
            type="text" 
            placeholder="Search tools, contracts, quests..." 
            value={searchQuery || ""}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
              setSearchIndex(0);
            }}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => {
              // Timeout allows click to register on results list before it unmounts
              setTimeout(() => setShowSearchResults(false), 200);
            }}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-12 py-2 bg-brand-black/60 border border-brand-border rounded-xl text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-kii-purple/50 font-medium"
          />
          <span className="absolute inset-y-0 right-3.5 flex items-center">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-brand-border text-[9px] text-zinc-500 font-mono">⌘K</kbd>
          </span>

          {/* Search Dropdown Results */}
          {showSearchResults && filteredItems.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-panel max-h-[320px] overflow-y-auto rounded-xl border border-white/10 shadow-2xl p-2 space-y-1 bg-zinc-950/95 backdrop-blur-md">
              {filteredItems.map((item, index) => {
                const IconComponent = getSearchIcon(item.icon);
                const isSelected = index === searchIndex;
                return (
                  <button
                    key={item.title + "-" + item.category}
                    onClick={() => {
                      router.push(item.path);
                      setSearchQuery("");
                      setShowSearchResults(false);
                    }}
                    onMouseEnter={() => setSearchIndex(index)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                      isSelected 
                        ? "bg-gradient-to-r from-kii-purple/20 to-kii-blue/20 border border-white/10 text-white" 
                        : "border border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-lg ${
                        isSelected ? "bg-white/10 text-cyan-400" : "bg-white/5 text-zinc-500"
                      }`}>
                        {IconComponent}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold truncate">{item.title}</span>
                        <span className="block text-[10px] text-zinc-500 truncate font-medium mt-0.5">{item.description}</span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded border ${
                      item.category === "Pages & Tools" ? "bg-cyan-950/50 text-cyan-400 border-cyan-500/20" :
                      item.category === "Developer Quests" ? "bg-purple-950/50 text-purple-400 border-purple-500/20" :
                      "bg-amber-950/50 text-amber-400 border-amber-500/20"
                    }`}>
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {showSearchResults && searchQuery && filteredItems.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-panel rounded-xl border border-white/10 shadow-2xl p-4 text-center text-xs text-zinc-500 bg-zinc-950/95 backdrop-blur-md">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
        
        {/* Status widgets */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Widget */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-black border border-brand-border text-xs font-semibold text-zinc-300 hover:border-kii-purple/50 cursor-pointer transition-colors"
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

          {/* Testnet EVM pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-black border border-brand-border text-xs font-semibold text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kii-teal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-kii-teal"></span>
            </span>
            <span className="text-zinc-400">Testnet EVM</span>
            <span className="text-kii-teal font-extrabold text-[9px] tracking-wider bg-kii-teal/10 px-1.5 py-0.5 rounded border border-kii-teal/20">ONLINE</span>
          </div>

          {/* Block Capsule */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-black border border-brand-border text-xs font-semibold text-zinc-300 font-mono">
            <Layers className="w-3.5 h-3.5 text-kii-purple" />
            <span className="text-zinc-400">Block</span>
            <span className="text-white">#{latestBlock ? latestBlock.toLocaleString() : "31,682,155"}</span>
          </div>

          {/* User Wallet Pill */}
          {isConnected && displayAddress ? (
            isEvmWallet(walletType) && chainId !== 1336 ? (
              <button 
                onClick={addNetworkToMetaMask}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-xs font-bold text-red-400 transition-colors cursor-pointer"
                title="Wrong network. Click to switch to KiiChain Testnet."
              >
                <span className="text-sm">⚠️</span>
                <span>Wrong Network (Switch to KiiChain)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-black border border-brand-border text-xs font-semibold text-zinc-300">
                <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-kii-purple to-kii-blue flex-shrink-0 flex items-center justify-center border border-white/10 text-[9px]">
                  {isEvmWallet(walletType) ? "🦊" : "🌌"}
                </div>
                <span className="font-mono text-white">{displayAddress.slice(0, 6)}...{displayAddress.slice(-4)}</span>
              </div>
            )
          ) : (
            <button 
              onClick={() => connectWallet("metamask")}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-kii-purple to-kii-blue hover:opacity-90 text-xs font-bold text-white transition-opacity cursor-pointer"
            >
              <Wallet className="w-3 h-3" />
              Connect
            </button>
          )}
        </div>
      </div>

      {/* MASTER GRID SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: HERO BANNER & STATS ROW (LG: 9-COLS) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* HERO BANNER SECTION */}
          <section className="relative overflow-hidden rounded-2xl border border-brand-border bg-gradient-to-br from-brand-black/90 to-brand-dark/80 p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse-glow">
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes text-gradient-shift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .animate-hero-gradient {
                background-size: 200% auto;
                animation: text-gradient-shift 4s ease infinite;
              }
              @keyframes pulse-shadow {
                0%, 100% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.15); border-color: rgba(255,255,255,0.05); }
                50% { box-shadow: 0 0 35px rgba(6, 182, 212, 0.3); border-color: rgba(6, 182, 212, 0.25); }
              }
              .animate-pulse-glow {
                animation: pulse-shadow 4s ease-in-out infinite;
              }
            `}} />
            <div className="absolute top-0 right-0 w-[350px] h-[350px] rounded-full bg-gradient-to-bl from-kii-purple/10 to-kii-blue/5 blur-[70px] pointer-events-none" />
            
            {/* Banner Text details */}
            <div className="flex-1 space-y-5 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-black uppercase text-yellow-500 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                Build. Test. Innovate.
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
                Welcome to <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-hero-gradient">KiiHub</span>
              </h1>
              
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-relaxed max-w-md">
                The future of cross-border payments starts here. Access smart contract builders, request gas, swap & send stables, play games and track onchain progress.
              </p>

              {/* Metrics horizontally aligned */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-t border-brand-border/40 max-w-xl">
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Layers className="w-3 h-3 text-kii-purple" />
                    Block Height
                  </div>
                  <div className="text-sm font-black text-zinc-900 dark:text-white font-mono mt-0.5">{latestBlock ? latestBlock.toLocaleString() : "31953985"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Zap className="w-3 h-3 text-kii-blue" />
                    Network Speed
                  </div>
                  <div className="text-sm font-black text-zinc-900 dark:text-white font-mono mt-0.5">4500 TPS</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Server className="w-3 h-3 text-zinc-500" />
                    Validators
                  </div>
                  <div className="text-sm font-black text-zinc-900 dark:text-white font-mono mt-0.5">48</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Activity className="w-3 h-3 text-kii-teal" />
                    Uptime
                  </div>
                  <div className="text-sm font-black text-zinc-900 dark:text-white font-mono mt-0.5">99.98%</div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full">
                <Link
                  href="/getting-started"
                  className="flex w-full sm:w-auto justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-kii-purple to-kii-blue hover:opacity-90 font-bold text-xs tracking-wider uppercase text-white shadow-xl shadow-kii-purple/15 transition-opacity"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Start Building
                </Link>
                <a
                  href="#popular-tools"
                  className="flex w-full sm:w-auto justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950/60 border border-brand-border hover:border-zinc-700 hover:text-white font-bold text-xs tracking-wider uppercase text-zinc-400 transition-colors cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Explore Tools
                </a>
              </div>
            </div>

            {/* Glowing 3D Orb graphic on right */}
            <div className="hidden md:flex w-1/3 justify-center items-center relative min-h-[200px]">
              <div className="absolute w-[180px] h-[180px] rounded-full bg-kii-purple/10 blur-[40px] animate-pulse" />
              
              {/* Orbital ring 1 */}
              <div className="absolute w-[160px] h-[65px] rounded-full border border-kii-purple/20 rotate-[30deg] animate-orbit-1" />
              {/* Orbital ring 2 */}
              <div className="absolute w-[140px] h-[50px] rounded-full border border-kii-blue/20 rotate-[-15deg] animate-orbit-2" />
              
              {/* The Orb */}
              <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-tr from-kii-blue/90 via-kii-purple/70 to-kii-blue/95 flex items-center justify-center relative shadow-[0_0_40px_rgba(99,102,241,0.45)] animate-float border border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.45),transparent_60%)]" />
                <span className="text-white text-lg font-black font-sans tracking-widest relative z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">KII</span>
              </div>
              
              {/* Pedestal */}
              <div className="absolute bottom-[10px] w-[130px] h-[12px] bg-zinc-950 border border-brand-border rounded-full flex items-center justify-center shadow-inner">
                <div className="w-[110px] h-[4px] bg-kii-purple/30 rounded-full blur-[2px]" />
              </div>
            </div>
          </section>

          {/* THREE-COLUMN STATISTICS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: MY WALLET */}
            <div className="glass-panel rounded-xl p-5 flex flex-col justify-between min-h-[175px] text-left">
              {isConnected ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">My Wallet</span>
                        <span className="text-[8px] font-extrabold text-white uppercase tracking-wider bg-kii-blue bg-opacity-80 px-1 rounded">KII</span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-500 -rotate-90" />
                    </div>

                    <div className="space-y-1">
                      <div className="text-2xl font-black text-white tracking-tight leading-none">
                        {balance} <span className="text-xs font-bold text-kii-blue">KII</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-semibold">$0.00 USD</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    {/* SVG sparkline */}
                    <svg className="w-full h-8" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="walletGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 22 Q 10 12 25 18 T 50 8 T 75 14 T 100 4" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M 0 22 Q 10 12 25 18 T 50 8 T 75 14 T 100 4 L 100 30 L 0 30 Z" fill="url(#walletGlow)" />
                    </svg>

                    <div className="flex items-center justify-between border-t border-brand-border/40 pt-2.5 mt-2">
                      <div className="font-mono text-[9px] text-zinc-400 truncate max-w-[100px]">
                        {displayAddress}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={handleCopy}
                          className="p-1 rounded hover:bg-white/[0.04] text-zinc-500 hover:text-white transition-colors"
                          title="Copy Address"
                        >
                          {copied ? <Check className="w-3 h-3 text-kii-teal" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button 
                          onClick={() => setShowQr(!showQr)}
                          className="p-1 rounded hover:bg-white/[0.04] text-zinc-500 hover:text-white transition-colors relative"
                          title="Show QR Code"
                        >
                          <QrCode className="w-3 h-3" />
                          {showQr && (
                            <div className="absolute bottom-6 right-0 p-2 rounded-lg bg-zinc-950 border border-brand-border shadow-2xl z-50">
                              <div className="w-20 h-20 bg-white flex items-center justify-center rounded">
                                <span className="text-[10px] text-black font-mono font-bold">QR Mock</span>
                              </div>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col justify-between h-full flex-1">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">My Wallet</span>
                        <span className="text-[8px] font-extrabold text-white uppercase tracking-wider bg-kii-blue bg-opacity-80 px-1 rounded">KII</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed mt-1">
                      Connect your developer wallet to view your live KII and token balances.
                    </p>
                  </div>
                  <button
                    onClick={() => connectWallet("metamask")}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-kii-purple to-kii-blue hover:opacity-90 font-bold text-[10px] uppercase tracking-wider text-white transition-all shadow-md shadow-kii-purple/10 cursor-pointer animate-pulse-glow"
                  >
                    <Wallet className="w-3 h-3" />
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>

            {/* CARD 2: BUILDER PROGRESS */}
            <div className="glass-panel rounded-xl p-5 flex flex-col justify-between min-h-[175px] text-left">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Builder Progress</span>
                  <span className="text-[8px] font-black text-kii-purple-light uppercase tracking-wider bg-kii-purple/15 border border-kii-purple/20 px-2 py-0.5 rounded">
                    Level {level}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-lg font-black text-white tracking-tight">{profileTitle || "OG Builder"}</div>
                  
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                    <span>{totalXp.toLocaleString()} / {nextLevelXpRequired.toLocaleString()} XP</span>
                    <span>{xpProgress}%</span>
                  </div>
                  
                  <div className="w-full h-1.5 rounded-full bg-zinc-950 border border-brand-border/40 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-kii-purple to-kii-blue" 
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-brand-border/40 pt-2.5 mt-3 font-mono text-[9.5px]">
                <div>
                  <span className="text-zinc-500 block uppercase text-[7.5px] font-bold">Quests Done</span>
                  <span className="text-white font-extrabold">{quests.filter(q => q.completed).length}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase text-[7.5px] font-bold">Contracts</span>
                  <span className="text-white font-extrabold">
                    {transactions.filter(t => t.type.toLowerCase().includes("deploy") && t.status === "success").length}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase text-[7.5px] font-bold">Ranking</span>
                  <span className="text-kii-blue font-extrabold">{userRank}</span>
                </div>
              </div>
            </div>

            {/* CARD 3: DAILY QUEST */}
            <div className="glass-panel rounded-xl p-5 flex flex-col justify-between min-h-[175px] text-left">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Daily Quest</span>
                  <span className="text-[8.5px] font-mono text-zinc-500">
                    Reset in {dailyCountdown || "14h 32m 18s"}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-white">{dailyQuest.title}</span>
                    <span className="text-kii-teal text-[9.5px] font-mono font-bold">+{dailyQuest.xp} XP</span>
                  </div>
                  
                  <div className="w-full h-1.5 rounded-full bg-zinc-950 border border-brand-border/40 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-kii-teal" 
                      style={{ width: `${(dailyQuest.progress / dailyQuest.target) * 100}%` }}
                    />
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500 text-right">
                    {dailyQuest.progress} / {dailyQuest.target} completed
                  </div>
                </div>
              </div>

              <div className="border-t border-brand-border/40 pt-2.5 mt-2 flex justify-end">
                <Link 
                  href="/quests" 
                  className="px-3 py-1 rounded bg-zinc-950 hover:bg-zinc-900 border border-brand-border text-[9px] font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 uppercase tracking-wide"
                >
                  View All Quests
                  <ArrowRight className="w-3 h-3 text-kii-blue" />
                </Link>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: LEADERBOARD SIDEBAR (LG: 3-COLS) */}
        <div className="lg:col-span-3">
          
          <div className="glass-panel rounded-xl p-5 h-full flex flex-col justify-between min-h-[385px] text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-yellow-500" />
                  Top Builders
                </span>
                <button className="flex items-center gap-1 text-[8.5px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-950 border border-brand-border px-1.5 py-0.5 rounded">
                  This Week
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Leaderboard Entries */}
              <div className="space-y-2">
                {leaderboardData.length > 0 ? (
                  leaderboardData.map((user) => (
                    <div 
                      key={user.address || `${user.username}-${user.rank}`}
                      className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                        user.isUser 
                          ? "bg-kii-purple/10 border-kii-purple/30 shadow shadow-kii-purple/5" 
                          : "bg-white/[0.01] border-brand-border/60 hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`text-[10px] font-mono font-bold w-4 ${user.isCrown ? "text-yellow-500" : "text-zinc-500"}`}>
                          {user.rank}
                        </span>
                        <div className="w-6.5 h-6.5 rounded bg-zinc-900 border border-brand-border flex items-center justify-center text-xs flex-shrink-0">
                          {user.avatar || "👤"}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-[10.5px] font-bold truncate ${user.isUser ? "text-white" : "text-zinc-300"}`}>
                            {user.username}
                          </span>
                          <span className="text-[8.5px] text-zinc-500 truncate leading-none">
                            {user.title || "Builder"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-white font-mono">
                          {user.xp.toLocaleString()}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-bold font-mono">XP</span>
                        {user.isCrown && <Crown className="w-3 h-3 text-yellow-500 ml-1" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-lg border border-dashed border-brand-border/60 text-center space-y-2">
                    <Trophy className="w-8 h-8 text-zinc-600 mx-auto animate-pulse" />
                    <p className="text-zinc-400 text-[10.5px] font-bold">No active builders yet.</p>
                    <p className="text-zinc-500 text-[9px]">Connect your wallet to join the leaderboard!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-brand-border/40 pt-3 mt-4">
              <Link 
                href="/hall-of-fame" 
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-brand-border text-[9.5px] font-bold text-zinc-400 hover:text-white transition-colors text-center uppercase tracking-wider"
              >
                View Full Leaderboard
                <ArrowRight className="w-3 h-3 text-kii-blue" />
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* SWAP CARD AND QUICK ACTIONS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KIISWAP DEX CARD (LG: 8-COLS) */}
        <div className="lg:col-span-8">
          
          <div className="glass-panel p-5 rounded-xl flex flex-col md:flex-row gap-5 items-stretch min-h-[220px] text-left">
            {/* Swap info and CTA */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-kii-purple" />
                    KiiSwap DEX
                  </span>
                  <span className="text-[8px] font-extrabold text-kii-blue uppercase tracking-wider bg-kii-blue/10 border border-kii-blue/20 px-1.5 rounded animate-pulse">
                    NEW
                  </span>
                </div>
                
                <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs mt-1">
                  Swap KII, USDC, and USDT stablecoins instantly with low cost settlement routes backing cross-border assets.
                </p>
              </div>

              <div className="mt-4 md:mt-0">
                {/* Rate details with sparkline */}
                <div className="flex items-center gap-4 bg-zinc-950/40 p-2.5 rounded-lg border border-brand-border max-w-xs">
                  <div className="flex flex-col font-mono text-[9.5px]">
                    <span className="text-zinc-500 font-semibold">1 KII = 0.00234 USDC</span>
                    <span className="text-kii-emerald font-bold mt-0.5 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      +2.34% (24h)
                    </span>
                  </div>
                  {/* Sparkline wave */}
                  <svg className="w-24 h-6 flex-1" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path d="M 0 25 L 20 20 L 40 23 L 60 15 L 80 18 L 100 8" fill="none" stroke="#10B981" strokeWidth="1.5" />
                  </svg>
                </div>

                <Link
                  href="/kiiswap"
                  className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-kii-purple to-kii-blue hover:opacity-90 text-white font-bold text-xs tracking-wider uppercase transition-opacity"
                >
                  Start Swapping
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Swap input panel mockup (interactive) */}
            <div className="w-full md:w-[260px] bg-zinc-950 p-4 rounded-xl border border-brand-border flex flex-col justify-between gap-3">
              {/* Pay amount */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8.5px] text-zinc-500 uppercase font-bold">
                  <span>From</span>
                  <span>Balance: {isConnected ? balance : "0.00"}</span>
                </div>
                <div className="flex items-center justify-between bg-zinc-900/60 p-2 rounded-lg border border-brand-border">
                  <input
                    type="number"
                    value={swapInput || ""}
                    onChange={(e) => setSwapInput(e.target.value)}
                    className="bg-transparent border-0 font-mono text-[13px] font-black text-white w-20 focus:outline-none"
                  />
                  <span className="text-[10px] font-black text-zinc-400 flex items-center gap-1 bg-zinc-950 border border-brand-border px-1.5 py-0.5 rounded">
                    🟣 KII
                  </span>
                </div>
                <div className="text-[8px] text-zinc-500 font-mono text-right">$0.00 USD</div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center -my-2.5 relative z-10">
                <div className="p-1 rounded-full bg-zinc-900 border border-brand-border text-zinc-500">
                  <ArrowLeftRight className="w-3 h-3 rotate-90" />
                </div>
              </div>

              {/* Receive amount */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8.5px] text-zinc-500 uppercase font-bold">
                  <span>To</span>
                  <span>Balance: 0.00</span>
                </div>
                <div className="flex items-center justify-between bg-zinc-900/60 p-2 rounded-lg border border-brand-border">
                  <span className="font-mono text-[13px] text-zinc-400">{swapOutput}</span>
                  <span className="text-[10px] font-black text-zinc-400 flex items-center gap-1 bg-zinc-950 border border-brand-border px-1.5 py-0.5 rounded">
                    <img src="/usd-coin-usdc-logo.png" className="w-3.5 h-3.5 rounded-full" alt="" /> USDC
                  </span>
                </div>
                <div className="text-[8px] text-zinc-500 font-mono text-right">$0.00 USD</div>
              </div>
            </div>
          </div>

        </div>

        {/* QUICK ACTIONS CARD (LG: 4-COLS) */}
        <div className="lg:col-span-4">
          
          <div className="glass-panel p-5 rounded-xl h-full flex flex-col justify-between min-h-[220px] text-left">
            <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3">
              Quick Actions
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    href={action.path}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-brand-border bg-white/[0.01] hover:bg-white/[0.03] hover:border-zinc-700 transition-all text-center relative group"
                  >
                    <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border ${action.color} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9.5px] font-bold text-zinc-400 group-hover:text-zinc-200 mt-2 truncate w-full">
                      {action.name.split(" ")[0]} {action.name.split(" ")[1] || ""}
                    </span>
                    {action.hasBadge && (
                      <span className="absolute -top-1 -right-1 text-[7px] font-black text-kii-purple-light bg-kii-purple/10 border border-kii-purple/20 px-1 rounded animate-pulse">
                        NEW
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM THREE-COLUMN GRID (RECENT ACTIVITY, POPULAR TOOLS, NETWORK STATUS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMN 1: RECENT ACTIVITY */}
        <div className="glass-panel p-5 rounded-xl text-left flex flex-col justify-between min-h-[200px]">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-kii-blue" />
                Recent Activity
              </span>
              <Link href="/explorer" className="text-[10px] font-bold text-kii-blue hover:underline">
                View Explorer
              </Link>
            </div>

            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {isLoadingActivities && globalActivities.length === 0 ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-2 rounded bg-zinc-950/20 border border-brand-border/60 text-[10px]">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-zinc-800" />
                        <div className="space-y-1">
                          <div className="h-2 w-24 bg-zinc-800 rounded" />
                          <div className="h-1.5 w-12 bg-zinc-900 rounded" />
                        </div>
                      </div>
                      <div className="h-2 w-10 bg-zinc-800 rounded" />
                    </div>
                  ))}
                </div>
              ) : activityLogs.length > 0 ? (
                activityLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-zinc-950/40 border border-brand-border text-[10px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        {log.badge === "CONTRACT" ? "📦" : 
                         log.badge === "FAUCET" ? "💧" : 
                         log.badge === "SWAP" ? "💱" : 
                         log.badge === "ARCADE" ? "👾" : 
                         log.badge === "STAKING" ? "🔒" :
                         log.badge === "UNSTAKING" ? "🔓" : "💸"}
                      </span>
                      <div>
                        <span className="font-bold text-white block leading-none">{log.title}</span>
                        <span className="text-[8.5px] text-zinc-500 block mt-0.5">{log.detail}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[8.5px] text-zinc-500 block">{log.time}</span>
                      <span className="text-[7.5px] font-black text-kii-purple-light uppercase mt-0.5 bg-kii-purple/10 px-1 rounded border border-kii-purple/20">
                        {log.badge}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[10px] text-zinc-500 font-medium leading-normal p-4 bg-zinc-950/40 rounded border border-brand-border border-dashed">
                  No recent activity recorded. Request faucet tokens or execute swaps to build your feed.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: POPULAR TOOLS */}
        <div id="popular-tools" className="glass-panel p-5 rounded-xl text-left flex flex-col justify-between min-h-[200px] scroll-mt-24 animate-rainbow-glow border relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-kii-purple/5 blur-2xl pointer-events-none" />
          <div>
            <span className="text-xs font-black text-white uppercase tracking-widest block mb-4 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              Popular Developer Tools
            </span>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Tool 1 */}
              <a href="https://docs.kiiglobal.io/docs/build-on-kiichain/smart-contracts" target="_blank" rel="noopener noreferrer" className="p-3.5 rounded-xl border border-brand-border/60 bg-zinc-950/40 hover:bg-brand-black/50 hover:scale-[1.03] hover:shadow-lg hover:shadow-kii-blue/5 hover:-translate-y-0.5 hover:border-kii-blue/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <FileCode className="w-5 h-5 text-kii-blue mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
                <div>
                  <span className="text-[10px] font-bold text-white block group-hover:text-cyan-400 transition-colors">Contract Templates</span>
                  <span className="text-[8px] text-zinc-500 block mt-0.5 leading-normal">Deploy audited templates</span>
                </div>
              </a>
              {/* Tool 2 */}
              <Link href="/wallet-tools" className="p-3.5 rounded-xl border border-brand-border/60 bg-zinc-950/40 hover:bg-brand-black/50 hover:scale-[1.03] hover:shadow-lg hover:shadow-kii-purple/5 hover:-translate-y-0.5 hover:border-kii-purple/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <Wallet className="w-5 h-5 text-kii-purple mb-3 group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-300" />
                <div>
                  <span className="text-[10px] font-bold text-white block group-hover:text-purple-400 transition-colors">Wallet Diagnostics</span>
                  <span className="text-[8px] text-zinc-500 block mt-0.5 leading-normal">Check wallet health</span>
                </div>
              </Link>
              {/* Tool 3 */}
              <a href="https://docs.kiiglobal.io/docs/build-on-kiichain/testnet-oro" target="_blank" rel="noopener noreferrer" className="p-3.5 rounded-xl border border-brand-border/60 bg-zinc-950/40 hover:bg-brand-black/50 hover:scale-[1.03] hover:shadow-lg hover:shadow-kii-teal/5 hover:-translate-y-0.5 hover:border-kii-teal/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <Server className="w-5 h-5 text-kii-teal mb-3 group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform duration-300" />
                <div>
                  <span className="text-[10px] font-bold text-white block group-hover:text-teal-400 transition-colors">RPC Endpoints</span>
                  <span className="text-[8px] text-zinc-500 block mt-0.5 leading-normal">Access network nodes</span>
                </div>
              </a>
              {/* Tool 4 */}
              <a href="https://docs.kiiglobal.io/docs/build-on-kiichain/developer-hub" target="_blank" rel="noopener noreferrer" className="p-3.5 rounded-xl border border-brand-border/60 bg-zinc-950/40 hover:bg-brand-black/50 hover:scale-[1.03] hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-0.5 hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <Compass className="w-5 h-5 text-orange-400 mb-3 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                <div>
                  <span className="text-[10px] font-bold text-white block group-hover:text-orange-300 transition-colors">Developer Docs</span>
                  <span className="text-[8px] text-zinc-500 block mt-0.5 leading-normal">Build with confidence</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* COLUMN 3: NETWORK STATUS */}
        <div className="glass-panel p-5 rounded-xl text-left flex flex-col justify-between min-h-[200px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Network Status
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8.5px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Good
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 py-1.5 font-mono text-[9px] border-b border-brand-border/40 pb-3">
              <div>
                <span className="text-zinc-500 block font-bold text-[7.5px] uppercase">TPS (24h Avg)</span>
                <span className="text-white font-extrabold mt-0.5 block">4,500</span>
                <span className="text-emerald-400 text-[8px] font-bold block mt-0.5">+12.5%</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-bold text-[7.5px] uppercase">Validators</span>
                <span className="text-white font-extrabold mt-0.5 block">48</span>
                <span className="text-emerald-400 text-[8px] font-bold block mt-0.5">Active</span>
              </div>
              <div>
                <span className="text-zinc-500 block font-bold text-[7.5px] uppercase">Uptime</span>
                <span className="text-white font-extrabold mt-0.5 block">99.98%</span>
                <span className="text-emerald-400 text-[8px] font-bold block mt-0.5">Excellent</span>
              </div>
            </div>
          </div>

          <div>
            {/* Sparkline wave */}
            <svg className="w-full h-8 mt-2" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id="statusGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M 0 18 Q 10 14 20 20 T 40 16 T 60 22 T 80 16 T 100 18" fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 0 18 Q 10 14 20 20 T 40 16 T 60 22 T 80 16 T 100 18 L 100 30 L 0 30 Z" fill="url(#statusGlow)" />
            </svg>
          </div>
        </div>

      </div>

    </div>
  );
}
