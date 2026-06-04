"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useQuests, RarityType } from "@/contexts/QuestContext";
import { 
  User, 
  Award, 
  Globe, 
  Plus, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  Activity, 
  Check, 
  Edit3, 
  Save, 
  ExternalLink,
  Flame
} from "lucide-react";

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const AVATARS = ["🚀", "🧙‍♂️", "🛡️", "⚡", "🔮", "👽", "👾", "🤖", "🦊", "🦁", "🐉", "🐙"];

const renderMedalPfp = (id: string, unlocked: boolean) => {
  const strokeColor = unlocked ? "currentColor" : "#4b5563";
  
  switch (id) {
    case "first_steps":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="9" width="12" height="8" rx="2" className={unlocked ? "stroke-indigo-400 fill-indigo-900/30" : "fill-zinc-900/20"} />
          <line x1="9" y1="5" x2="9" y2="9" className={unlocked ? "stroke-cyan-400" : ""} />
          <line x1="15" y1="5" x2="15" y2="9" className={unlocked ? "stroke-cyan-400" : ""} />
          <path d="M12 17v4a2 2 0 0 1-2 2H8" className={unlocked ? "stroke-indigo-400" : ""} />
          <path d="M4 4l2 2m14-2l-2 2" className={unlocked ? "stroke-yellow-400 animate-pulse" : ""} />
        </svg>
      );
    case "early_builder":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h16" className={unlocked ? "stroke-zinc-500" : ""} />
          <path d="M12 20a6 6 0 0 0 0-12" className={unlocked ? "stroke-emerald-500" : ""} />
          <path d="M12 8c2-2 4-1 4 2s-2 4-4 2" className={unlocked ? "stroke-emerald-400 fill-emerald-800/40" : "fill-zinc-900/20"} />
          <path d="M12 12c-2-2-4-1-4 2s2 4 4 2" className={unlocked ? "stroke-teal-400 fill-teal-800/40" : "fill-zinc-900/20"} />
          <circle cx="12" cy="6" r="1.5" className={unlocked ? "fill-yellow-400 stroke-none animate-ping" : "fill-zinc-500"} />
        </svg>
      );
    case "nft_creator":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 3.5 3.5 0 0 0 3-1.7 3.5 3.5 0 0 1 4.5-1.3A3.5 3.5 0 0 0 22 12c0-5-4.5-9-10-9z" className={unlocked ? "stroke-cyan-400 fill-cyan-950/40" : "fill-zinc-900/20"} />
          <circle cx="7.5" cy="10.5" r="1.5" className={unlocked ? "fill-pink-500 stroke-none" : "fill-zinc-600"} />
          <circle cx="11.5" cy="7.5" r="1.5" className={unlocked ? "fill-purple-500 stroke-none" : "fill-zinc-600"} />
          <circle cx="16.5" cy="9.5" r="1.5" className={unlocked ? "fill-amber-500 stroke-none" : "fill-zinc-600"} />
          <circle cx="15.5" cy="14.5" r="1.5" className={unlocked ? "fill-emerald-500 stroke-none" : "fill-zinc-600"} />
        </svg>
      );
    case "defi_builder":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" className={unlocked ? "stroke-amber-400 fill-amber-950/40" : "fill-zinc-900/20"} />
          <circle cx="12" cy="12" r="5" className={unlocked ? "stroke-amber-300" : ""} />
          <circle cx="12" cy="12" r="1.5" className={unlocked ? "fill-amber-300 stroke-none" : "fill-zinc-600"} />
          <path d="M12 7v2m0 6v2m-5-5h2m6 0h2" className={unlocked ? "stroke-amber-300" : ""} />
        </svg>
      );
    case "contract_wizard":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" className={unlocked ? "stroke-purple-400" : ""} />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" className={unlocked ? "stroke-purple-400 fill-purple-950/40" : "fill-zinc-900/20"} />
          <path d="M9 10h6M9 14h6" className={unlocked ? "stroke-purple-300" : ""} />
          <path d="M12 5v2M12 17v2" className={unlocked ? "stroke-cyan-400 animate-pulse" : ""} />
        </svg>
      );
    case "kii_pioneer":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" className={unlocked ? "stroke-indigo-400 fill-indigo-950/40" : "fill-zinc-900/20"} />
          <path d="M5 12h14M12 5v14" className={unlocked ? "stroke-indigo-500" : ""} />
          <path d="M4 10h2v4H4zM18 10h2v4h-2z" className={unlocked ? "stroke-cyan-400 fill-cyan-900/40" : "fill-zinc-900/20"} />
          <path d="M10 4h4v2h-4zM10 18h4v2h-4z" className={unlocked ? "stroke-cyan-400 fill-cyan-900/40" : "fill-zinc-900/20"} />
        </svg>
      );
    case "gas_burner":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" className={unlocked ? "stroke-orange-500 fill-orange-950/40" : "fill-zinc-900/20"} />
          <path d="M12 18a3 3 0 0 0 3-3c0-1-.5-2-1-2.5-.5.5-1 1-1 2.5s-.5 1.5-1 1.5-1-.5-1-1.5c0-1.5-.5-2-1-2.5-.5.5-1 1.5-1 2.5a3 3 0 0 0 3 3z" className={unlocked ? "stroke-yellow-400 fill-yellow-500/20" : "fill-zinc-900/20"} />
        </svg>
      );
    case "quest_master":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" className={unlocked ? "stroke-amber-400 fill-amber-950/40" : "fill-zinc-900/20"} />
          <path d="M5 20h14" className={unlocked ? "stroke-amber-300" : ""} />
          <circle cx="2" cy="4" r="1" className={unlocked ? "fill-amber-300 stroke-none" : "fill-zinc-600"} />
          <circle cx="8" cy="4" r="1" className={unlocked ? "fill-amber-300 stroke-none" : "fill-zinc-600"} />
          <circle cx="12" cy="4" r="1" className={unlocked ? "fill-amber-300 stroke-none" : "fill-zinc-600"} />
          <circle cx="16" cy="4" r="1" className={unlocked ? "fill-amber-300 stroke-none" : "fill-zinc-600"} />
          <circle cx="22" cy="4" r="1" className={unlocked ? "fill-amber-300 stroke-none" : "fill-zinc-600"} />
        </svg>
      );
    case "builder_elite":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 10l10-7 10 7H2z" className={unlocked ? "stroke-indigo-400 fill-indigo-950/40" : "fill-zinc-900/20"} />
          <path d="M4 22h16M4 19h16" className={unlocked ? "stroke-indigo-400" : ""} />
          <line x1="6" y1="10" x2="6" y2="19" className={unlocked ? "stroke-indigo-300" : ""} />
          <line x1="10" y1="10" x2="10" y2="19" className={unlocked ? "stroke-indigo-300" : ""} />
          <line x1="14" y1="10" x2="14" y2="19" className={unlocked ? "stroke-indigo-300" : ""} />
          <line x1="18" y1="10" x2="18" y2="19" className={unlocked ? "stroke-indigo-300" : ""} />
        </svg>
      );
    case "explorer_badge":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" className={unlocked ? "stroke-emerald-400 fill-emerald-950/40" : "fill-zinc-900/20"} />
          <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" className={unlocked ? "stroke-emerald-300 fill-emerald-500/20" : "fill-zinc-900/20"} />
          <circle cx="12" cy="12" r="1" className={unlocked ? "fill-emerald-300 stroke-none" : "fill-zinc-600"} />
        </svg>
      );
    case "kii_gamer_badge":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="6" width="16" height="12" rx="2" className={unlocked ? "stroke-rose-500 fill-rose-950/40" : "fill-zinc-900/20"} />
          <circle cx="8" cy="11" r="1.5" className={unlocked ? "fill-rose-300 stroke-none" : "fill-zinc-600"} />
          <circle cx="16" cy="11" r="1.5" className={unlocked ? "fill-rose-300 stroke-none" : "fill-zinc-600"} />
          <path d="M9 15h6M6 6V4M18 6V4" className={unlocked ? "stroke-rose-400" : ""} />
          <path d="M4 14l-2 2M20 14l2 2" className={unlocked ? "stroke-rose-400" : ""} />
        </svg>
      );
    case "fx_explorer":
      return (
        <svg className="w-9 h-9 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" className={unlocked ? "stroke-teal-400 fill-teal-950/40" : "fill-zinc-900/20"} />
          <path d="M8 10h8m-8 4h8" className={unlocked ? "stroke-teal-300" : ""} />
          <path d="M13 7l3 3-3 3M11 17l-3-3 3-3" className={unlocked ? "stroke-teal-300" : ""} />
        </svg>
      );
    case "hub_overlord":
      return (
        <svg className="w-10 h-10 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Detailed neon crown/master emblem */}
          <path d="M12 3l3.5 6.5L22 7l-2 10H4L2 7l6.5 2.5z" className={unlocked ? "stroke-purple-500 fill-purple-950/30" : "fill-zinc-900/20"} />
          {/* Interlocking swap arrows */}
          <path d="M9 14h6m-3-3l3 3-3 3" className={unlocked ? "stroke-pink-500" : ""} />
          {/* Contract brackets */}
          <path d="M7 8H5v7h2M17 8h2v7h-2" className={unlocked ? "stroke-cyan-400" : ""} />
          {/* Arcade controller details */}
          <rect x="10" y="17" width="4" height="2.5" rx="0.5" className={unlocked ? "stroke-rose-400 fill-zinc-900" : ""} />
          <circle cx="11.2" cy="18.25" r="0.4" className={unlocked ? "fill-rose-400" : ""} />
          <circle cx="12.8" cy="18.25" r="0.4" className={unlocked ? "fill-rose-400" : ""} />
        </svg>
      );
    case "arcade_deployed_legend":
      return (
        <svg className="w-10 h-10 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Arcade machine body */}
          <path d="M4 2h16v3l-2 2v11l2 2v2H4v-2l2-2V7L4 5V2z" className={unlocked ? "stroke-purple-500 fill-purple-950/30" : "fill-zinc-900/20"} />
          {/* Cybernetic glowing screen */}
          <rect x="7" y="5" width="10" height="6" rx="0.5" className={unlocked ? "stroke-pink-500 fill-zinc-950" : ""} />
          {/* Glowing controller buttons & joystick */}
          <circle cx="9.5" cy="14" r="0.8" className={unlocked ? "fill-rose-400 stroke-none" : ""} />
          <circle cx="13.5" cy="14" r="0.5" className={unlocked ? "fill-yellow-400 stroke-none" : ""} />
          <circle cx="15" cy="14" r="0.5" className={unlocked ? "fill-yellow-400 stroke-none" : ""} />
          {/* Cybernetic lightning bolts on the sides */}
          <path d="M3 9l1.5 2-2 1M21 9l-1.5 2 2 1" className={unlocked ? "stroke-cyan-400 animate-pulse" : ""} />
          {/* Data streams below the cabinet */}
          <line x1="8" y1="19" x2="8" y2="21" className={unlocked ? "stroke-cyan-400" : ""} />
          <line x1="12" y1="19" x2="12" y2="21" className={unlocked ? "stroke-cyan-400" : ""} />
          <line x1="16" y1="19" x2="16" y2="21" className={unlocked ? "stroke-cyan-400" : ""} />
        </svg>
      );
    default:
      return null;
  }
};

export default function Profile() {
  const { isConnected, displayAddress, transactions, realTxCount, balance, walletType } = useWallet();
  const { 
    achievements, 
    projects, 
    referredUsers, 
    totalXp, 
    level, 
    levelName, 
    nextLevelXpRequired, 
    xpProgress,
    profileUsername, 
    profileTitle, 
    profileAvatar,
    updateProfile, 
    submitProject, 
    simulateProjectVisit
  } = useQuests();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>(profileUsername);
  const [avatarSelect, setAvatarSelect] = useState<string>(profileAvatar);
  const [titleSelect, setTitleSelect] = useState<string>(profileTitle);
  
  // Project form inputs
  const [projectName, setProjectName] = useState<string>("");
  const [projectDesc, setProjectDesc] = useState<string>("");
  const [projectGit, setProjectGit] = useState<string>("");
  const [projectDemo, setProjectDemo] = useState<string>("");
  
  const [showProjForm, setShowProjForm] = useState<boolean>(false);

  // Sync edit values to current profile states
  useEffect(() => {
    setUsernameInput(profileUsername);
    setAvatarSelect(profileAvatar);
    setTitleSelect(profileTitle);
  }, [profileUsername, profileAvatar, profileTitle]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(usernameInput.trim(), titleSelect, avatarSelect);
    setIsEditing(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectDesc.trim()) return;
    submitProject(
      projectName.trim(),
      projectDesc.trim(),
      projectGit.trim(),
      projectDemo.trim()
    );
    setProjectName("");
    setProjectDesc("");
    setProjectGit("");
    setProjectDemo("");
    setShowProjForm(false);
  };

  // Determine Title locks based on level / achievements
  const titlesList = [
    { name: "Newcomer", unlockDesc: "Always unlocked", unlocked: true },
    { name: "Explorer", unlockDesc: "Reach Level 2 Explorer", unlocked: level >= 2 },
    { name: "Builder", unlockDesc: "Reach Level 3 Builder", unlocked: level >= 3 },
    { name: "Smart Contract Engineer", unlockDesc: "Reach Level 4 Developer", unlocked: level >= 4 },
    { name: "Infrastructure Builder", unlockDesc: "Reach Level 4 Developer", unlocked: level >= 4 },
    { name: "Top Builder", unlockDesc: "Reach Level 5 Architect", unlocked: level >= 5 },
    { name: "Kii Master", unlockDesc: "Reach Level 6 Kii Master", unlocked: level >= 6 },
    { name: "OG Builder", unlockDesc: "Connect wallet to Hub", unlocked: isConnected },
    { name: "NFT Creator", unlockDesc: "Deploy NFT Collection contract", unlocked: achievements.find(a => a.id === "nft_creator")?.unlocked || false },
    { name: "DeFi Builder", unlockDesc: "Deploy escrow / payment template", unlocked: achievements.find(a => a.id === "defi_builder")?.unlocked || false },
  ];

  // Group achievements by rarity for background border glowing
  const rarityGlows = {
    Common: "group-hover:shadow-[0_0_15px_rgba(161,161,170,0.15)] border-zinc-700/30 dark:border-white/10 bg-white/[0.01] hover:border-zinc-500/50",
    Rare: "group-hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] border-cyan-500/20 bg-cyan-500/[0.02] hover:border-cyan-400/50",
    Epic: "group-hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] border-purple-500/20 bg-purple-500/[0.02] hover:border-purple-400/50",
    Legendary: "group-hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-400/50",
    Mythic: "animate-mythic-glow border-transparent [background-clip:padding-box,border-box] [background-origin:padding-box,border-box] bg-[linear-gradient(var(--zinc-950),var(--zinc-950)),linear-gradient(to_right,#7c3aed,#ec4899,#ef4444)] hover:bg-[linear-gradient(var(--zinc-900),var(--zinc-900)),linear-gradient(to_right,#8b5cf6,#f43f5e,#f43f5e)]"
  };

  const lockedRarityStyles = {
    Common: "border-zinc-700/20 bg-zinc-950/20 text-zinc-500",
    Rare: "border-cyan-500/10 bg-cyan-500/[0.005] text-cyan-500/40",
    Epic: "border-purple-500/10 bg-purple-500/[0.005] text-purple-500/40",
    Legendary: "border-amber-500/10 bg-amber-500/[0.005] text-amber-500/40",
    Mythic: "border-transparent [background-clip:padding-box,border-box] [background-origin:padding-box,border-box] bg-[linear-gradient(var(--zinc-950),var(--zinc-950)),linear-gradient(to_right,rgba(124,58,237,0.2),rgba(236,72,153,0.2),rgba(239,68,68,0.2))]"
  };

  const rarityBadgeStyles = {
    Common: "bg-zinc-800/80 text-zinc-300 border-zinc-700/50",
    Rare: "bg-cyan-950/50 text-cyan-300 border-cyan-500/30",
    Epic: "bg-purple-950/50 text-purple-300 border-purple-500/30",
    Legendary: "bg-amber-950/50 text-amber-300 border-amber-500/30",
    Mythic: "bg-gradient-to-r from-violet-600 via-pink-600 to-red-500 text-white border-transparent shadow-[0_0_10px_rgba(236,72,153,0.3)] font-extrabold"
  };

  return (
    <div className="relative overflow-hidden min-h-screen -mx-4 lg:-mx-8 -my-6 lg:-my-10 px-4 lg:px-8 py-6 lg:py-10 transition-colors duration-300 bg-slate-50 dark:bg-[#0B0C10]">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes mythic-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(124, 58, 237, 0.25), 0 0 5px rgba(239, 68, 68, 0.15); }
          50% { box-shadow: 0 0 35px rgba(124, 58, 237, 0.55), 0 0 15px rgba(239, 68, 68, 0.35); }
        }
        .animate-mythic-glow:hover {
          animation: mythic-pulse 1.8s ease-in-out infinite;
        }
      `}} />
      {/* Glowing Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 space-y-8">
        {/* Title */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <User className="w-8 h-8 text-kii-purple" />
            Builder Profile Manager
          </h1>
          <p className="text-zinc-400 text-sm">
            Customize your public builder cards, view unlocked achievements, and manage submitted testnet projects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Card & Customization */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 relative overflow-hidden flex flex-col justify-between h-fit shadow-xl group">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-kii-purple/5 blur-2xl pointer-events-none" />
            
            <div className="space-y-5">
              {/* Top avatar display */}
              {isEditing ? (
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-kii-purple/20 to-kii-blue/15 border border-brand-border-purple/35 flex items-center justify-center text-4xl shadow-xl">
                    {avatarSelect}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h2 className="text-base font-extrabold text-white truncate">{usernameInput || profileUsername}</h2>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block bg-zinc-950/80 px-2 py-0.5 rounded border border-brand-border w-fit font-mono">
                      {titleSelect || profileTitle}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-5">
                  <div className="relative group/avatar">
                    {/* Outer cyber pulsing border */}
                    <div className="absolute inset-0 -m-1 rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 opacity-70 blur-sm group-hover/avatar:opacity-100 group-hover/avatar:blur-md transition-all duration-500" />
                    
                    {/* Avatar container */}
                    <div className="relative w-20 h-20 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-center text-4xl shadow-xl overflow-hidden">
                      {/* Cyber decorative corners */}
                      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400" />
                      
                      {/* Scanline effect */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,182,212,0.05)_50%,transparent_50%)] bg-[size:100%_4px] pointer-events-none" />
                      
                      <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{profileAvatar}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white truncate leading-none">{profileUsername}</h2>
                      <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 transition-all"
                        title="Edit Profile"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block bg-cyan-950/30 px-2.5 py-0.5 rounded-full border border-cyan-500/20 w-fit font-mono shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                      {profileTitle}
                    </span>
                  </div>
                </div>
              )}

              {/* Editing Form */}
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-5 pt-5 border-t border-white/10">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Nickname</label>
                    <input
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                    />
                  </div>

                  {/* Avatar Picker */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Choose Avatar</label>
                    <div className="grid grid-cols-6 gap-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                      {AVATARS.map((av) => (
                        <button
                          type="button"
                          key={av}
                          onClick={() => setAvatarSelect(av)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl hover:bg-white/10 transition-all border ${
                            avatarSelect === av ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.15)]" : "border-white/5 bg-white/[0.02]"
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Title Badge</label>
                    <select
                      value={titleSelect}
                      onChange={(e) => setTitleSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                    >
                      {titlesList.map((t) => (
                        <option key={t.name} value={t.name} disabled={!t.unlocked} className="bg-zinc-950 text-white">
                          {t.name} {!t.unlocked ? `(Locked: ${t.unlockDesc})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-gradient-to-r from-kii-purple to-kii-blue hover:opacity-90 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-500/25"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Profile
                    </button>
                  </div>
                </form>
              ) : (
                // Read mode RPG details
                <div className="space-y-3 pt-5 border-t border-white/10 font-mono text-[11px]">
                  {/* Wallet Address */}
                  <div className="flex items-center justify-between py-2 px-3 bg-white/[0.01] border border-white/5 rounded-xl hover:bg-white/[0.03] transition-all group/stat">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] group-hover/stat:animate-ping" />
                      Address
                    </span>
                    <span className="text-cyan-400 font-bold tracking-wide" title={displayAddress || ""}>
                      {displayAddress ? `${displayAddress.slice(0, 8)}...${displayAddress.slice(-6)}` : "Demo Mode"}
                    </span>
                  </div>

                  {/* Network Wallet type */}
                  <div className="flex items-center justify-between py-2 px-3 bg-white/[0.01] border border-white/5 rounded-xl hover:bg-white/[0.03] transition-all">
                    <span className="text-zinc-400">Network Wallet</span>
                    <span className="text-zinc-200 capitalize font-semibold">{walletType || "none"}</span>
                  </div>

                  {/* Wallet Balance */}
                  <div className="flex items-center justify-between py-2 px-3 bg-white/[0.01] border border-white/5 rounded-xl hover:bg-white/[0.03] transition-all">
                    <span className="text-zinc-400">Wallet balance</span>
                    <span className="text-indigo-300 font-bold">{balance} KII</span>
                  </div>

                  {/* Invited builders */}
                  <div className="flex items-center justify-between py-2 px-3 bg-white/[0.01] border border-white/5 rounded-xl hover:bg-white/[0.03] transition-all">
                    <span className="text-zinc-400">Invited builders</span>
                    <span className="text-purple-300 font-bold">{referredUsers.length}</span>
                  </div>

                  {/* Submitted projects */}
                  <div className="flex items-center justify-between py-2 px-3 bg-white/[0.01] border border-white/5 rounded-xl hover:bg-white/[0.03] transition-all">
                    <span className="text-zinc-400">Submitted projects</span>
                    <span className="text-emerald-400 font-bold">{projects.length}</span>
                  </div>

                  {/* Tx Count */}
                  <div className="flex items-center justify-between py-2 px-3 bg-white/[0.01] border border-white/5 rounded-xl hover:bg-white/[0.03] transition-all">
                    <span className="text-zinc-400">On-Chain Tx Count</span>
                    <span className="text-yellow-400 font-bold">{realTxCount} Txs</span>
                  </div>
                </div>
              )}
            </div>

            {/* Level Progress bottom shelf */}
            <div className="pt-5 border-t border-white/10 mt-6 space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                <span>{levelName} level progress</span>
                <span className="text-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.2)]">{xpProgress}%</span>
              </div>
              
              <div className="w-full h-2.5 rounded-full bg-zinc-950/80 border border-white/10 overflow-hidden p-[1px]">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              
              <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                <span>Level {level} Builder</span>
                <span>{totalXp} XP</span>
              </div>
            </div>

          </div>

          {/* Achievements Showcase Cabinet */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/10 pb-3">
              <Award className="w-4.5 h-4.5 text-kii-purple" />
              Achievements Showcase Cabinet
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(() => {
                const rarityOrder: Record<RarityType, number> = {
                  Common: 1,
                  Rare: 2,
                  Epic: 3,
                  Legendary: 4,
                  Mythic: 5
                };
                const sorted = [...achievements].sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
                return sorted.map((ach) => (
                  <div 
                    key={ach.id} 
                    className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all duration-300 relative overflow-hidden h-full group ${
                      ach.unlocked 
                        ? `${rarityGlows[ach.rarity]} backdrop-blur-md ${ach.rarity !== "Mythic" ? "bg-[#13141f]/35" : ""}` 
                        : `${lockedRarityStyles[ach.rarity]} opacity-40`
                    }`}
                  >
                    {/* Glass sheen / reflection effect */}
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[linear-gradient(45deg,transparent,rgba(255,255,255,0.01)_45%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.01)_55%,transparent)] transform -translate-x-[30%] -translate-y-[30%] group-hover:translate-x-[30%] group-hover:translate-y-[30%] transition-transform duration-1000 ease-out pointer-events-none" />

                    {/* Top Rarity Tag */}
                    <div className={`text-[7px] font-mono tracking-wider font-extrabold px-2 py-0.5 rounded-full border uppercase ${rarityBadgeStyles[ach.rarity]}`}>
                      {ach.rarity}
                    </div>

                    {/* 3D Glass Medal Container */}
                    <div className="relative mt-2">
                      {/* Glowing ring under medal */}
                      <div className={`absolute inset-[-4px] rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300 ${
                        ach.rarity === "Mythic" ? "bg-gradient-to-tr from-violet-500 via-pink-500 to-red-500 animate-pulse" :
                        ach.rarity === "Legendary" ? "bg-amber-500" :
                        ach.rarity === "Epic" ? "bg-purple-500" :
                        ach.rarity === "Rare" ? "bg-cyan-500" : "bg-zinc-400"
                      }`} />
                      
                      <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-b from-white/15 to-white/5 border border-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.4)] overflow-hidden">
                        {ach.unlocked ? (
                          <div className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-all duration-300">
                            {renderMedalPfp(ach.id, true)}
                          </div>
                        ) : (
                          <div className="relative w-full h-full flex items-center justify-center opacity-40">
                            <div className="blur-[1px] grayscale">
                              {renderMedalPfp(ach.id, false)}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-zinc-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                      <h4 className={`text-xs font-bold ${ach.unlocked ? "text-white" : "text-zinc-500"} leading-snug tracking-wide group-hover:text-cyan-300 transition-colors`}>
                        {ach.title}
                      </h4>
                      <p className="text-[9px] text-zinc-500 leading-relaxed font-medium max-w-[120px] mx-auto">
                        {ach.description}
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

        </div>

        {/* Projects Submissions Section */}
        <section className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-cyan-400" />
                Your Published Projects
              </h3>
              <p className="text-xs text-zinc-400 mt-1">Submit testnet applications, repositories, and links to earn massive Builder XP.</p>
            </div>
            
            <button
              onClick={() => setShowProjForm(!showProjForm)}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-kii-purple to-kii-blue text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              {showProjForm ? "Hide Form" : "Publish Project"}
            </button>
          </div>

          {/* Create Form */}
          {showProjForm && (
            <form onSubmit={handleCreateProject} className="p-5 bg-zinc-950/60 border border-white/10 rounded-2xl max-w-2xl space-y-4 relative z-10 font-sans">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Publish New Testnet Application</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KiiSwap AMM Protocol"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Tagline / Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A fast decentralized swap built on KiiChain v3"
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1.5 tracking-wider">
                    <Github className="w-3.5 h-3.5 text-zinc-400" />
                    GitHub Repository (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://github.com/user/project"
                    value={projectGit}
                    onChange={(e) => setProjectGit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1.5 tracking-wider">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Live Demo URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://kiiswap.vercel.app"
                    value={projectDemo}
                    onChange={(e) => setProjectDemo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <span className="text-[10px] text-zinc-400 font-bold font-mono self-center mr-auto">
                  Potential Rewards: Up to +100 XP
                </span>
                <button
                  type="button"
                  onClick={() => setShowProjForm(false)}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-kii-purple to-kii-blue text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-md shadow-indigo-500/20"
                >
                  Submit Project
                </button>
              </div>
            </form>
          )}

          {/* Projects List */}
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 font-sans">
              {projects.map((proj) => (
                <div key={proj.id} className="p-5 bg-zinc-950/40 border border-white/10 rounded-2xl flex flex-col justify-between gap-5 relative group hover:border-cyan-500/30 hover:bg-zinc-950/60 transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{proj.name}</h4>
                      <span className="text-[10px] font-mono font-bold text-zinc-400 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                        <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        {proj.visits} visits
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-normal font-medium">{proj.description}</p>
                  </div>

                  <div className="flex items-center gap-3 border-t border-white/5 pt-3.5 text-[10px] font-bold font-mono">
                    {proj.githubUrl && (
                      <a 
                        href={proj.githubUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-zinc-300 hover:text-white flex items-center gap-1 hover:underline transition-colors"
                      >
                        <Github className="w-3.5 h-3.5" />
                        Repository
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    )}

                    {proj.demoUrl && (
                      <a 
                        href={proj.demoUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-zinc-300 hover:text-cyan-400 flex items-center gap-1 hover:underline transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        Demo Link
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </a>
                    )}

                    <button
                      onClick={() => simulateProjectVisit(proj.id, 10)}
                      className="ml-auto py-1 px-3 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:text-white hover:border-indigo-400 hover:bg-indigo-500/20 transition-all font-sans text-[10px] font-semibold"
                      title="Simulate user traffic to verify Level milestones"
                    >
                      Simulate 10 Visits
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 font-medium relative z-10">
              No projects submitted yet. Create one above to claim your Kii Pioneer badge and XP bonuses!
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
