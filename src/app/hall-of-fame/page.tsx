"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useQuests } from "@/contexts/QuestContext";
import { 
  Award, 
  Trophy, 
  Crown, 
  Star, 
  Flame, 
  Layers, 
  Activity, 
  Globe, 
  ExternalLink,
  Clock,
  CheckCircle2,
  TrendingUp,
  History
} from "lucide-react";
import Link from "next/link";





const sanitizeAddress = (address: string | null | undefined): string => {
  if (!address) return "";
  return address.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
};

export default function HallOfFame() {
  const { transactions, isConnected, displayAddress, latestBlock, isLoadingSwaps, globalActivities, isLoadingActivities } = useWallet();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { 
    totalXp, 
    level, 
    profileUsername, 
    profileAvatar, 
    profileTitle, 
    quests,
    projects
  } = useQuests();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [shelfStats, setShelfStats] = useState({
    mostContractsUser: "None",
    mostContractsCount: 0,
    highestXpUser: "None",
    highestXpCount: 0,
  });

  // Fetch global leaderboard rankings from API with real-time polling
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();

        // Assign ranks and isUser flag
        let ranked = data.map((entry: any, index: number) => {
          const entryAddr = sanitizeAddress(entry.address);
          const userAddr = displayAddress ? sanitizeAddress(displayAddress) : "";
          const isUser = userAddr ? entryAddr === userAddr : false;
          
          return {
            ...entry,
            name: isUser ? `${profileUsername || entry.name} (You)` : entry.name,
            avatar: isUser ? (profileAvatar || entry.avatar) : entry.avatar,
            title: isUser ? (profileTitle || entry.title) : entry.title,
            level: isUser ? (level || entry.level) : entry.level,
            xp: isUser ? (totalXp || entry.xp) : entry.xp,
            isUser,
            rank: index + 1
          };
        });

        // Optimistic update: if current active user isn't in global database yet, add manually (if connected and has XP)
        const hasCurrentUser = ranked.some((p: any) => p.isUser);
        if (!hasCurrentUser && displayAddress && totalXp > 0) {
          const dAddr = sanitizeAddress(displayAddress);
          const userVal = transactions.filter(t => t.type.includes("Deploy")).length;
          
          ranked.push({
            name: `${profileUsername} (You)`,
            avatar: profileAvatar,
            title: profileTitle,
            level: level,
            xp: totalXp,
            contracts: userVal,
            isUser: true,
            address: dAddr,
            rank: ranked.length + 1
          });
        }

        // ALWAYS sort descending by XP, then level, then contracts after applying client overrides
        ranked.sort((a: any, b: any) => {
          if (b.xp !== a.xp) return b.xp - a.xp;
          if (b.level !== a.level) return b.level - a.level;
          return b.contracts - a.contracts;
        });

        // ALWAYS re-assign ranks based on final sorted order
        ranked.forEach((entry: any, index: number) => {
          entry.rank = index + 1;
        });

        setLeaderboard(ranked);

        // Compute shelf stats
        if (ranked.length > 0) {
          let maxContractsProj = ranked[0];
          let maxContractsVal = ranked[0].contracts;
          
          let maxXpProj = ranked[0];
          let maxXpVal = ranked[0].xp;
          
          for (let entry of ranked) {
            if (entry.contracts > maxContractsVal) {
              maxContractsVal = entry.contracts;
              maxContractsProj = entry;
            }
            if (entry.xp > maxXpVal) {
              maxXpVal = entry.xp;
              maxXpProj = entry;
            }
          }
          
          const formatName = (entry: any) => {
            return entry.isUser ? entry.name.replace(" (You)", "") : entry.name;
          };

          setShelfStats({
            mostContractsUser: formatName(maxContractsProj),
            mostContractsCount: maxContractsVal,
            highestXpUser: formatName(maxXpProj),
            highestXpCount: maxXpVal
          });
        }
      } catch (err) {
        console.error("Failed to load global leaderboard data:", err);
      }
    };

    fetchLeaderboard();

    // Set up real-time polling every 5 seconds
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [totalXp, level, profileUsername, profileAvatar, profileTitle, transactions, displayAddress]);

  // Extract Podium spots (top 3)
  const podiumSpots = {
    first: leaderboard.find(e => e.rank === 1),
    second: leaderboard.find(e => e.rank === 2),
    third: leaderboard.find(e => e.rank === 3),
  };

  // Get completed quests for activity logging
  const completedQuests = quests.filter(q => q.completed);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kii-blue"></div>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider font-mono">Loading Hall of Fame...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Crown className="w-8 h-8 text-amber-400" />
          Hub Hall of Fame
        </h1>
        <p className="text-zinc-400 text-sm">
          Real-time builder leaderboards, transaction activity tracking logs, and archived records of top builders on KiiChain.
        </p>
      </div>

      {/* SECTION 1: LIVE SEASON LEADERBOARD */}
      <section className="space-y-6">
        <h2 className="text-base font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-brand-border/40 pb-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          Active Developer Leaderboard
        </h2>

        {/* Podium Highlights */}
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
                {podiumSpots.second.xp.toLocaleString()} XP
              </div>
            </div>
          )}

          {/* Rank 1 - Gold podium */}
          {podiumSpots.first && (
            <div className={`glass-panel p-6 rounded-xl border bg-gradient-to-tr from-amber-400/[0.03] to-transparent relative flex flex-col items-center justify-center text-center h-[250px] md:order-2 order-1 shadow-2xl relative ${
              podiumSpots.first.isUser ? "border-amber-400/60 bg-amber-400/5" : "border-brand-border-purple/35"
            }`}>
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-xl" />
              <div className="absolute -top-8 w-16 h-16 rounded-full border-2 border-amber-400 bg-zinc-950 flex items-center justify-center shadow-2xl">
                <span className="text-2xl">{podiumSpots.first.avatar}</span>
              </div>
              <div className="text-[10px] font-extrabold text-amber-400 tracking-widest uppercase bg-amber-400/10 border border-amber-400/20 px-3 py-0.5 rounded-full mt-6 flex items-center gap-1">
                🥇 CHAMPION
              </div>
              <h4 className="text-base font-extrabold text-white mt-3 truncate w-full">{podiumSpots.first.name}</h4>
              <p className="text-xs text-amber-400 font-bold truncate w-full mt-0.5">{podiumSpots.first.title}</p>
              <div className="text-sm font-black text-white mt-2 font-mono bg-white/[0.02] border border-white/[0.04] px-3 py-1 rounded">
                {podiumSpots.first.xp.toLocaleString()} XP
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
                {podiumSpots.third.xp.toLocaleString()} XP
              </div>
            </div>
          )}
        </div>

        {/* Live Leaderboard Table */}
        <div className="glass-panel p-6 rounded-xl border border-brand-border space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-kii-blue" />
              Ranks & Metrics Table
            </h3>
            <span className="text-[10px] text-zinc-500 font-medium">Updates dynamically based on your active quests & games</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-zinc-400">
              <thead>
                <tr className="border-b border-brand-border text-left text-zinc-500">
                  <th className="pb-3 font-semibold w-16">Rank</th>
                  <th className="pb-3 font-semibold">Builder Profile</th>
                  <th className="pb-3 font-semibold">RPG Title</th>
                  <th className="pb-3 font-semibold">Level Rank</th>
                  <th className="pb-3 font-semibold text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40 font-mono">
                {leaderboard.map((entry) => (
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
                      {entry.xp.toLocaleString()} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 2: BUILDER ACTIVITY LOG TRACKER */}
      <section className="space-y-6">
        <h2 className="text-base font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-brand-border/40 pb-2">
          <History className="w-5 h-5 text-kii-blue" />
          Hub Builder Activity Feed
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* On-Chain Transaction Logs */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-brand-border space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-kii-blue" />
              On-Chain Activity Feed
            </h3>

            {isLoadingActivities && globalActivities.length === 0 ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex justify-between items-center p-3 rounded-lg border border-brand-border/60 bg-zinc-950/10 text-xs">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="h-3.5 w-32 bg-zinc-800 rounded" />
                        <div className="h-2.5 w-16 bg-zinc-900 rounded" />
                      </div>
                      <div className="h-2.5 w-48 bg-zinc-900 rounded" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="h-3 w-16 bg-zinc-800 rounded" />
                      <div className="h-2.5 w-12 bg-zinc-900 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : globalActivities.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {globalActivities.map((tx) => (
                  <div key={tx.hash} className="p-3 rounded-lg border border-brand-border/60 bg-zinc-950/20 flex justify-between items-center text-xs gap-3 font-mono">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate max-w-[150px]">{tx.type}</span>
                        {tx.gamePlayed && (
                          <span className="text-[8px] font-black text-rose-400 uppercase bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-sans">
                            {tx.gamePlayed}
                          </span>
                        )}
                        <span className="text-[9px] text-zinc-500 font-mono">Block #{tx.blockNumber}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-sans truncate">{tx.details || "Transaction confirmed."}</p>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0 gap-1.5 font-mono">
                      <div className="flex items-center gap-2">
                        {tx.xpEarned !== undefined && (
                          <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-sans">
                            +{tx.xpEarned} XP
                          </span>
                        )}
                        <a
                          href={`https://explorer.kiichain.io/tx/${tx.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-kii-blue hover:underline flex items-center gap-0.5"
                        >
                          Hash: {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-600 font-sans text-xs">
                No transactions recorded. Link your wallet, request faucet tokens, deploy contracts, or play arcade games to trigger activities.
              </div>
            )}
          </div>

          {/* Completed Quests Logs */}
          <div className="glass-panel p-5 rounded-xl border border-brand-border space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-kii-emerald" />
              Completed Quest Logs
            </h3>

            {completedQuests.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {completedQuests.map((quest) => (
                  <div key={quest.id} className="p-3 rounded-lg border border-kii-emerald/10 bg-kii-emerald/[0.01] flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-zinc-200">{quest.title}</span>
                      <span className="text-[9px] text-zinc-500 uppercase block tracking-wider font-mono">{quest.category}</span>
                    </div>
                    <span className="font-bold text-kii-emerald font-mono">+{quest.xp} XP</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-600 font-sans text-xs">
                No completed quests yet. Go to the Quest Board to start tasking!
              </div>
            )}
          </div>

        </div>
      </section>



      {/* SECTION 4: ALL-TIME STATS SHELF */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-panel p-5 rounded-xl border border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Most Contracts Deployed</span>
            <span className="text-base font-bold text-white font-mono block truncate max-w-[200px]">{shelfStats.mostContractsUser}</span>
            <span className="text-[10px] text-zinc-400 mt-1 block">{shelfStats.mostContractsCount} Contract Deploys</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-kii-purple/10 border border-kii-purple/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-kii-purple" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Highest XP Ever Recorded</span>
            <span className="text-base font-bold text-white font-mono block truncate max-w-[200px]">{shelfStats.highestXpUser}</span>
            <span className="text-[10px] text-zinc-400 mt-1 block">{shelfStats.highestXpCount.toLocaleString()} Total XP</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-kii-blue/10 border border-kii-blue/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-kii-blue" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-brand-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Network Block Height Records</span>
            <span className="text-base font-bold text-white font-mono block">#{latestBlock.toLocaleString()} Blocks</span>
            <span className="text-[10px] text-zinc-400 mt-1 block">Live Block Explorer Sentry</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-white/[0.02] border border-brand-border flex items-center justify-center">
            <Activity className="w-5 h-5 text-zinc-400" />
          </div>
        </div>

      </section>

      {/* SECTION 5: OUTSTANDING PROJECTS SHOWCASE */}
      <section className="space-y-6">
        <h2 className="text-base font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-brand-border/40 pb-2">
          <Star className="w-4 h-4 text-kii-blue" />
          Top Rated Community Projects
        </h2>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => (
              <div key={proj.id} className="glass-panel p-5 rounded-xl border border-brand-border flex flex-col justify-between gap-5 hover:border-brand-border-purple/35 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{proj.name}</h3>
                    <span className="text-[10px] font-bold text-zinc-500 font-mono">By {profileUsername}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                    {proj.description}
                  </p>
                </div>

                <div className="border-t border-brand-border/40 pt-4 flex items-center gap-4 text-[10px] font-mono font-bold">
                  {proj.githubUrl && (
                    <a 
                      href={proj.githubUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-zinc-300 hover:text-white flex items-center gap-1 hover:underline"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      Repository Code
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                  )}

                  {proj.demoUrl && (
                    <a 
                      href={proj.demoUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-zinc-300 hover:text-white flex items-center gap-1 hover:underline ml-3"
                    >
                      <Globe className="w-3.5 h-3.5 text-kii-blue" />
                      Live Preview
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                  )}

                  <div className="ml-auto text-kii-purple-light flex items-center gap-1">
                    🔥 {proj.visits} visits
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-600 font-medium text-xs border border-dashed border-brand-border rounded-xl bg-brand-dark/10">
            No community projects submitted yet. Go to your <Link href="/profile" className="text-kii-blue hover:underline font-bold">Profile</Link> to publish your first testnet project!
          </div>
        )}
      </section>

    </div>
  );
}
