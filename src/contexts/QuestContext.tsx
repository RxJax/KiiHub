"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { useWallet } from "./WalletContext";
import { POOL_REGISTRY, MASTER_ROUTER_ADDRESS } from "./contracts";

export const sanitizeAddress = (address: string | null | undefined): string => {
  if (!address) return "";
  return address.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
};

const getLocalStorageItemWithMigration = (prefix: string, address: string | null): string | null => {
  if (typeof window === "undefined") return null;
  const addr = sanitizeAddress(address || "0x_demo_user");
  const lowerKey = `${prefix}_${addr}`;
  const lowerVal = localStorage.getItem(lowerKey);
  if (lowerVal) return lowerVal;

  const originalAddr = address || "0x_demo_user";
  if (originalAddr !== addr) {
    const mixedKey = `${prefix}_${originalAddr}`;
    const mixedVal = localStorage.getItem(mixedKey);
    if (mixedVal) {
      localStorage.setItem(lowerKey, mixedVal);
      localStorage.removeItem(mixedKey);
      return mixedVal;
    }
  }
  return null;
};

export interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
  category: "faucet" | "deploy" | "interact" | "explore";
  actionLabel: string;
  actionUrl: string;
  completedAt?: number;
}

export type RarityType = "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  rarity: RarityType;
  unlockedAt?: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
  progress: number;
  target: number;
}

export interface WeeklyMission {
  id: string;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
  progress: number;
  target: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  githubUrl: string;
  demoUrl: string;
  visits: number;
  submittedAt: number;
}

export interface CommunityGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
}

export interface BuilderRank {
  level: number;
  title: string;
  xpRequired: number;
  badge: string;
}

interface QuestContextType {
  quests: Quest[];
  achievements: Achievement[];
  dailyChallenges: DailyChallenge[];
  weeklyMissions: WeeklyMission[];
  projects: Project[];
  referredUsers: string[];
  referralCode: string;
  communityGoals: CommunityGoal[];
  
  totalXp: number;
  level: number;
  levelName: string;
  nextLevelXpRequired: number;
  xpProgress: number; // 0 to 100
  completionPercentage: number;
  
  profileUsername: string;
  profileTitle: string;
  profileAvatar: string;
  
  dailyCountdown: string;
  weeklyCountdown: string;
  seasonProgress: number; // 0 to 100
  seasonDaysRemaining: number;
  
  completeQuest: (id: string) => void;
  resetQuests: () => void;
  updateProfile: (username: string, title: string, avatar: string) => void;
  submitProject: (name: string, description: string, githubUrl: string, demoUrl: string) => void;
  simulateProjectVisit: (projectId: string, amount: number) => void;
  simulateReferral: (moniker: string) => void;
  forceNextDay: () => void;
  triggerXpConfetti: (amount: number) => void;
  addXp: (amount: number) => void;
  incrementDailyChallenge: (id: string) => void;
  incrementWeeklyMission: (id: string) => void;
  trackSwapAction: (fromToken: string, toToken: string, amount: number) => void;
  unlockAchievement: (id: string) => void;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export const useQuests = () => {
  const context = useContext(QuestContext);
  if (!context) {
    throw new Error("useQuests must be used within a QuestProvider");
  }
  return context;
};

// RPG Builder Ranks
const RANKS: BuilderRank[] = [
  { level: 1, title: "Newcomer", xpRequired: 0, badge: "🥉" },
  { level: 2, title: "Explorer", xpRequired: 2000, badge: "🧭" },
  { level: 3, title: "Builder", xpRequired: 5000, badge: "🛠️" },
  { level: 4, title: "Developer", xpRequired: 10000, badge: "💻" },
  { level: 5, title: "Architect", xpRequired: 30000, badge: "🏛️" },
  { level: 6, title: "Kii Master", xpRequired: 50000, badge: "👑" },
];

const getDeterministicProfile = (address: string) => {
  const clean = address.toLowerCase().replace(/[^a-f0-9]/g, "");
  if (!clean) return { name: "Builder", avatar: "🚀" };
  
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const adjectives = ["Alpha", "Giga", "Kii", "Crypto", "Web3", "DeFi", "Block", "Apex", "Turbo", "Sonic", "Byte", "Dev", "Meta", "Quantum", "Nexus"];
  const nouns = ["Builder", "Coder", "Dev", "Architect", "Wizard", "Pioneer", "Explorer", "Validator", "Gamer", "Hacker", "Sovereign", "Specialist"];
  const avatars = ["🚀", "💻", "🛠️", "🧙‍♂️", "🎨", "👾", "🏛️", "🧭", "🔥", "👑", "🦁", "🦊", "🐯", "🐼", "🤖"];
  
  const adj = adjectives[hash % adjectives.length];
  const noun = nouns[Math.abs(hash >> 2) % nouns.length];
  const avatar = avatars[Math.abs(hash >> 4) % avatars.length];
  
  return {
    name: `${adj}${noun}`,
    avatar,
  };
};


const INITIAL_QUESTS: Quest[] = [
  {
    id: "claim_faucet",
    title: "Claim Faucet",
    description: "Request testnet KII tokens from the portal faucet.",
    xp: 5,
    completed: false,
    category: "faucet",
    actionLabel: "Claim KII",
    actionUrl: "/faucet",
  },
  {
    id: "connect_wallet",
    title: "Connect Wallet",
    description: "Securely link your MetaMask or Cosmos developer wallet.",
    xp: 5,
    completed: false,
    category: "explore",
    actionLabel: "Connect Wallet",
    actionUrl: "/wallet-tools",
  },
  {
    id: "first_tx",
    title: "First Transaction",
    description: "Execute your first transaction on KiiChain Testnet.",
    xp: 10,
    completed: false,
    category: "explore",
    actionLabel: "Scan Activity",
    actionUrl: "/explorer",
  },
  {
    id: "send_tx_5",
    title: "Send 5 Transactions",
    description: "Submit 5 transactions to the KiiChain testnet network.",
    xp: 20,
    completed: false,
    category: "explore",
    actionLabel: "Explorer Feed",
    actionUrl: "/explorer",
  },
  {
    id: "send_tx_25",
    title: "Send 25 Transactions",
    description: "Submit 25 transactions to the KiiChain testnet network.",
    xp: 50,
    completed: false,
    category: "explore",
    actionLabel: "Explorer Feed",
    actionUrl: "/explorer",
  },
  {
    id: "deploy_token",
    title: "Deploy Token",
    description: "Deploy a standard utility token contract to the KiiChain Testnet.",
    xp: 100,
    completed: false,
    category: "deploy",
    actionLabel: "Deploy Template",
    actionUrl: "/deploy",
  },
  {
    id: "deploy_nft",
    title: "Deploy NFT",
    description: "Deploy a collectible NFT collection contract to the KiiChain Testnet.",
    xp: 100,
    completed: false,
    category: "deploy",
    actionLabel: "Deploy Template",
    actionUrl: "/deploy",
  },
  {
    id: "deploy_swap_pool",
    title: "Deploy KiiSwap Pool",
    description: "Launch a custom liquidity pool smart contract on the KiiChain Testnet.",
    xp: 300,
    completed: false,
    category: "deploy",
    actionLabel: "Deploy Template",
    actionUrl: "/deploy",
  },
  {
    id: "interact_contract",
    title: "Interact with Contract",
    description: "Interact with a template contract after deployment.",
    xp: 15,
    completed: false,
    category: "interact",
    actionLabel: "Interact Center",
    actionUrl: "/deploy",
  },
  {
    id: "gm_gn",
    title: "Daily Greetings",
    description: "Send a GM or GN greeting to the network.",
    xp: 10,
    completed: false,
    category: "interact",
    actionLabel: "Say GM/GN",
    actionUrl: "/gaming",
  },
  {
    id: "play_game",
    title: "Kii Gamer",
    description: "Play any arcade game on the builder portal.",
    xp: 15,
    completed: false,
    category: "interact",
    actionLabel: "Play Arcade",
    actionUrl: "/gaming",
  },
  {
    id: "swap_first",
    title: "Complete First Swap",
    description: "Execute a swap transaction on KiiSwap.",
    xp: 10,
    completed: false,
    category: "interact",
    actionLabel: "Trade FX",
    actionUrl: "/kiiswap",
  },
  {
    id: "swap_kii_usdc",
    title: "Swap KII → USDC",
    description: "Swap KII native gas to USDC stablecoin.",
    xp: 15,
    completed: false,
    category: "interact",
    actionLabel: "Trade FX",
    actionUrl: "/kiiswap",
  },
  {
    id: "swap_kii_usdt",
    title: "Swap KII → USDT",
    description: "Swap KII native gas to USDT stablecoin.",
    xp: 15,
    completed: false,
    category: "interact",
    actionLabel: "Trade FX",
    actionUrl: "/kiiswap",
  },
  {
    id: "swap_5",
    title: "Complete 5 Swaps",
    description: "Execute 5 swap operations.",
    xp: 40,
    completed: false,
    category: "interact",
    actionLabel: "Trade FX",
    actionUrl: "/kiiswap",
  },
  {
    id: "swap_25",
    title: "Complete 25 Swaps",
    description: "Execute 25 swap operations.",
    xp: 80,
    completed: false,
    category: "interact",
    actionLabel: "Trade FX",
    actionUrl: "/kiiswap",
  },
  {
    id: "quest_grandmaster_architect",
    title: "Hub Overlord",
    description: "Deploy 20+ smart contracts, complete 500+ swaps, stake 5,000 KII, and secure a top 10 spot on the Hall of Fame leaderboard.",
    xp: 1000,
    completed: false,
    category: "deploy",
    actionLabel: "Launch Showcase",
    actionUrl: "/profile",
  },
  {
    id: "quest_kiichain_sovereign",
    title: "Arcade Deployed Legend",
    description: "Reach a monumental 50,000+ total XP.",
    xp: 1000,
    completed: false,
    category: "interact",
    actionLabel: "DEX swaps",
    actionUrl: "/kiiswap",
  },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: "first_steps", title: "First Steps", description: "Complete your first on-chain transaction.", icon: "🔌", unlocked: false, rarity: "Common" },
  { id: "early_builder", title: "Early Builder", description: "Join KiiBuilder Hub during the testnet phase.", icon: "🌱", unlocked: false, rarity: "Common" },
  { id: "explorer_badge", title: "Explorer", description: "Navigate and use every single hub feature.", icon: "🧭", unlocked: false, rarity: "Common" },
  { id: "nft_creator", title: "NFT Creator", description: "Deploy an NFT Collection contract instance.", icon: "🎨", unlocked: false, rarity: "Rare" },
  { id: "defi_builder", title: "DeFi Builder", description: "Deploy a DeFi Faucet or Payment Release template.", icon: "🏦", unlocked: false, rarity: "Rare" },
  { id: "contract_wizard", title: "Contract Wizard", description: "Deploy 5 contract instances.", icon: "🧙‍♂️", unlocked: false, rarity: "Epic" },
  { id: "kii_pioneer", title: "Kii Pioneer", description: "Submit your first builder project to the Hub.", icon: "🛰️", unlocked: false, rarity: "Epic" },
  { id: "gas_burner", title: "Gas Burner", description: "Perform 15 network transactions.", icon: "🔥", unlocked: false, rarity: "Epic" },
  { id: "quest_master", title: "Quest Master", description: "Complete all developer quest board challenges.", icon: "🎓", unlocked: false, rarity: "Legendary" },
  { id: "builder_elite", title: "Builder Elite", description: "Achieve the Architect developer level (Level 5).", icon: "🏛️", unlocked: false, rarity: "Legendary" },
  { id: "kii_gamer_badge", title: "Kii Arcade Hero", description: "Win a jackpot or combo in any arcade game.", icon: "👾", unlocked: false, rarity: "Legendary" },
  { id: "fx_explorer", title: "FX Explorer", description: "Become an expert in cross-border stablecoin conversions.", icon: "💱", unlocked: false, rarity: "Legendary" },
  { id: "hub_overlord", title: "Hub Overlord", description: "Deploy 20+ smart contracts, complete 500+ swaps, stake 5,000 KII, and secure a top 10 spot on the Hall of Fame leaderboard.", icon: "👑", unlocked: false, rarity: "Mythic" },
  { id: "arcade_deployed_legend", title: "Arcade Deployed Legend", description: "Reach a monumental 50,000+ total XP.", icon: "🕹️", unlocked: false, rarity: "Mythic" },
];

const DAILY_QUESTS_POOL: Omit<DailyChallenge, "completed" | "progress">[] = [
  { id: "daily_tx_3", title: "Send 3 Transactions", description: "Perform 3 transactions on KiiChain.", xp: 10, target: 3 },
  { id: "daily_interact_2", title: "Interact with Contracts", description: "Perform 2 smart contract interactions.", xp: 15, target: 2 },
  { id: "daily_explorer", title: "Visit Explorer", description: "Open and load the block explorer page.", xp: 5, target: 1 },
  { id: "daily_claim_faucet", title: "Claim Faucet", description: "Request tokens from the portal faucet.", xp: 5, target: 1 },
  { id: "daily_complete_5", title: "Complete 5 Actions", description: "Execute any 5 wallet actions or claims.", xp: 25, target: 5 },
  { id: "daily_gm_gn", title: "Say GM/GN", description: "Send a daily greeting on KiiChain.", xp: 10, target: 1 },
  { id: "daily_play_game", title: "Play 2 Arcade Games", description: "Play 2 arcade games on KiiChain.", xp: 15, target: 2 },
];

const INITIAL_WEEKLY_MISSIONS: WeeklyMission[] = [
  { id: "weekly_tx_25", title: "Reach 25 Transactions", description: "Process 25 testnet block operations.", xp: 75, completed: false, progress: 0, target: 25 },
  { id: "weekly_all_dailies", title: "Complete All Daily Quests", description: "Execute 10 daily challenge tasks.", xp: 60, completed: false, progress: 0, target: 10 },
  { id: "weekly_submit_project", title: "Submit New Project", description: "Publish a repository or demo link.", xp: 100, completed: false, progress: 0, target: 1 },
];

const INITIAL_COMMUNITY_GOALS: CommunityGoal[] = [
  { id: "comm_txs", title: "10,000 Transactions", current: 0, target: 10000, unit: "Txs" },
  { id: "comm_contracts", title: "500 Contracts Deployed", current: 0, target: 500, unit: "Contracts" },
  { id: "comm_projects", title: "100 Projects Submitted", current: 0, target: 100, unit: "Projects" },
  { id: "comm_quests", title: "5,000 Quest Completions", current: 0, target: 5000, unit: "Quests" },
];

export const QuestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, transactions, displayAddress, realTxCount, globalActivities, stablecoinBalances } = useWallet();
  
  // Game states
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [weeklyMissions, setWeeklyMissions] = useState<WeeklyMission[]>(INITIAL_WEEKLY_MISSIONS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [referredUsers, setReferredUsers] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState<string>("");
  const [communityGoals, setCommunityGoals] = useState<CommunityGoal[]>(INITIAL_COMMUNITY_GOALS);
  const [totalXp, setTotalXp] = useState<number>(0);
  
  // Custom Profile states
  const [profileUsername, setProfileUsername] = useState<string>("user01");
  const [profileTitle, setProfileTitle] = useState<string>("Newcomer");
  const [profileAvatar, setProfileAvatar] = useState<string>("🚀");
  
  // Resets / Seasons countdown timers
  const [dailyCountdown, setDailyCountdown] = useState<string>("23h 59m 59s");
  const [weeklyCountdown, setWeeklyCountdown] = useState<string>("6d 23h 59m 59s");
  const [seasonDaysRemaining, setSeasonDaysRemaining] = useState<number>(30);
  const [questsHydrated, setQuestsHydrated] = useState<boolean>(false);
  const [hydratedAddress, setHydratedAddress] = useState<string | null>(null);

  const isFullyHydrated = !!displayAddress && questsHydrated && hydratedAddress === sanitizeAddress(displayAddress);

  // Sync profile details to the backend global database
  const syncProfileToDb = (
    addr: string, 
    username: string, 
    avatar: string, 
    title: string, 
    levelVal: number, 
    xpVal: number, 
    contractsVal: number
  ) => {
    if (!addr || addr === "0x_demo_user") return;
    fetch("/api/leaderboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        address: addr,
        name: username,
        avatar,
        title,
        level: levelVal,
        xp: xpVal,
        contracts: contractsVal
      })
    }).catch((err) => {
      console.error("Failed to sync profile globally:", err);
    });
  };
  
  // Hydrate states from localStorage when active address changes
  // Hydrate states from localStorage and database when active address changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!displayAddress) {
      // Disconnected: Set to placeholders, do not load or write to localStorage
      setQuests(INITIAL_QUESTS);
      setAchievements(INITIAL_ACHIEVEMENTS);
      setWeeklyMissions(INITIAL_WEEKLY_MISSIONS);
      setProjects([]);
      setReferredUsers([]);
      setProfileUsername("Not Connected");
      setProfileTitle("Guest");
      setProfileAvatar("🔒");
      setTotalXp(0);
      setDailyChallenges([]);
      setQuestsHydrated(false);
      setHydratedAddress(null);
      return;
    }

    const addr = sanitizeAddress(displayAddress);
    
    // Reset hydratedAddress at the start of the effect to prevent other hooks from running with stale address/state
    setQuestsHydrated(false);
    setHydratedAddress(null);

    const runHydration = async () => {
      // 1. One-time leaderboard season reset to 0 XP for everyone (Season 4 Reset)
      const resetKey = `kii_season_reset_v4_${addr}`;
      if (!localStorage.getItem(resetKey)) {
        const keysToReset = [
          `kii_quests_v2_${addr}`,
          `kii_achievements_v2_${addr}`,
          `kii_daily_v2_${addr}`,
          `kii_weekly_v2_${addr}`,
          `kii_projects_v2_${addr}`,
          `kii_referrals_v2_${addr}`,
          `kii_profile_title_${addr}`,
          `kii_total_xp_v2_${addr}`,
          `kii_community_v2_${addr}`,
          `kii_swap_count_${addr}`,
          `kii_swap_volume_${addr}`,
          `kii_stable_conversions_${addr}`,
          `kii_gamer_badge_won_${addr}`
        ];
        keysToReset.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(resetKey, "true");
        
        localStorage.removeItem("kii_quests_v2");
        localStorage.removeItem("kii_achievements_v2");
        localStorage.removeItem("kii_daily_v2");
        localStorage.removeItem("kii_weekly_v2");
        localStorage.removeItem("kii_projects_v2");
        localStorage.removeItem("kii_referrals_v2");
        localStorage.removeItem("kii_total_xp_v2");
        localStorage.removeItem("kii_community_v2");
      }

      // Migrate demo user data to target address if target address has no XP
      const targetXpKey = `kii_total_xp_v2_${addr}`;
      const hasTargetXp = localStorage.getItem(targetXpKey);
      const demoXpVal = localStorage.getItem("kii_total_xp_v2_0x_demo_user");
      const demoXp = demoXpVal ? Number(demoXpVal) : 0;
      
      if (!hasTargetXp && demoXp > 0) {
        const demoKeys = [
          "kii_quests_v2",
          "kii_achievements_v2",
          "kii_daily_v2",
          "kii_weekly_v2",
          "kii_projects_v2",
          "kii_referrals_v2",
          "kii_profile_username",
          "kii_profile_title",
          "kii_profile_avatar",
          "kii_total_xp_v2",
          "kii_community_v2",
          "kii_swap_count",
          "kii_swap_volume",
          "kii_stable_conversions"
        ];
        
        demoKeys.forEach((keyPrefix) => {
          const demoVal = localStorage.getItem(`${keyPrefix}_0x_demo_user`);
          if (demoVal !== null) {
            localStorage.setItem(`${keyPrefix}_${addr}`, demoVal);
          }
        });
      }

      // 2. Query database for user profile details (acts as remote source of truth)
      let dbName = null;
      let dbAvatar = null;
      let dbTitle = null;
      let dbXp = null;

      try {
        const res = await fetch(`/api/leaderboard?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const leaderboard = await res.json();
          const myRow = leaderboard.find((item: any) => sanitizeAddress(item.address) === addr);
          if (myRow) {
            dbName = myRow.name;
            dbAvatar = myRow.avatar;
            dbTitle = myRow.title;
            dbXp = myRow.xp;
          }
        }
      } catch (e) {
        console.error("Failed to fetch user profile from global db during hydration:", e);
      }

      // 3. Load from localStorage, fallback to database or default values
      const cachedQuests = getLocalStorageItemWithMigration("kii_quests_v2", displayAddress);
      const cachedAchievements = getLocalStorageItemWithMigration("kii_achievements_v2", displayAddress);
      const cachedDaily = getLocalStorageItemWithMigration("kii_daily_v2", displayAddress);
      const cachedWeekly = getLocalStorageItemWithMigration("kii_weekly_v2", displayAddress);
      const cachedProjects = getLocalStorageItemWithMigration("kii_projects_v2", displayAddress);
      const cachedReferrals = getLocalStorageItemWithMigration("kii_referrals_v2", displayAddress);
      
      const cachedUsername = dbName || getLocalStorageItemWithMigration("kii_profile_username", displayAddress);
      const cachedTitle = dbTitle || getLocalStorageItemWithMigration("kii_profile_title", displayAddress);
      const cachedAvatar = dbAvatar || getLocalStorageItemWithMigration("kii_profile_avatar", displayAddress);
      const cachedXp = dbXp !== null ? String(dbXp) : getLocalStorageItemWithMigration("kii_total_xp_v2", displayAddress);
      
      // Save database values to localStorage so they persist locally
      if (dbName) localStorage.setItem(`kii_profile_username_${addr}`, dbName);
      if (dbTitle) localStorage.setItem(`kii_profile_title_${addr}`, dbTitle);
      if (dbAvatar) localStorage.setItem(`kii_profile_avatar_${addr}`, dbAvatar);
      if (dbXp !== null) localStorage.setItem(`kii_total_xp_v2_${addr}`, String(dbXp));

      const cachedCommunity = getLocalStorageItemWithMigration("kii_community_v2", displayAddress);

      // Compute activity status
      const xpVal = cachedXp ? Number(cachedXp) : 0;
      const hasTxsVal = localStorage.getItem(`kii_transactions_${addr}`);
      let hasTxs = false;
      if (hasTxsVal) {
        try {
          hasTxs = JSON.parse(hasTxsVal).length > 0;
        } catch (e) {}
      }
      const hasActivity = xpVal > 0 || hasTxs;

      if (cachedQuests) {
        try {
          const parsedQuests = JSON.parse(cachedQuests) as Quest[];
          const now = Date.now();
          let changed = false;
          
          const mergedQuests = INITIAL_QUESTS.map((initial) => {
            const cached = parsedQuests.find((q) => q.id === initial.id);
            if (cached) {
              let completed = cached.completed;
              let completedAt = cached.completedAt;
              
              if (completed && completedAt) {
                const completedDate = new Date(completedAt);
                const currentDate = new Date(now);
                
                const isDifferentDay = currentDate.getUTCFullYear() !== completedDate.getUTCFullYear() ||
                  currentDate.getUTCMonth() !== completedDate.getUTCMonth() ||
                  currentDate.getUTCDate() !== completedDate.getUTCDate();
                  
                if (isDifferentDay && initial.category !== "deploy") {
                  changed = true;
                  completed = false;
                  completedAt = undefined;
                }
              }
              return {
                ...initial,
                completed,
                completedAt
              };
            }
            changed = true;
            return initial;
          });
          
          setQuests(mergedQuests);
          if (changed) {
            saveState("kii_quests_v2", mergedQuests);
          }
        } catch (e) {
          setQuests(INITIAL_QUESTS);
        }
      } else {
        setQuests(INITIAL_QUESTS);
      }

      if (cachedAchievements) {
        try {
          const parsedAchievements = JSON.parse(cachedAchievements) as Achievement[];
          let changed = false;
          
          const mergedAchievements = INITIAL_ACHIEVEMENTS.map((initial) => {
            const cached = parsedAchievements.find((a) => a.id === initial.id);
            if (cached) {
              return {
                ...initial,
                unlocked: cached.unlocked,
                unlockedAt: cached.unlockedAt
              };
            }
            changed = true;
            return initial;
          });
          
          setAchievements(mergedAchievements);
          if (changed) {
            saveState("kii_achievements_v2", mergedAchievements);
          }
        } catch (e) {
          setAchievements(INITIAL_ACHIEVEMENTS);
        }
      } else {
        setAchievements(INITIAL_ACHIEVEMENTS);
      }

      if (cachedWeekly) setWeeklyMissions(JSON.parse(cachedWeekly));
      else setWeeklyMissions(INITIAL_WEEKLY_MISSIONS);

      if (cachedProjects) setProjects(JSON.parse(cachedProjects));
      else setProjects([]);

      if (cachedReferrals) setReferredUsers(JSON.parse(cachedReferrals));
      else setReferredUsers([]);

      if (cachedUsername) {
        setProfileUsername(cachedUsername);
        if (cachedTitle) setProfileTitle(cachedTitle);
        else setProfileTitle("Newcomer");
        if (cachedAvatar) setProfileAvatar(cachedAvatar);
        else setProfileAvatar("🚀");
      } else if (hasActivity) {
        // Create default profile on connection only if they have activity
        const randNum = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
        const defaultUsername = `user${randNum}`;
        setProfileUsername(defaultUsername);
        setProfileTitle("Newcomer");
        setProfileAvatar("🚀");
        localStorage.setItem(`kii_profile_username_${addr}`, defaultUsername);
        localStorage.setItem(`kii_profile_title_${addr}`, "Newcomer");
        localStorage.setItem(`kii_profile_avatar_${addr}`, "🚀");
      } else {
        // Connected but no activity yet - show wallet address as nickname, title as Guest
        setProfileUsername(displayAddress);
        setProfileTitle("Guest");
        setProfileAvatar("🔒");
      }

      setTotalXp(xpVal);

      if (cachedCommunity) setCommunityGoals(JSON.parse(cachedCommunity));
      else setCommunityGoals(INITIAL_COMMUNITY_GOALS);

      // Handle Daily Generation
      if (cachedDaily) {
        const generatedAtKey = `kii_daily_generated_at_${addr}`;
        const genTimeStr = localStorage.getItem(generatedAtKey);
        const genTime = genTimeStr ? Number(genTimeStr) : 0;
        
        const now = new Date();
        const genDate = new Date(genTime);
        
        const isDifferentDay = !genTime || 
          now.getUTCFullYear() !== genDate.getUTCFullYear() ||
          now.getUTCMonth() !== genDate.getUTCMonth() ||
          now.getUTCDate() !== genDate.getUTCDate();
          
        if (isDifferentDay) {
          generateDailyChallenges();
        } else {
          setDailyChallenges(JSON.parse(cachedDaily));
        }
      } else {
        generateDailyChallenges();
      }
      
      // Generate referral code
      const generatedRef = "KII-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      setReferralCode(generatedRef);
      setQuestsHydrated(true);
      setHydratedAddress(addr);
    };

    runHydration();
  }, [displayAddress]);

  // Generate default profile on first activity
  useEffect(() => {
    if (typeof window === "undefined" || !isFullyHydrated) return;
    const addr = sanitizeAddress(displayAddress);
    
    const hasActivity = totalXp > 0 || transactions.length > 0;
    if (hasActivity && (profileUsername === "Not Connected" || profileUsername === "Guest" || profileUsername === displayAddress)) {
      const cachedUsername = localStorage.getItem(`kii_profile_username_${addr}`);
      if (!cachedUsername) {
        const randNum = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
        const defaultUsername = `user${randNum}`;
        setProfileUsername(defaultUsername);
        setProfileAvatar("🚀");
        setProfileTitle("Newcomer");
        
        localStorage.setItem(`kii_profile_username_${addr}`, defaultUsername);
        localStorage.setItem(`kii_profile_avatar_${addr}`, "🚀");
        localStorage.setItem(`kii_profile_title_${addr}`, "Newcomer");
      }
    }
  }, [displayAddress, totalXp, transactions, profileUsername, hydratedAddress, isFullyHydrated]);

  // Bulk sync previous leaderboard profiles from localStorage to global database
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const registryStr = localStorage.getItem("kii_leaderboard_profiles_v2");
    const isSynced = localStorage.getItem("kii_leaderboard_synced_v3");
    
    if (registryStr && !isSynced) {
      try {
        const registry = JSON.parse(registryStr);
        const profilesArray = Object.values(registry)
          .map((p: any) => ({
            address: sanitizeAddress(p.address || p.name),
            name: p.name || p.username || "Anonymous",
            avatar: p.avatar || "🚀",
            title: p.title || "Newcomer",
            level: Number(p.level) || 1,
            xp: Number(p.xp) || 0,
            contracts: Number(p.contracts) || 0
          }))
          .filter(p => p.address && p.xp > 0);
          
        if (profilesArray.length > 0) {
          fetch("/api/leaderboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profilesArray)
          })
          .then(() => {
            localStorage.setItem("kii_leaderboard_synced_v3", "true");
          })
          .catch(err => console.error("Failed to bulk sync leaderboard profiles:", err));
        } else {
          localStorage.setItem("kii_leaderboard_synced_v3", "true");
        }
      } catch (e) {
        console.error("Failed to parse registry for bulk sync", e);
      }
    }
  }, []);

  // Sync to localStorage
  const saveState = (key: string, data: any) => {
    const addr = sanitizeAddress(displayAddress || "0x_demo_user");
    localStorage.setItem(`${key}_${addr}`, JSON.stringify(data));
  };

  // XP progression level logic
  const getLevelInfo = (xp: number) => {
    let activeLevel = RANKS[0];
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (xp >= RANKS[i].xpRequired) {
        activeLevel = RANKS[i];
        break;
      }
    }
    const currentIdx = RANKS.findIndex((r) => r.level === activeLevel.level);
    const nextRank = currentIdx < RANKS.length - 1 ? RANKS[currentIdx + 1] : null;
    
    const xpInLevel = xp - activeLevel.xpRequired;
    const levelSize = nextRank ? (nextRank.xpRequired - activeLevel.xpRequired) : 10000;
    const progress = nextRank 
      ? Math.min(100, Math.round((xpInLevel / levelSize) * 100))
      : 100;
      
    return {
      level: activeLevel.level,
      levelName: activeLevel.title,
      nextLevelXpRequired: nextRank ? nextRank.xpRequired : xp,
      xpProgress: progress
    };
  };

  const { level, levelName, nextLevelXpRequired, xpProgress } = getLevelInfo(totalXp);

  // Trigger XP add animations and Confetti for milestones
  const triggerXpConfetti = (amount: number) => {
    // Pop micro confetti
    confetti({
      particleCount: Math.min(40, amount / 5),
      spread: 50,
      origin: { y: 0.8 },
      colors: ["#6366F1", "#06B6D4", "#10B981", "#8B5CF6"]
    });
  };

  // Add XP helper
  const addXp = (amount: number) => {
    const addr = sanitizeAddress(displayAddress || "0x_demo_user");
    
    // Check if we need to generate a default username
    let currentUsername = localStorage.getItem(`kii_profile_username_${addr}`) || profileUsername;
    let currentAvatar = localStorage.getItem(`kii_profile_avatar_${addr}`) || profileAvatar;
    let currentTitle = localStorage.getItem(`kii_profile_title_${addr}`) || profileTitle;
    
    if (displayAddress && (!currentUsername || currentUsername === "Not Connected" || currentUsername === "Guest" || currentUsername === displayAddress)) {
      const randNum = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
      const defaultUsername = `user${randNum}`;
      currentUsername = defaultUsername;
      currentAvatar = "🚀";
      currentTitle = "Newcomer";
      
      setProfileUsername(defaultUsername);
      setProfileAvatar("🚀");
      setProfileTitle("Newcomer");
      
      localStorage.setItem(`kii_profile_username_${addr}`, defaultUsername);
      localStorage.setItem(`kii_profile_avatar_${addr}`, "🚀");
      localStorage.setItem(`kii_profile_title_${addr}`, "Newcomer");
    }

    setTotalXp((prev) => {
      const newXp = prev + amount;
      localStorage.setItem(`kii_total_xp_v2_${addr}`, String(newXp));
      triggerXpConfetti(amount);
      
      if (displayAddress && addr !== "0x_demo_user") {
        const levelInfo = getLevelInfo(newXp);
        const contractDeploys = transactions.filter(t => t.type.includes("Deploy")).length;
        const swapCount = Number(localStorage.getItem(`kii_swap_count_${addr}`) || "0");
        const swapVolume = Number(localStorage.getItem(`kii_swap_volume_${addr}`) || "0");
        const stablecoinConversions = Number(localStorage.getItem(`kii_stable_conversions_${addr}`) || "0");
        
        // Update registry in localStorage
        const registryStr = localStorage.getItem("kii_leaderboard_profiles_v2");
        let registry: Record<string, any> = {};
        if (registryStr) {
          try {
            registry = JSON.parse(registryStr);
          } catch (e) {}
        }
        
        // Clean registry
        const cleanedRegistry: Record<string, any> = {};
        Object.keys(registry).forEach(key => {
          const cleanKey = sanitizeAddress(key);
          const isValidEvm = /^0x[a-f0-9]{40}$/.test(cleanKey);
          const isValidCosmos = /^kii1[a-z0-9]{38,45}$/.test(cleanKey);
          if (isValidEvm || isValidCosmos) {
            cleanedRegistry[cleanKey] = {
              ...registry[key],
              address: cleanKey
            };
          }
        });
        registry = cleanedRegistry;
        
        delete registry["0x_demo_user"];
        delete registry["null"];
        delete registry["undefined"];
        
        registry[addr] = {
          address: addr,
          name: currentUsername,
          avatar: currentAvatar,
          title: currentTitle,
          level: levelInfo.level,
          xp: newXp,
          contracts: contractDeploys,
          transactionsCount: Math.max(realTxCount, transactions.length),
          projectsCount: projects.length,
          referralsCount: referredUsers.length,
          swapsCount: swapCount,
          swapVolume: swapVolume,
          stablecoinConversions: stablecoinConversions,
          questsCount: quests.filter(q => q.completed).length,
          lastUpdated: Date.now()
        };
        localStorage.setItem("kii_leaderboard_profiles_v2", JSON.stringify(registry));

        syncProfileToDb(addr, currentUsername, currentAvatar, currentTitle, levelInfo.level, newXp, contractDeploys);
      }
      
      return newXp;
    });
  };

  // Unlock badges helper
  const unlockAchievement = (id: string) => {
    if (id === "kii_gamer_badge" && displayAddress) {
      const addr = sanitizeAddress(displayAddress);
      localStorage.setItem(`kii_gamer_badge_won_${addr}`, "true");
    }
    setAchievements((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx === -1 || prev[idx].unlocked) return prev;
      
      const copy = [...prev];
      copy[idx] = { ...copy[idx], unlocked: true, unlockedAt: Date.now() };
      
      saveState("kii_achievements_v2", copy);
      
      // Level milestone celebratory alert sound / large confetti
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FF4500", "#9400D3", "#00FF7F"]
      });
      
      return copy;
    });
  };

  // Generate Daily Pool
  const generateDailyChallenges = () => {
    const addr = sanitizeAddress(displayAddress || "0x_demo_user");
    localStorage.setItem(`kii_daily_generated_at_${addr}`, String(Date.now()));

    // Randomize 3 unique dailies from pool
    const shuffled = [...DAILY_QUESTS_POOL].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map((c) => ({
      ...c,
      completed: false,
      progress: 0
    }));
    setDailyChallenges(selected);
    saveState("kii_daily_v2", selected);
  };

  // Force next day simulation
  const forceNextDay = () => {
    generateDailyChallenges();
    setSeasonDaysRemaining((prev) => {
      const nextDays = Math.max(1, prev - 1);
      return nextDays;
    });
    // Add referral simulator step
    addXp(15);

    // Reset GM/GN greeting timers
    localStorage.removeItem("kii_last_gm_time");
    localStorage.removeItem("kii_last_gn_time");
    localStorage.removeItem("kii_last_gm");
    localStorage.removeItem("kii_last_gn");

    // Reset all completed quests to simulate 24 hours passing
    setQuests((prev) => {
      const copy = prev.map((q) => q.category === "deploy" ? q : { ...q, completed: false, completedAt: undefined });
      saveState("kii_quests_v2", copy);
      return copy;
    });

    // Simulate 24 hours passing on the weekly missions reset timer
    if (displayAddress) {
      const addr = sanitizeAddress(displayAddress);
      const lastResetStr = localStorage.getItem(`kii_weekly_last_reset_${addr}`);
      if (lastResetStr) {
        const lastReset = Number(lastResetStr);
        localStorage.setItem(`kii_weekly_last_reset_${addr}`, String(lastReset - 24 * 60 * 60 * 1000));
      }
    }
  };

  // Daily resetting clock simulator
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = 23 - now.getUTCHours();
      const minutes = 59 - now.getUTCMinutes();
      const seconds = 59 - now.getUTCSeconds();
      
      setDailyCountdown(
        `${hours.toString().padStart(2, "0")}h ${minutes
          .toString()
          .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
      );
      
      // Auto reset if hit UTC midnight
      if (hours === 0 && minutes === 0 && seconds === 0) {
        generateDailyChallenges();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Quest daily cooldown auto-refresh effect (resets at UTC midnight)
  useEffect(() => {
    if (!isFullyHydrated) return;
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;

      setQuests((prev) => {
        const copy = prev.map((q) => {
          if (q.completed && q.completedAt) {
            const completedDate = new Date(q.completedAt);
            const currentDate = new Date(now);
            
            const isDifferentDay = currentDate.getUTCFullYear() !== completedDate.getUTCFullYear() ||
              currentDate.getUTCMonth() !== completedDate.getUTCMonth() ||
              currentDate.getUTCDate() !== completedDate.getUTCDate();
              
            if (isDifferentDay && q.category !== "deploy") {
              changed = true;
              return { ...q, completed: false, completedAt: undefined };
            }
          }
          return q;
        });
        if (changed) {
          saveState("kii_quests_v2", copy);
          return copy;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [displayAddress, hydratedAddress, isFullyHydrated]);

  // Weekly missions 1-week timer and countdown effect
  useEffect(() => {
    if (!isFullyHydrated) return;
    const addr = sanitizeAddress(displayAddress);

    const interval = setInterval(() => {
      let lastResetStr = localStorage.getItem(`kii_weekly_last_reset_${addr}`);
      let lastReset = lastResetStr ? Number(lastResetStr) : 0;
      if (!lastReset) {
        lastReset = Date.now();
        localStorage.setItem(`kii_weekly_last_reset_${addr}`, String(lastReset));
      }

      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const nextReset = lastReset + ONE_WEEK;

      if (now >= nextReset) {
        // Reset weekly missions
        setWeeklyMissions(INITIAL_WEEKLY_MISSIONS);
        saveState("kii_weekly_v2", INITIAL_WEEKLY_MISSIONS);
        localStorage.setItem(`kii_weekly_last_reset_${addr}`, String(now));
      } else {
        const remaining = nextReset - now;
        const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
        const hrs = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        const secs = Math.floor((remaining % (60 * 1000)) / 1000);
        setWeeklyCountdown(`${days}d ${hrs}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [displayAddress, hydratedAddress, isFullyHydrated]);

  // Monitor Wallet status
  useEffect(() => {
    if (!isFullyHydrated) return;
    if (isConnected) {
      completeQuest("connect_wallet");
      unlockAchievement("early_builder");
    }
  }, [isConnected, displayAddress, hydratedAddress, isFullyHydrated]);

  // Monitor transactions feed and realTxCount for dynamic quest and weekly mission validation
  useEffect(() => {
    if (!isFullyHydrated) return;
    
    const now = new Date();
    const startOfUTCDay = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    );

    // Count today's transactions
    const todayTxs = transactions.filter(t => t.timestamp >= startOfUTCDay);
    const todayTxCount = todayTxs.length;

    if (todayTxCount > 0) {
      // First transaction today
      completeQuest("first_tx");
      
      // Multi-transactions today verification checkpoints
      if (todayTxCount >= 5) {
        completeQuest("send_tx_5");
      }
      if (todayTxCount >= 25) {
        completeQuest("send_tx_25");
      }
    }

    // Lifetime achievements verification checkpoints
    const totalTxs = Math.max(realTxCount, transactions.length);
    if (totalTxs > 0) {
      unlockAchievement("first_steps");
      if (totalTxs >= 15) {
        unlockAchievement("gas_burner");
      }
    }

    // Weekly mission "Reach 25 Transactions" progress update
    const addr = sanitizeAddress(displayAddress);
    setWeeklyMissions((prev) => {
      const idx = prev.findIndex(m => m.id === "weekly_tx_25");
      if (idx === -1) return prev;
      
      const mission = prev[idx];
      const nextProgress = Math.max(mission.progress, Math.min(mission.target, totalTxs));
      
      if (mission.progress === nextProgress && mission.completed === (nextProgress >= mission.target)) {
        return prev;
      }
      
      const copy = [...prev];
      copy[idx] = {
        ...mission,
        progress: nextProgress,
        completed: nextProgress >= mission.target
      };
      
      if (nextProgress >= mission.target && !mission.completed) {
        setTimeout(() => addXp(mission.xp), 0);
      }
      
      localStorage.setItem(`kii_weekly_v2_${addr}`, JSON.stringify(copy));
      return copy;
    });

    // Mapped actions verification (only if there are website transactions sent today)
    if (todayTxs.length > 0) {
      const latestTx = todayTxs[0];
      
      if (latestTx.type.includes("Faucet")) {
        completeQuest("claim_faucet");
        incrementDailyChallenge("daily_claim_faucet");
        incrementDailyChallenge("daily_complete_5");
      }
      if (latestTx.type.includes("Deploy Token")) {
        completeQuest("deploy_token");
        incrementDailyChallenge("daily_complete_5");
      }
      if (latestTx.type.includes("Deploy NFT")) {
        completeQuest("deploy_nft");
        unlockAchievement("nft_creator");
        incrementDailyChallenge("daily_complete_5");
      }
      if (latestTx.type.includes("Deploy SimpleSwapPool")) {
        completeQuest("deploy_swap_pool");
        incrementDailyChallenge("daily_complete_5");
      }
      if (latestTx.type.includes("Interaction") || latestTx.type.includes("Transfer")) {
        completeQuest("interact_contract");
        incrementDailyChallenge("daily_interact_2");
        incrementDailyChallenge("daily_complete_5");
      }
    }

    // Auto-complete quests based on today's transaction history (idempotent completeQuest calls)
    if (todayTxs.some(t => t.type.includes("Faucet"))) {
      completeQuest("claim_faucet");
    }
    if (todayTxs.some(t => t.type.includes("Deploy Token"))) {
      completeQuest("deploy_token");
    }
    if (todayTxs.some(t => t.type.includes("Deploy NFT"))) {
      completeQuest("deploy_nft");
    }
    if (todayTxs.some(t => t.type.includes("Deploy SimpleSwapPool"))) {
      completeQuest("deploy_swap_pool");
    }
    if (todayTxs.some(t => t.type.includes("Interaction") || t.type.includes("Transfer"))) {
      completeQuest("interact_contract");
    }
    if (todayTxs.some(t => t.type.includes("Arcade Game") || t.type.includes("Play"))) {
      completeQuest("play_game");
    }

    // Auto-complete swap quests based on today's swap transactions
    const todaySwaps = todayTxs.filter(t => t.type.toLowerCase().includes("swap"));
    const todaySwapCount = todaySwaps.length;
    if (todaySwapCount >= 1) {
      completeQuest("swap_first");
    }
    if (todayTxs.some(t => t.type.toLowerCase().includes("swap") && t.details?.includes("USDC"))) {
      completeQuest("swap_kii_usdc");
    }
    if (todayTxs.some(t => t.type.toLowerCase().includes("swap") && t.details?.includes("USDT"))) {
      completeQuest("swap_kii_usdt");
    }
    if (todaySwapCount >= 5) {
      completeQuest("swap_5");
    }
    if (todaySwapCount >= 25) {
      completeQuest("swap_25");
    }

    // Continuous XP for Dex Swaps, Transfers, and Stakes
    transactions.forEach((tx) => {
      if (tx.status !== "success") return;
      
      const xpAwardedKey = `kii_tx_xp_awarded_${tx.hash.toLowerCase()}`;
      if (localStorage.getItem(xpAwardedKey) === "true") return;
      
      let awardedXp = 0;
      const txTypeLower = tx.type.toLowerCase();
      
      if (txTypeLower.includes("unstake")) {
        awardedXp = 10;
      } else if (txTypeLower.includes("stake")) {
        awardedXp = 20;
      } else if (txTypeLower.includes("swap")) {
        awardedXp = 15;
      } else if (txTypeLower.includes("transfer") || txTypeLower.includes("send")) {
        awardedXp = 10;
      }
      
      if (awardedXp > 0) {
        localStorage.setItem(xpAwardedKey, "true");
        setTimeout(() => {
          addXp(awardedXp);
        }, 0);
      }
    });
  }, [transactions, realTxCount, displayAddress, hydratedAddress, isFullyHydrated]);

  // Dynamically calculate Send 3 Transactions daily quest progress from transactions array
  useEffect(() => {
    if (!isFullyHydrated) return;
    const addr = sanitizeAddress(displayAddress);
    const generatedAtStr = localStorage.getItem(`kii_daily_generated_at_${addr}`);
    const generatedAt = generatedAtStr ? Number(generatedAtStr) : Date.now();
    
    // Count transactions sent since generatedAt
    const todayTxs = transactions.filter(t => t.timestamp >= generatedAt);
    const count = todayTxs.length;
    
    setDailyChallenges((prev) => {
      const idx = prev.findIndex(c => c.id === "daily_tx_3");
      if (idx === -1) return prev;
      
      const task = prev[idx];
      const nextProgress = Math.max(task.progress, Math.min(task.target, count));
      
      if (task.progress === nextProgress && task.completed === (nextProgress >= task.target)) {
        return prev;
      }
      
      const copy = [...prev];
      copy[idx] = {
        ...task,
        progress: nextProgress,
        completed: nextProgress >= task.target
      };
      
      if (nextProgress >= task.target && !task.completed) {
        setTimeout(() => addXp(task.xp), 0);
      }
      
      localStorage.setItem(`kii_daily_v2_${addr}`, JSON.stringify(copy));
      return copy;
    });
  }, [transactions, displayAddress, hydratedAddress, isFullyHydrated]);

  // Achievements unlocking based on level status and activity
  useEffect(() => {
    if (!isFullyHydrated) return;
    const addr = sanitizeAddress(displayAddress);

    const isLocked = (id: string) => {
      return achievements.some(a => a.id === id && !a.unlocked);
    };

    // 1. First Steps
    if ((realTxCount > 0 || transactions.length > 0) && isLocked("first_steps")) {
      unlockAchievement("first_steps");
    }

    // 2. Early Builder
    if (isConnected && isLocked("early_builder")) {
      unlockAchievement("early_builder");
    }

    // 3. NFT Creator
    const hasNftTx = transactions.some(t => t.type.includes("Deploy NFT"));
    const nftQuestCompleted = quests.find(q => q.id === "deploy_nft")?.completed;
    if ((hasNftTx || nftQuestCompleted) && isLocked("nft_creator")) {
      unlockAchievement("nft_creator");
    }

    // 4. DeFi Builder
    const hasDeFiTx = transactions.some(t => t.type.includes("Deploy Faucet") || t.type.includes("Deploy PaymentEscrow") || t.type.includes("Deploy SimpleSwapPool"));
    if (hasDeFiTx && isLocked("defi_builder")) {
      unlockAchievement("defi_builder");
    }

    // 5. Contract Wizard
    const deployCount = transactions.filter(t => t.type.includes("Deploy")).length;
    if (deployCount >= 5 && isLocked("contract_wizard")) {
      unlockAchievement("contract_wizard");
    }

    // 6. Kii Pioneer
    if (projects.length > 0 && isLocked("kii_pioneer")) {
      unlockAchievement("kii_pioneer");
    }

    // 7. Gas Burner
    if ((realTxCount >= 15 || transactions.length >= 15) && isLocked("gas_burner")) {
      unlockAchievement("gas_burner");
    }

    // 8. Quest Master
    const allQuestsCompleted = quests.length > 0 && quests.every(q => q.completed);
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    if ((allQuestsCompleted || unlockedCount >= 9) && isLocked("quest_master")) {
      unlockAchievement("quest_master");
    }

    // 9. Builder Elite
    if (level >= 5 && isLocked("builder_elite")) {
      unlockAchievement("builder_elite");
    }

    // 10. Explorer
    const swapCount = Number(localStorage.getItem(`kii_swap_count_${addr}`) || "0");
    const completedQuestsCount = quests.filter(q => q.completed).length;
    const hasSwapQuest = quests.some(q => q.id.startsWith("swap") && q.completed);
    if (isConnected && completedQuestsCount >= 3 && (swapCount >= 1 || hasSwapQuest) && isLocked("explorer_badge")) {
      unlockAchievement("explorer_badge");
    }

    // 11. Kii Arcade Hero
    if (localStorage.getItem(`kii_gamer_badge_won_${addr}`) === "true" && isLocked("kii_gamer_badge")) {
      unlockAchievement("kii_gamer_badge");
    }

    // 12. FX Explorer
    const hasSwap25 = quests.find(q => q.id === "swap_25")?.completed;
    if ((swapCount >= 25 || hasSwap25) && isLocked("fx_explorer")) {
      unlockAchievement("fx_explorer");
    }

    // 13. Hub Overlord (Mythic)
    const getLeaderboardRank = (): number => {
      const registryStr = localStorage.getItem("kii_leaderboard_profiles_v2");
      if (!registryStr) return 999;
      try {
        const registry = JSON.parse(registryStr);
        const profiles = Object.values(registry).map((p: any) => ({
          address: sanitizeAddress(p.address),
          xp: p.xp
        }));
        profiles.sort((a, b) => b.xp - a.xp);
        const userRank = profiles.findIndex(p => p.address === addr);
        return userRank === -1 ? 999 : userRank + 1;
      } catch (e) {
        return 999;
      }
    };
    const isTop10 = getLeaderboardRank() <= 10;
    const stakedBalance = Number(stablecoinBalances?.sKII || "0");
    if (deployCount >= 20 && swapCount >= 500 && stakedBalance >= 5000 && isTop10) {
      if (isLocked("hub_overlord")) {
        unlockAchievement("hub_overlord");
      }
      completeQuest("quest_grandmaster_architect");
    }

    // 14. Arcade Deployed Legend (Mythic)
    if (totalXp >= 50000) {
      if (isLocked("arcade_deployed_legend")) {
        unlockAchievement("arcade_deployed_legend");
      }
      completeQuest("quest_kiichain_sovereign");
    }

  }, [level, achievements, transactions, quests, projects, isConnected, displayAddress, realTxCount, stablecoinBalances, totalXp, hydratedAddress, isFullyHydrated]);

  // Complete a general board quest
  const completeQuest = (id: string) => {
    setQuests((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx === -1 || prev[idx].completed) return prev;
      
      const copy = [...prev];
      copy[idx] = { ...copy[idx], completed: true, completedAt: Date.now() };
      
      saveState("kii_quests_v2", copy);
      addXp(copy[idx].xp);
      
      // Update community stat progress
      setCommunityGoals((comm) => {
        const copyComm = [...comm];
        const qIdx = copyComm.findIndex(c => c.id === "comm_quests");
        if (qIdx !== -1) {
          copyComm[qIdx].current = Math.min(copyComm[qIdx].target, copyComm[qIdx].current + 1);
        }
        saveState("kii_community_v2", copyComm);
        return copyComm;
      });

      return copy;
    });
  };

  // Helper increment daily challenge progress
  const incrementDailyChallenge = (id: string) => {
    setDailyChallenges((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1 || prev[idx].completed) return prev;
      
      const copy = [...prev];
      const task = copy[idx];
      const nextProgress = Math.min(task.target, task.progress + 1);
      
      copy[idx] = {
        ...task,
        progress: nextProgress,
        completed: nextProgress >= task.target
      };
      
      if (nextProgress >= task.target) {
        addXp(task.xp);
      }
      
      saveState("kii_daily_v2", copy);
      return copy;
    });
  };

  // Helper increment weekly mission progress
  const incrementWeeklyMission = (id: string) => {
    setWeeklyMissions((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1 || prev[idx].completed) return prev;
      
      const copy = [...prev];
      const mission = copy[idx];
      const nextProgress = Math.min(mission.target, mission.progress + 1);
      
      copy[idx] = {
        ...mission,
        progress: nextProgress,
        completed: nextProgress >= mission.target
      };
      
      if (nextProgress >= mission.target) {
        addXp(mission.xp);
      }
      
      saveState("kii_weekly_v2", copy);
      return copy;
    });
  };

  // Profile methods
  const updateProfile = (username: string, title: string, avatar: string) => {
    const addr = sanitizeAddress(displayAddress || "0x_demo_user");
    setProfileUsername(username);
    setProfileTitle(title);
    setProfileAvatar(avatar);
    
    localStorage.setItem(`kii_profile_username_${addr}`, username);
    localStorage.setItem(`kii_profile_title_${addr}`, title);
    localStorage.setItem(`kii_profile_avatar_${addr}`, avatar);
    
    addXp(5); // Reward minor configuration XP and trigger instant database sync with updated profile values
  };

  // Project submissions methods
  const submitProject = (name: string, description: string, githubUrl: string, demoUrl: string) => {
    const newProj: Project = {
      id: "proj_" + Math.random().toString(36).substring(2, 9),
      name,
      description,
      githubUrl,
      demoUrl,
      visits: 0,
      submittedAt: Date.now()
    };
    
    const updated = [newProj, ...projects];
    setProjects(updated);
    saveState("kii_projects_v2", updated);
    
    // Rewards XP
    addXp(50); // submit project
    if (githubUrl.trim()) addXp(25);
    if (demoUrl.trim()) addXp(25);
    
    unlockAchievement("kii_pioneer");
    incrementWeeklyMission("weekly_submit_project");

    // Increment community stat progress
    setCommunityGoals((comm) => {
      const copyComm = [...comm];
      const pIdx = copyComm.findIndex(c => c.id === "comm_projects");
      if (pIdx !== -1) {
        copyComm[pIdx].current = Math.min(copyComm[pIdx].target, copyComm[pIdx].current + 1);
      }
      saveState("kii_community_v2", copyComm);
      return copyComm;
    });
  };

  // Simulate traffic visits on submitted projects
  const simulateProjectVisit = (projectId: string, amount: number) => {
    setProjects((prev) => {
      const idx = prev.findIndex(p => p.id === projectId);
      if (idx === -1) return prev;
      
      const copy = [...prev];
      const originalVisits = copy[idx].visits;
      const nextVisits = originalVisits + amount;
      
      copy[idx] = {
        ...copy[idx],
        visits: nextVisits
      };
      
      // Threshold check for 100 visits
      if (originalVisits < 100 && nextVisits >= 100) {
        addXp(50); // 100 project visits reward
      }
      
      saveState("kii_projects_v2", copy);
      return copy;
    });
  };

  // Simulate referral signup
  const simulateReferral = (moniker: string) => {
    const updated = [moniker, ...referredUsers];
    setReferredUsers(updated);
    saveState("kii_referrals_v2", updated);
    
    // Reward XP based on tier invites count
    const referralsCount = updated.length;
    if (referralsCount === 1) {
      addXp(10);
    } else if (referralsCount === 5) {
      addXp(30);
    } else if (referralsCount === 10) {
      addXp(50);
    } else {
      // General standard invite rewards
      addXp(5);
    }
  };

  // Reset Quests data
  const resetQuests = () => {
    const addr = sanitizeAddress(displayAddress || "0x_demo_user");
    setQuests(INITIAL_QUESTS);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setWeeklyMissions(INITIAL_WEEKLY_MISSIONS);
    setProjects([]);
    setReferredUsers([]);
    setCommunityGoals(INITIAL_COMMUNITY_GOALS);
    setTotalXp(0);
    
    const randNum = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
    const defaultUsername = `user${randNum}`;
    setProfileUsername(defaultUsername);
    setProfileTitle("Newcomer");
    setProfileAvatar("🚀");
    
    // Clear global keys
    localStorage.removeItem("kii_quests_v2");
    localStorage.removeItem("kii_achievements_v2");
    localStorage.removeItem("kii_daily_v2");
    localStorage.removeItem("kii_weekly_v2");
    localStorage.removeItem("kii_projects_v2");
    localStorage.removeItem("kii_referrals_v2");
    localStorage.removeItem("kii_profile_username");
    localStorage.removeItem("kii_profile_title");
    localStorage.removeItem("kii_profile_avatar");
    localStorage.removeItem("kii_total_xp_v2");
    localStorage.removeItem("kii_community_v2");
    
    // Clear address-specific keys
    localStorage.removeItem(`kii_quests_v2_${addr}`);
    localStorage.removeItem(`kii_achievements_v2_${addr}`);
    localStorage.removeItem(`kii_daily_v2_${addr}`);
    localStorage.removeItem(`kii_weekly_v2_${addr}`);
    localStorage.removeItem(`kii_projects_v2_${addr}`);
    localStorage.removeItem(`kii_referrals_v2_${addr}`);
    localStorage.removeItem(`kii_profile_username_${addr}`);
    localStorage.removeItem(`kii_profile_title_${addr}`);
    localStorage.removeItem(`kii_profile_avatar_${addr}`);
    localStorage.removeItem(`kii_total_xp_v2_${addr}`);
    localStorage.removeItem(`kii_community_v2_${addr}`);
    
    generateDailyChallenges();
  };

  // Computed Season parameters
  const seasonProgress = Math.round(((30 - seasonDaysRemaining) / 30) * 100);
  const completionPercentage = quests.length > 0 
    ? Math.round((quests.filter(q => q.completed).length / quests.length) * 100) 
    : 0;

  // Update registry of profiles whenever active user stats/profile details update
  useEffect(() => {
    if (typeof window === "undefined" || !isFullyHydrated) return;
    const contractDeploys = transactions.filter(t => t.type.includes("Deploy")).length;
    
    const registryStr = localStorage.getItem("kii_leaderboard_profiles_v2");
    let registry: Record<string, any> = {};
    if (registryStr) {
      try {
        registry = JSON.parse(registryStr);
      } catch (e) {
        console.error("Failed to parse registry", e);
      }
    }
    
    // Normalize keys in the existing registry to lowercase and trim to prevent duplicates
    const cleanedRegistry: Record<string, any> = {};
    Object.keys(registry).forEach(key => {
      const cleanKey = sanitizeAddress(key);
      const isValidEvm = /^0x[a-f0-9]{40}$/.test(cleanKey);
      const isValidCosmos = /^kii1[a-z0-9]{38,45}$/.test(cleanKey);
      if (isValidEvm || isValidCosmos) {
        cleanedRegistry[cleanKey] = {
          ...registry[key],
          address: cleanKey
        };
      }
    });
    registry = cleanedRegistry;
    
    // Always clean up demo user and invalid entries from registry
    delete registry["0x_demo_user"];
    delete registry["null"];
    delete registry["undefined"];
    
    // Clean up invalid or corrupted profiles from the registry (e.g. name contains 'undefined' or 'null')
    Object.keys(registry).forEach(key => {
      const cleanKey = sanitizeAddress(key);
      if (displayAddress && cleanKey === sanitizeAddress(displayAddress)) return;
      
      const p = registry[cleanKey];
      if (!p || !p.name || p.name.includes("undefined") || p.name.includes("null") || !p.xp || p.xp === 0) {
        delete registry[cleanKey];
      }
    });

    // Process currently connected user profile
    if (displayAddress) {
      const addr = sanitizeAddress(displayAddress);
      
      // Clean up duplicate entries of same user address in case registry has casing issues
      delete registry[addr];
      
      // If user's active username is "RxJax", delete the old mock RxJax profile to prevent duplicate RxJax names
      if (profileUsername === "RxJax" && addr !== "0x52370a367a76d65cca9a20aa9ae4c7d092683a541") {
        delete registry["0x52370a367a76d65cca9a20aa9ae4c7d092683b9a"];
      }

      // If user's active username is "TestUser", delete the old mock TestUser profile to prevent duplicate TestUser names
      if (profileUsername === "TestUser" && addr !== "0x66a6a367a76d65cca9a20aa9ae4c7d092683a541") {
        delete registry["0x66a6a367a76d65cca9a20aa9ae4c7d092683a541"];
      }

      const swapCount = Number(localStorage.getItem(`kii_swap_count_${addr}`) || "0");
      const swapVolume = Number(localStorage.getItem(`kii_swap_volume_${addr}`) || "0");
      const stablecoinConversions = Number(localStorage.getItem(`kii_stable_conversions_${addr}`) || "0");

      // Only create registry profile if there is user activity (connected + done something)
      const hasActivity = totalXp > 0 || contractDeploys > 0 || transactions.length > 0 || swapCount > 0;

      if (hasActivity) {
        registry[addr] = {
          address: addr,
          name: profileUsername,
          avatar: profileAvatar,
          title: profileTitle,
          level: level,
          xp: totalXp,
          contracts: contractDeploys,
          transactionsCount: Math.max(realTxCount, transactions.length),
          projectsCount: projects.length,
          referralsCount: referredUsers.length,
          swapsCount: swapCount,
          swapVolume: swapVolume,
          stablecoinConversions: stablecoinConversions,
          questsCount: quests.filter(q => q.completed).length,
          lastUpdated: Date.now()
        };
        // Sync profile to database globally
        syncProfileToDb(addr, profileUsername, profileAvatar, profileTitle, level, totalXp, contractDeploys);
      } else {
        // If there's no user activity yet, remove from registry to keep leaderboard clean
        delete registry[addr];
      }
    }
    
    localStorage.setItem("kii_leaderboard_profiles_v2", JSON.stringify(registry));
  }, [displayAddress, profileUsername, profileAvatar, profileTitle, level, totalXp, transactions, projects, referredUsers, realTxCount, globalActivities, hydratedAddress, isFullyHydrated]);

  // Dynamically calculate Community Goals based on real statistics of wallets/users
  useEffect(() => {
    if (typeof window === "undefined" || !isFullyHydrated) return;

    const registryStr = localStorage.getItem("kii_leaderboard_profiles_v2");
    let registry: Record<string, any> = {};
    if (registryStr) {
      try {
        registry = JSON.parse(registryStr);
      } catch (e) {
        console.error("Failed to parse registry for community stats:", e);
      }
    }

    // Clean up registry to only include valid addresses with local XP record
    const cleanedRegistry: Record<string, any> = {};
    Object.keys(registry).forEach(key => {
      const cleanKey = sanitizeAddress(key);
      const isValidEvm = /^0x[a-f0-9]{40}$/.test(cleanKey);
      const isValidCosmos = /^kii1[a-z0-9]{38,45}$/.test(cleanKey);
      if (isValidEvm || isValidCosmos) {
        const localXpVal = localStorage.getItem(`kii_total_xp_v2_${cleanKey}`);
        const localXp = localXpVal ? Number(localXpVal) : 0;
        // Keep active user or any profile with local XP
        if ((displayAddress && cleanKey === sanitizeAddress(displayAddress)) || localXp > 0) {
          cleanedRegistry[cleanKey] = registry[key];
        }
      }
    });

    // Sum up values
    let totalTxs = 0;
    let totalContracts = 0;
    let totalProjects = 0;
    let totalQuests = 0;

    Object.values(cleanedRegistry).forEach((p: any) => {
      totalTxs += p.transactionsCount || 0;
      totalContracts += p.contracts || 0;
      totalProjects += p.projectsCount || 0;
      totalQuests += p.questsCount || 0;
    });

    // If current connected user is not yet fully updated in registry, merge/override with their current state
    if (displayAddress) {
      const addr = sanitizeAddress(displayAddress);
      const userTxs = Math.max(realTxCount, transactions.length);
      const userContracts = transactions.filter(t => t.type.includes("Deploy")).length;
      const userProjects = projects.length;
      const userQuests = quests.filter(q => q.completed).length;

      const existingProfile = cleanedRegistry[addr];
      if (!existingProfile) {
        totalTxs += userTxs;
        totalContracts += userContracts;
        totalProjects += userProjects;
        totalQuests += userQuests;
      } else {
        // Adjust sum if registry is stale
        totalTxs += Math.max(0, userTxs - (existingProfile.transactionsCount || 0));
        totalContracts += Math.max(0, userContracts - (existingProfile.contracts || 0));
        totalProjects += Math.max(0, userProjects - (existingProfile.projectsCount || 0));
        totalQuests += Math.max(0, userQuests - (existingProfile.questsCount || 0));
      }
    }

    const updatedGoals = [
      { id: "comm_txs", title: "10,000 Transactions", current: totalTxs, target: 10000, unit: "Txs" },
      { id: "comm_contracts", title: "500 Contracts Deployed", current: totalContracts, target: 500, unit: "Contracts" },
      { id: "comm_projects", title: "100 Projects Submitted", current: totalProjects, target: 100, unit: "Projects" },
      { id: "comm_quests", title: "5,000 Quest Completions", current: totalQuests, target: 5000, unit: "Quests" },
    ];

    setCommunityGoals(updatedGoals);
    localStorage.setItem(`kii_community_v2_${sanitizeAddress(displayAddress || "0x_demo_user")}`, JSON.stringify(updatedGoals));
  }, [displayAddress, transactions, projects, quests, realTxCount, hydratedAddress, isFullyHydrated]);

  const trackSwapAction = (fromToken: string, toToken: string, amount: number) => {
    const addr = sanitizeAddress(displayAddress || "0x_demo_user");

    // 1. Award XP for completing first swap
    completeQuest("swap_first");
    
    // 2. Specific swaps
    if (fromToken === "KII" && toToken === "USDC") {
      completeQuest("swap_kii_usdc");
    }
    if (fromToken === "KII" && toToken === "USDT") {
      completeQuest("swap_kii_usdt");
    }

    // 3. Count conversions
    const swapCountKey = `kii_swap_count_${addr}`;
    const prevCount = Number(localStorage.getItem(swapCountKey) || "0");
    const newCount = prevCount + 1;
    localStorage.setItem(swapCountKey, String(newCount));

    const swapVolumeKey = `kii_swap_volume_${addr}`;
    const prevVolume = Number(localStorage.getItem(swapVolumeKey) || "0");
    const newVolume = prevVolume + amount;
    localStorage.setItem(swapVolumeKey, String(newVolume));

    const stablecoinKey = `kii_stable_conversions_${addr}`;
    const prevStable = Number(localStorage.getItem(stablecoinKey) || "0");
    let newStable = prevStable;
    if (toToken === "USDC" || toToken === "USDT" || toToken === "MXN" || toToken === "BRL" || toToken === "COP") {
      newStable += 1;
      localStorage.setItem(stablecoinKey, String(newStable));
    }

    // Multi-swaps check
    if (newCount >= 5) {
      completeQuest("swap_5");
    }
    if (newCount >= 25) {
      completeQuest("swap_25");
      unlockAchievement("fx_explorer");
    }

    // Update profiles registry immediately
    const registryStr = localStorage.getItem("kii_leaderboard_profiles_v2");
    let registry: Record<string, any> = {};
    if (registryStr) {
      try {
        registry = JSON.parse(registryStr);
      } catch (e) {
        console.error(e);
      }
    }

    // Normalize keys in the existing registry to prevent duplicates
    const cleanedRegistry: Record<string, any> = {};
    Object.keys(registry).forEach(key => {
      const cleanKey = sanitizeAddress(key);
      const isValidEvm = /^0x[a-f0-9]{40}$/.test(cleanKey);
      const isValidCosmos = /^kii1[a-z0-9]{38,45}$/.test(cleanKey);
      if (isValidEvm || isValidCosmos) {
        cleanedRegistry[cleanKey] = {
          ...registry[key],
          address: cleanKey
        };
      }
    });
    registry = cleanedRegistry;

    // Always clean up invalid, demo, or mock keys
    delete registry["0x_demo_user"];
    delete registry["null"];
    delete registry["undefined"];

    if (displayAddress) {
      const addr = sanitizeAddress(displayAddress);
      
      // Clean up duplicate entries of same user address in case registry has casing issues
      delete registry[addr];
      
      // If user's active username is "RxJax", delete the old mock RxJax profile to prevent duplicate RxJax names
      if (profileUsername === "RxJax" && addr !== "0x52370a367a76d65cca9a20aa9ae4c7d092683b9a") {
        delete registry["0x52370a367a76d65cca9a20aa9ae4c7d092683b9a"];
      }

      // If user's active username is "TestUser", delete the old mock TestUser profile to prevent duplicate TestUser names
      if (profileUsername === "TestUser" && addr !== "0x66a6a367a76d65cca9a20aa9ae4c7d092683a541") {
        delete registry["0x66a6a367a76d65cca9a20aa9ae4c7d092683a541"];
      }

      const contractDeploys = transactions.filter(t => t.type.includes("Deploy")).length;
      registry[addr] = {
        address: addr,
        name: profileUsername,
        avatar: profileAvatar,
        title: profileTitle,
        level,
        xp: totalXp,
        contracts: contractDeploys,
        transactionsCount: Math.max(realTxCount, transactions.length),
        projectsCount: projects.length,
        referralsCount: referredUsers.length,
        swapsCount: newCount,
        swapVolume: newVolume,
        stablecoinConversions: newStable,
        questsCount: quests.filter(q => q.completed).length,
        lastUpdated: Date.now()
      };
      localStorage.setItem("kii_leaderboard_profiles_v2", JSON.stringify(registry));
      // Sync profile to database globally
      syncProfileToDb(addr, profileUsername, profileAvatar, profileTitle, level, totalXp, contractDeploys);
    }
  };

  return (
    <QuestContext.Provider
      value={{
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
        nextLevelXpRequired,
        xpProgress,
        completionPercentage,
        
        profileUsername,
        profileTitle,
        profileAvatar,
        
        dailyCountdown,
        weeklyCountdown,
        seasonProgress,
        seasonDaysRemaining,
        
        completeQuest,
        resetQuests,
        updateProfile,
        submitProject,
        simulateProjectVisit,
        simulateReferral,
        forceNextDay,
        triggerXpConfetti,
        addXp,
        incrementDailyChallenge,
        incrementWeeklyMission,
        trackSwapAction,
        unlockAchievement,
      }}
    >
      {children}
    </QuestContext.Provider>
  );
};
