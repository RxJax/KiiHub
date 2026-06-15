"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useQuests } from "@/contexts/QuestContext";
import { 
  Trophy, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock,
  Users,
  Target,
  Share2,
  Calendar,
  Zap,
  Star,
  Plus,
  Flame,
  Search,
  Check
} from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  address: string;
  name: string;
  avatar: string;
  title: string;
  level: number;
  xp: number;
  metricValue: number;
  isUser?: boolean;
}



const sanitizeAddress = (address: string | null | undefined): string => {
  if (!address) return "";
  return address.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
};

export default function QuestsHub() {
  const { isConnected, displayAddress, transactions, realTxCount } = useWallet();
  const { 
    quests, 
    achievements, 
    dailyChallenges, 
    weeklyMissions,
    projects,
    referredUsers,
    referralCode,
    communityGoals,
    totalXp, 
    level,
    levelName,
    completionPercentage,
    dailyCountdown,
    weeklyCountdown,
    seasonProgress,
    seasonDaysRemaining,
    simulateReferral,
    profileUsername,
    profileAvatar,
    profileTitle
  } = useQuests();

  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTimeTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const [activeTab, setActiveTab] = useState<"quests" | "dailies" | "leaderboard" | "season" | "referral" | "community">("quests");
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<"xp" | "deploys" | "tx" | "projects" | "referrals">("xp");
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  
  // Referral input mock state
  const [refMoniker, setRefMoniker] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`http://localhost:3000?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refMoniker.trim()) return;
    simulateReferral(refMoniker.trim());
    setRefMoniker("");
  };

  const getQuestProgress = (questId: string): { current: number; target: number } => {
    const addr = sanitizeAddress(displayAddress);
    
    const now = new Date();
    const startOfUTCDay = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    );

    // Filter transactions on the current UTC day
    const todayTxs = transactions.filter(t => t.timestamp >= startOfUTCDay);
    const todayTxCount = todayTxs.length;

    // Filter swaps on the current UTC day
    const todaySwaps = todayTxs.filter(t => t.type.toLowerCase().includes("swap"));
    const todaySwapCount = todaySwaps.length;
    
    switch (questId) {
      case "connect_wallet":
        return { current: isConnected ? 1 : 0, target: 1 };
      case "claim_faucet": {
        const count = todayTxs.filter(t => t.type.includes("Faucet Claim")).length;
        return { current: count >= 1 ? 1 : 0, target: 1 };
      }
      case "first_tx":
        return { current: todayTxCount >= 1 ? 1 : 0, target: 1 };
      case "send_tx_5":
        return { current: Math.min(5, todayTxCount), target: 5 };
      case "send_tx_25":
        return { current: Math.min(25, todayTxCount), target: 25 };
      case "deploy_token": {
        const count = todayTxs.filter(t => t.type.includes("Deploy Token")).length;
        return { current: Math.min(1, count), target: 1 };
      }
      case "deploy_nft": {
        const count = todayTxs.filter(t => t.type.includes("Deploy NFT")).length;
        return { current: Math.min(1, count), target: 1 };
      }
      case "deploy_swap_pool": {
        const count = todayTxs.filter(t => t.type.includes("Deploy SimpleSwapPool")).length;
        return { current: Math.min(1, count), target: 1 };
      }
      case "interact_contract": {
        const count = todayTxs.filter(t => t.type.includes("Interaction") || t.type.includes("Transfer")).length;
        return { current: Math.min(1, count), target: 1 };
      }
      case "gm_gn": {
        const lastGM = typeof window !== "undefined" ? localStorage.getItem("kii_last_gm_time") : null;
        const lastGN = typeof window !== "undefined" ? localStorage.getItem("kii_last_gn_time") : null;
        let count = 0;
        if (lastGM && Number(lastGM) >= startOfUTCDay) count = 1;
        if (lastGN && Number(lastGN) >= startOfUTCDay) count = 1;
        return { current: count, target: 1 };
      }
      case "play_game": {
        const count = todayTxs.filter(t => t.type.includes("Arcade Game") || t.type.includes("Play")).length;
        return { current: Math.min(1, count), target: 1 };
      }
      case "swap_first":
        return { current: todaySwapCount >= 1 ? 1 : 0, target: 1 };
      case "swap_kii_usdc": {
        const count = todayTxs.filter(t => t.type.toLowerCase().includes("swap") && t.details?.includes("USDC")).length;
        return { current: count >= 1 ? 1 : 0, target: 1 };
      }
      case "swap_kii_usdt": {
        const count = todayTxs.filter(t => t.type.toLowerCase().includes("swap") && t.details?.includes("USDT")).length;
        return { current: count >= 1 ? 1 : 0, target: 1 };
      }
      case "swap_5":
        return { current: Math.min(5, todaySwapCount), target: 5 };
      case "swap_25":
        return { current: Math.min(25, todaySwapCount), target: 25 };
      default:
        return { current: 0, target: 1 };
    }
  };

  // Fetch global leaderboard rankings from API with real-time polling
  useEffect(() => {
    if (activeTab !== "leaderboard") return;

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();

        // Read local storage registry to merge extra stats if available
        const registryStr = typeof window !== "undefined" ? localStorage.getItem("kii_leaderboard_profiles_v2") : null;
        let localRegistry: Record<string, any> = {};
        if (registryStr) {
          try {
            localRegistry = JSON.parse(registryStr);
          } catch (e) {}
        }

        let mappedProfiles = data.map((p: any) => {
          const pAddr = sanitizeAddress(p.address);
          const dAddr = displayAddress ? sanitizeAddress(displayAddress) : "";
          const isUser = dAddr ? pAddr === dAddr : false;

          // Merge local registry data if available for private stats (transactionsCount, projectsCount, referralsCount)
          const localProf = localRegistry[pAddr] || {};
          
          let metricValue = isUser ? totalXp : p.xp;
          if (activeLeaderboardTab === "deploys") {
            metricValue = isUser ? (transactions.filter(t => t.type.includes("Deploy")).length) : (p.contracts || 0);
          } else if (activeLeaderboardTab === "tx") {
            metricValue = isUser ? Math.max(realTxCount, transactions.length) : (localProf.transactionsCount || 0);
          } else if (activeLeaderboardTab === "projects") {
            metricValue = isUser ? projects.length : (localProf.projectsCount || 0);
          } else if (activeLeaderboardTab === "referrals") {
            metricValue = isUser ? referredUsers.length : (localProf.referralsCount || 0);
          }

          return {
            rank: 1,
            address: pAddr,
            name: isUser ? `${profileUsername || p.name} (You)` : p.name,
            avatar: isUser ? (profileAvatar || p.avatar) : p.avatar,
            title: isUser ? (profileTitle || p.title) : p.title,
            level: isUser ? (level || p.level) : p.level,
            xp: isUser ? (totalXp || p.xp) : p.xp,
            metricValue,
            isUser
          };
        });

        // Optimistic update: if current active user isn't in global database yet, add manually (if connected and has XP)
        const hasCurrentUser = mappedProfiles.some((p: any) => p.isUser);
        if (!hasCurrentUser && displayAddress && totalXp > 0) {
          const dAddr = sanitizeAddress(displayAddress);
          let userVal = totalXp;
          if (activeLeaderboardTab === "deploys") {
            userVal = transactions.filter(t => t.type.includes("Deploy")).length;
          } else if (activeLeaderboardTab === "tx") {
            userVal = Math.max(realTxCount, transactions.length);
          } else if (activeLeaderboardTab === "projects") {
            userVal = projects.length;
          } else if (activeLeaderboardTab === "referrals") {
            userVal = referredUsers.length;
          }

          mappedProfiles.push({
            rank: 1,
            address: dAddr,
            name: `${profileUsername} (You)`,
            avatar: profileAvatar,
            title: profileTitle,
            level: level,
            xp: totalXp,
            metricValue: userVal,
            isUser: true
          });
        }

        // Keep profiles that have at least 0 XP
        mappedProfiles = mappedProfiles.filter((p: any) => p.xp >= 0);

        const allZeroXp = mappedProfiles.every((p: any) => p.xp === 0);
        const allZeroMetric = mappedProfiles.every((p: any) => p.metricValue === 0);

        // Sort descending by metricValue, then level, then alphabetical name fallback
        mappedProfiles.sort((a: any, b: any) => {
          if (activeLeaderboardTab === "xp" && allZeroXp) {
            return (a.name || "").localeCompare(b.name || "");
          }
          if (activeLeaderboardTab !== "xp" && allZeroMetric) {
            return (a.name || "").localeCompare(b.name || "");
          }
          if (b.metricValue !== a.metricValue) return b.metricValue - a.metricValue;
          if (b.xp !== a.xp) return b.xp - a.xp;
          if (b.level !== a.level) return b.level - a.level;
          return (a.name || "").localeCompare(b.name || "");
        });

        // Assign ranks
        const ranked = mappedProfiles.map((entry: any, idx: number) => ({
          ...entry,
          rank: idx + 1
        }));

        setLeaderboardData(ranked);
      } catch (err) {
        console.error("Failed to fetch global leaderboard in quests:", err);
      }
    };

    fetchLeaderboard();

    // Set up real-time polling every 5 seconds
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [
    activeTab,
    activeLeaderboardTab,
    displayAddress,
    totalXp,
    transactions,
    projects,
    referredUsers,
    profileUsername,
    profileAvatar,
    profileTitle,
    level,
    realTxCount
  ]);
  
  // Extract Podium spots (top 3)
  const isLeaderboardTabEmpty = leaderboardData.length === 0 || 
    (activeLeaderboardTab === "xp" && leaderboardData.every(e => e.xp === 0)) ||
    (activeLeaderboardTab !== "xp" && leaderboardData.every(e => e.metricValue === 0));

  const getPodiumCardData = (entry: any) => {
    if (!entry) return null;
    const entryAddr = sanitizeAddress(entry.address);
    const userAddr = displayAddress ? sanitizeAddress(displayAddress) : "";
    const isUser = userAddr ? entryAddr === userAddr : false;
    const baseName = entry.name ? entry.name.replace(" (You)", "") : "";
    
    let metricValue = entry.metricValue;
    if (isUser) {
      if (activeLeaderboardTab === "xp") {
        metricValue = totalXp;
      } else if (activeLeaderboardTab === "deploys") {
        metricValue = transactions.filter(t => t.type.includes("Deploy")).length;
      } else if (activeLeaderboardTab === "tx") {
        metricValue = Math.max(realTxCount, transactions.length);
      } else if (activeLeaderboardTab === "projects") {
        metricValue = projects.length;
      } else if (activeLeaderboardTab === "referrals") {
        metricValue = referredUsers.length;
      }
    }

    return {
      ...entry,
      name: isUser ? `${profileUsername || baseName} (You)` : baseName,
      avatar: isUser ? (profileAvatar || entry.avatar) : entry.avatar,
      title: isUser ? (profileTitle || entry.title) : entry.title,
      level: isUser ? (level || entry.level) : entry.level,
      xp: isUser ? (totalXp || entry.xp) : entry.xp,
      metricValue,
      isUser
    };
  };

  const podiumSpots = {
    first: !isLeaderboardTabEmpty ? getPodiumCardData(leaderboardData[0]) : null,
    second: !isLeaderboardTabEmpty ? getPodiumCardData(leaderboardData[1]) : null,
    third: !isLeaderboardTabEmpty ? getPodiumCardData(leaderboardData[2]) : null,
  };

  const unlockedBadges = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 text-kii-purple" />
            Kii Builder Quests 2.0
          </h1>
          <p className="text-zinc-400 text-sm">
            Earn builder XP, level up your rank, unlock rare badges, refer builders, and secure top rankings.
          </p>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border border-brand-border-purple/35 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-kii-purple/5 blur-xl" />
          <div className="w-10 h-10 rounded-lg bg-kii-purple/10 flex items-center justify-center text-kii-purple-light text-sm font-bold font-mono">
            L{level}
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">RPG Rank</span>
            <span className="text-sm font-bold text-white block">{levelName}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border border-brand-border-blue/35">
          <div className="w-10 h-10 rounded-lg bg-kii-blue/10 flex items-center justify-center text-lg">
            💎
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Total XP</span>
            <span className="text-sm font-bold text-white block font-mono">{totalXp.toLocaleString()} XP</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/[0.02] border border-brand-border flex items-center justify-center text-lg">
            🏵️
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Badges unlocked</span>
            <span className="text-sm font-bold text-white block">{unlockedBadges} / {achievements.length}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border border-kii-emerald/20">
          <div className="w-10 h-10 rounded-lg bg-kii-emerald/10 flex items-center justify-center text-lg">
            ⚡
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">My Transactions</span>
            <span className="text-sm font-bold text-white block font-mono">{Math.max(realTxCount, transactions.length)} Txs</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-brand-border overflow-x-auto gap-4 scrollbar-none select-none">
        {[
          { id: "quests", label: "Quest Board" },
          { id: "dailies", label: "Dailies & Weeklies" },
          { id: "leaderboard", label: "Leaderboards" },
          { id: "referral", label: "Referral Program" },
          { id: "community", label: "Community Goals" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-kii-purple-light text-white" 
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      
      {/* 1. Quest Board */}
      {activeTab === "quests" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest) => {
            const prog = getQuestProgress(quest.id);
            const isActuallyCompleted = quest.completed || prog.current >= prog.target;
            const percent = Math.min(100, Math.round((prog.current / prog.target) * 100));

            return (
              <div 
                key={quest.id} 
                className={`glass-panel rounded-xl p-5 border flex flex-col justify-between gap-5 transition-all ${
                  isActuallyCompleted 
                    ? "border-kii-emerald/20 bg-kii-emerald/[0.01]" 
                    : "border-brand-border hover:border-brand-border-purple/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase px-2 py-0.5 bg-zinc-950 border border-brand-border rounded">
                      {quest.category}
                    </span>
                    <span className="text-[10px] font-extrabold font-mono text-kii-blue bg-kii-blue/10 px-2 py-0.5 rounded border border-kii-blue/20">
                      +{quest.xp} XP
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mt-2">
                    {isActuallyCompleted && <CheckCircle2 className="w-4 h-4 text-kii-emerald flex-shrink-0" />}
                    {quest.title}
                  </h3>
                  
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium mt-1.5">
                    {quest.description}
                  </p>
                </div>

                {/* Quest Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                    <span className="text-zinc-500 uppercase tracking-wider">Quest Progress</span>
                    <span className="text-zinc-400">{prog.current} / {prog.target}</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-950 border border-brand-border rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isActuallyCompleted ? "bg-kii-emerald" : "bg-kii-purple"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {isActuallyCompleted ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-kii-emerald/5 border border-kii-emerald/15 text-center font-mono">
                    <span className="text-[10px] font-extrabold text-kii-emerald uppercase tracking-widest">
                      QUEST COMPLETED
                    </span>
                    <span className="text-[9px] text-zinc-500 font-semibold flex items-center justify-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-600 animate-pulse" />
                      Refreshes in: {(() => {
                        const now = new Date();
                        const nextMidnight = new Date(Date.UTC(
                          now.getUTCFullYear(),
                          now.getUTCMonth(),
                          now.getUTCDate() + 1,
                          0, 0, 0, 0
                        ));
                        const remaining = nextMidnight.getTime() - Date.now();
                        if (remaining <= 0) return "00h 00m 00s";
                        const hrs = Math.floor(remaining / (60 * 60 * 1000));
                        const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                        const secs = Math.floor((remaining % (60 * 1000)) / 1000);
                        return `${hrs.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
                      })()}
                    </span>
                  </div>
                ) : (
                  <Link
                    href={quest.actionUrl}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-brand-border text-white text-xs font-bold transition-all"
                  >
                    {quest.actionLabel}
                    <ArrowRight className="w-3.5 h-3.5 text-kii-purple" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Dailies & Weeklies */}
      {activeTab === "dailies" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Daily challenges column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-5 rounded-xl border border-brand-border space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                  Daily Rotating Challenges
                </h3>
                
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-950 border border-brand-border text-[11px] font-semibold text-zinc-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-kii-purple-light" />
                  Reset: <span className="text-white font-bold">{dailyCountdown}</span>
                </div>
              </div>

              <div className="space-y-4">
                {dailyChallenges.map((c) => (
                  <div 
                    key={c.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                      c.completed 
                        ? "border-kii-emerald/20 bg-kii-emerald/[0.01]" 
                        : "border-brand-border/60 bg-brand-dark/20"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">{c.title}</h4>
                        {c.completed && (
                          <span className="text-[8px] font-bold text-kii-emerald tracking-wide uppercase px-1 py-0.1 bg-kii-emerald/10 border border-kii-emerald/20 rounded">
                            CLAIMED
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-normal">{c.description}</p>
                      
                      {/* Mini progress bar */}
                      <div className="w-full max-w-xs h-1 rounded-full bg-zinc-900 overflow-hidden mt-1">
                        <div 
                          className="h-full bg-kii-blue transition-all" 
                          style={{ width: `${(c.progress / c.target) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 gap-1 font-mono">
                      <span className="text-xs font-bold text-white">{c.progress} / {c.target}</span>
                      <span className="text-[10px] text-kii-purple-light font-bold">+{c.xp} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly missions column */}
          <div className="space-y-6">
            <div className="glass-panel p-5 rounded-xl border border-brand-border space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-kii-blue" />
                  Weekly Epic Missions
                </h3>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-950 border border-brand-border text-[11px] font-semibold text-zinc-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-kii-blue" />
                  Reset: <span className="text-white font-bold">{weeklyCountdown}</span>
                </div>
              </div>

              <div className="space-y-5">
                {weeklyMissions.map((m) => (
                  <div key={m.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <div>
                        <h4 className="font-bold text-zinc-200">{m.title}</h4>
                        <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">{m.description}</p>
                      </div>
                      <span className="font-bold text-kii-blue font-mono">+{m.xp} XP</span>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full h-1.5 rounded-full bg-zinc-950 border border-white/[0.02] overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-kii-purple to-kii-blue transition-all"
                          style={{ width: `${Math.round((m.progress / m.target) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                        <span>Progress</span>
                        <span>{m.progress} / {m.target} ({Math.round((m.progress / m.target) * 100)}%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 3. Leaderboards */}
      {activeTab === "leaderboard" && (
        <div className="space-y-8">
          {/* Subtabs for metric selection */}
          <div className="flex gap-2 border-b border-brand-border/40 pb-2 overflow-x-auto scrollbar-none">
            {[
              { id: "xp", label: "Top XP" },
              { id: "deploys", label: "Contracts" },
              { id: "tx", label: "Transactions" },
              { id: "projects", label: "Creators" },
              { id: "referrals", label: "Referrals" }
            ].map((subtab) => (
              <button
                key={subtab.id}
                onClick={() => setActiveLeaderboardTab(subtab.id as any)}
                className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider transition-all border ${
                  activeLeaderboardTab === subtab.id 
                    ? "bg-kii-purple/10 text-kii-purple-light border-kii-purple/20" 
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {subtab.label}
              </button>
            ))}
          </div>

          {/* Podium Highlights (Animated Showcase cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-end max-w-4xl mx-auto">
            
            {/* Rank 2 - Silver podium */}
            {podiumSpots.second && (
              <div className={`glass-panel p-5 rounded-xl border relative flex flex-col items-center justify-center text-center h-[210px] md:order-1 order-2 ${
                podiumSpots.second.isUser ? "border-kii-purple/40 bg-kii-purple/5" : "border-brand-border"
              }`}>
                <div className="absolute -top-6 w-12 h-12 rounded-full border border-slate-400/40 bg-zinc-950 flex items-center justify-center shadow-lg">
                  <span className="text-xl">{podiumSpots.second.avatar}</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase bg-slate-400/10 border border-slate-400/20 px-2 py-0.2 rounded-full mt-4">
                  🥈 #2 Rank
                </div>
                <h4 className="text-sm font-bold text-white mt-3 truncate w-full">{podiumSpots.second.name}</h4>
                <p className="text-[10px] text-zinc-500 font-medium truncate w-full mt-0.5">{podiumSpots.second.title}</p>
                <div className="text-xs font-bold text-zinc-300 mt-2 font-mono">
                  {podiumSpots.second.metricValue.toLocaleString()} {
                    activeLeaderboardTab === "xp" ? "XP" :
                    activeLeaderboardTab === "deploys" ? "Contracts" :
                    activeLeaderboardTab === "tx" ? "Transactions" :
                    activeLeaderboardTab === "projects" ? "Projects" : "Invites"
                  }
                </div>
              </div>
            )}

            {/* Rank 1 - Gold podium */}
            {podiumSpots.first && (
              <div className={`glass-panel p-6 rounded-xl border bg-gradient-to-tr from-kii-purple/10 to-transparent relative flex flex-col items-center justify-center text-center h-[250px] md:order-2 order-1 shadow-2xl relative ${
                podiumSpots.first.isUser ? "border-amber-400/60 bg-amber-400/5" : "border-brand-border-purple/35"
              }`}>
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-kii-purple to-kii-blue rounded-t-xl" />
                <div className="absolute -top-8 w-16 h-16 rounded-full border-2 border-amber-400 bg-zinc-950 flex items-center justify-center shadow-2xl">
                  <span className="text-2xl">{podiumSpots.first.avatar}</span>
                </div>
                <div className="text-[10px] font-extrabold text-amber-400 tracking-widest uppercase bg-amber-400/10 border border-amber-400/20 px-3 py-0.5 rounded-full mt-6 flex items-center gap-1">
                  🥇 CHAMPION
                </div>
                <h4 className="text-base font-extrabold text-white mt-3 truncate w-full">{podiumSpots.first.name}</h4>
                <p className="text-xs text-kii-purple-light font-bold truncate w-full mt-0.5">{podiumSpots.first.title}</p>
                <div className="text-sm font-black text-white mt-2 font-mono bg-white/[0.02] border border-white/[0.04] px-3 py-1 rounded">
                  {podiumSpots.first.metricValue.toLocaleString()} {
                    activeLeaderboardTab === "xp" ? "XP" :
                    activeLeaderboardTab === "deploys" ? "Contracts" :
                    activeLeaderboardTab === "tx" ? "Transactions" :
                    activeLeaderboardTab === "projects" ? "Projects" : "Invites"
                  }
                </div>
              </div>
            )}

            {/* Rank 3 - Bronze podium */}
            {podiumSpots.third && (
              <div className={`glass-panel p-5 rounded-xl border relative flex flex-col items-center justify-center text-center h-[190px] md:order-3 order-3 ${
                podiumSpots.third.isUser ? "border-kii-purple/40 bg-kii-purple/5" : "border-brand-border"
              }`}>
                <div className="absolute -top-6 w-12 h-12 rounded-full border border-orange-500/40 bg-zinc-950 flex items-center justify-center shadow-lg">
                  <span className="text-xl">{podiumSpots.third.avatar}</span>
                </div>
                <div className="text-[10px] font-bold text-orange-400 tracking-wider uppercase bg-orange-500/10 border border-orange-500/20 px-2 py-0.2 rounded-full mt-4">
                  🥉 #3 Rank
                </div>
                <h4 className="text-sm font-bold text-white mt-3 truncate w-full">{podiumSpots.third.name}</h4>
                <p className="text-[10px] text-zinc-500 font-medium truncate w-full mt-0.5">{podiumSpots.third.title}</p>
                <div className="text-xs font-bold text-zinc-300 mt-2 font-mono">
                  {podiumSpots.third.metricValue.toLocaleString()} {
                    activeLeaderboardTab === "xp" ? "XP" :
                    activeLeaderboardTab === "deploys" ? "Contracts" :
                    activeLeaderboardTab === "tx" ? "Transactions" :
                    activeLeaderboardTab === "projects" ? "Projects" : "Invites"
                  }
                </div>
              </div>
            )}

          </div>

          {/* Leaders Table */}
          <div className="glass-panel p-6 rounded-xl border border-brand-border space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-kii-blue" />
                Rankings Table
              </h3>
              <span className="text-[10px] text-zinc-500 font-medium">Updates dynamically on every completed action</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-zinc-400">
                <thead>
                  <tr className="border-b border-brand-border text-left text-zinc-500">
                    <th className="pb-3 font-semibold w-16">Rank</th>
                    <th className="pb-3 font-semibold">Builder profile</th>
                    <th className="pb-3 font-semibold">Title badge</th>
                    <th className="pb-3 font-semibold">Level rank</th>
                    <th className="pb-3 font-semibold text-right">Metric Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40 font-mono">
                  {!isLeaderboardTabEmpty ? (
                    leaderboardData.map((entry) => (
                      <tr 
                        key={entry.address || entry.name} 
                        className={`hover:bg-white/[0.01] ${
                          entry.isUser 
                            ? "bg-kii-purple/5 border border-brand-border-purple/35 font-bold text-white" 
                            : ""
                        }`}
                      >
                        <td className="py-3.5">
                          <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                            entry.rank === 1 
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                              : entry.rank === 2
                              ? "bg-slate-400/10 text-slate-300 border border-slate-400/20"
                              : entry.rank === 3
                              ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                              : "bg-white/[0.02] border border-white/[0.04] text-zinc-400"
                          }`}>
                            {entry.rank}
                          </span>
                        </td>
                        <td className="py-3.5 text-zinc-300">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{entry.avatar}</span>
                            <div className="flex flex-col">
                              <span className="font-sans text-white font-bold">{entry.name}</span>
                            </div>
                            {entry.isUser && (
                              <span className="text-[8px] font-bold text-kii-blue tracking-wide uppercase px-1 rounded bg-kii-blue/10 border border-kii-blue/20">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 text-zinc-400 font-sans">{entry.title}</td>
                        <td className="py-3.5 text-zinc-400 font-sans">Lvl {entry.level}</td>
                        <td className="py-3.5 text-right font-extrabold text-white text-sm">
                          {entry.metricValue.toLocaleString()} {
                            activeLeaderboardTab === "xp" ? "XP" :
                            activeLeaderboardTab === "deploys" ? "Contracts" :
                            activeLeaderboardTab === "tx" ? "Transactions" :
                            activeLeaderboardTab === "projects" ? "Projects" : "Invites"
                          }
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500 font-sans">
                        No entries yet. Connect your wallet to join the leaderboard!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* 5. Referral Program */}
      {activeTab === "referral" && (
        <div className="flex flex-col items-center justify-center p-8 glass-panel rounded-2xl border border-brand-border-purple/35 bg-gradient-to-br from-kii-purple/5 to-transparent relative overflow-hidden min-h-[420px]">
          {/* Ambient background glows */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-kii-purple/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-kii-blue/5 blur-3xl pointer-events-none" />
          
          <div className="z-10 flex flex-col items-center text-center max-w-xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-kii-purple to-kii-blue flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform duration-300">
              <Share2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-3">
              <span className="text-[9px] font-extrabold text-kii-blue bg-kii-blue/10 border border-kii-blue/20 px-3 py-1 rounded-full uppercase tracking-widest inline-block animate-pulse">
                Coming Soon
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
                Referral Program & Team Bonuses
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium max-w-md mx-auto">
                We are building a robust collaborative mechanism for developer groups and builder communities. Get ready to spawn unique referral links, track friends, and scale your builder levels together!
              </p>
            </div>

            {/* Upcoming Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-4">
              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl flex flex-col items-center justify-center text-center hover:border-brand-border-purple/20 transition-colors">
                <span className="text-2xl mb-2">🎁</span>
                <span className="text-xs font-bold text-white block">XP Bonuses</span>
                <span className="text-[10px] text-zinc-500 font-semibold block mt-1">Earn scaled XP for every active invitee</span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl flex flex-col items-center justify-center text-center hover:border-brand-border-purple/20 transition-colors">
                <span className="text-2xl mb-2">📊</span>
                <span className="text-xs font-bold text-white block">Peer Tracker</span>
                <span className="text-[10px] text-zinc-500 font-semibold block mt-1">View transaction activity in real-time</span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl flex flex-col items-center justify-center text-center hover:border-brand-border-purple/20 transition-colors">
                <span className="text-2xl mb-2">🎖️</span>
                <span className="text-xs font-bold text-white block">Elite Badges</span>
                <span className="text-[10px] text-zinc-500 font-semibold block mt-1">Unlock exclusive squad achievements</span>
              </div>
            </div>

            {/* Status Footer */}
            <div className="w-full pt-6">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold text-zinc-500 border border-brand-border bg-zinc-950 px-4 py-2 rounded-lg font-mono">
                <span className="w-2 h-2 rounded-full bg-kii-purple animate-ping" />
                V2 Launch Scheduled for Season 1 Phase 2
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Community Goals */}
      {activeTab === "community" && (
        <div className="glass-panel p-6 rounded-xl border border-brand-border space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-kii-blue bg-kii-blue/10 border border-kii-blue/20 px-2 py-0.5 rounded uppercase tracking-widest inline-block">
              Global Campaign
            </span>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-kii-blue" />
              Community Milestones
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Every deploy, transaction, and project submitted on the portal updates these metrics for all builders. Help the community reach these targets to unlock exclusive seasonal achievements!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-border/40">
            {communityGoals.map((g) => {
              const progress = Math.min(100, Math.round((g.current / g.target) * 100));
              return (
                <div key={g.id} className="space-y-2.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-200">{g.title}</span>
                    <span className="text-kii-blue font-mono">{g.current.toLocaleString()} / {g.target.toLocaleString()} {g.unit}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-zinc-950 border border-brand-border overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-kii-purple to-kii-blue transition-all" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{progress}% Target Complete</span>
                    {progress >= 100 && (
                      <span className="text-kii-emerald font-bold uppercase tracking-wider flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Complete
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
