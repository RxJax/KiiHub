"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useQuests } from "@/contexts/QuestContext";
import { 
  MessageSquare, 
  Gamepad2, 
  X, 
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Share2,
  RotateCw,
  Gift,
  Clover,
  Clock
} from "lucide-react";
import confetti from "canvas-confetti";

// Sound Synthesizer using Web Audio API
const playSound = (type: "click" | "spin" | "win" | "lose" | "coin" | "dice") => {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "spin") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "win") {
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.1 + 0.3);
        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 0.3);
      });
    } else if (type === "lose") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "coin") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "dice") {
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 800;
      
      const noise = ctx.createBufferSource();
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;
      
      const gain = ctx.createGain();
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      noise.start();
      noise.stop(ctx.currentTime + 0.2);
    }
  } catch (err) {
    console.warn("Web Audio not allowed or failed:", err);
  }
};

// Custom SVG Reel Icons to match Image 3 exactly
const EthereumLogo = () => (
  <img src="/ethereum-eth-logo.png" alt="Ethereum" className="w-12 h-12 object-contain" />
);

const BitcoinLogo = () => (
  <img src="/bitcoin-btc-logo.png" alt="Bitcoin" className="w-12 h-12 object-contain" />
);

const USDCLogo = () => (
  <img src="/usd-coin-usdc-logo.png" alt="USDC" className="w-12 h-12 object-contain" />
);

const TetherLogo = () => (
  <img src="/tether-usdt-logo.png" alt="Tether" className="w-12 h-12 object-contain" />
);

const HeadsIcon = () => (
  <svg className="w-12 h-12 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
    <path d="M8 9h8M8 15h8M10 9v6M14 9v6" />
  </svg>
);

const TailsIcon = () => (
  <svg className="w-12 h-12 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

export default function GamingArcade() {
  const { isConnected, displayAddress, balance, sendGasFeeTransaction, latestBlock, addTransaction } = useWallet();
  const { addXp, completeQuest, incrementDailyChallenge, triggerXpConfetti, unlockAchievement } = useQuests();

  // Greeting States
  const [greetedGM, setGreetedGM] = useState(false);
  const [greetedGN, setGreetedGN] = useState(false);
  const [gmCountdown, setGmCountdown] = useState<string>("");
  const [gnCountdown, setGnCountdown] = useState<string>("");
  const [greetingLoading, setGreetingLoading] = useState<"gm" | "gn" | null>(null);

  // Active Game State
  const [activeGame, setActiveGame] = useState<"coin" | "dice" | "slots" | "number" | null>(null);
  
  // Transaction processing states
  const [txPending, setTxPending] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Game gameplay indicators
  const [gamePlaying, setGamePlaying] = useState(false);
  const [gameOutcome, setGameOutcome] = useState<{
    status: "win" | "lose" | "combo" | "idle";
    message: string;
    xpEarned: number;
  }>({ status: "idle", message: "", xpEarned: 0 });

  // 1. Coin Flip states
  const [coinPrediction, setCoinPrediction] = useState<"heads" | "tails">("heads");
  const [coinAnimActive, setCoinAnimActive] = useState(false);
  const [coinResult, setCoinResult] = useState<"heads" | "tails" | null>(null);

  // 2. Dice Roll states
  const [dicePrediction, setDicePrediction] = useState<number>(1);
  const [diceResult, setDiceResult] = useState<[number, number]>([1, 1]);

  // 3. Crypto Slots states
  const [slotsCredits, setSlotsCredits] = useState<number>(0);
  const [slotsResult, setSlotsResult] = useState<[string, string, string, string]>(["eth", "btc", "usdc", "usdt"]);
  const [customCreditAmount, setCustomCreditAmount] = useState<string>("");

  // 4. Lucky Number states
  const [luckyPrediction, setLuckyPrediction] = useState<number>(1);
  const [luckyResult, setLuckyResult] = useState<number | null>(null);

  const slotLogos = ["eth", "btc", "usdc", "usdt"];

  // Initialize states on mount and update with a tick timer for daily reset at international time
  useEffect(() => {
    const checkGreetings = () => {
      const lastGM = localStorage.getItem("kii_last_gm_time");
      const lastGN = localStorage.getItem("kii_last_gn_time");
      const now = Date.now();

      if (lastGM) {
        const lastGMTime = Number(lastGM);
        const lastGMDate = new Date(lastGMTime);
        const currentDate = new Date(now);
        
        const isSameDay = currentDate.getUTCFullYear() === lastGMDate.getUTCFullYear() &&
          currentDate.getUTCMonth() === lastGMDate.getUTCMonth() &&
          currentDate.getUTCDate() === lastGMDate.getUTCDate();
          
        if (isSameDay) {
          setGreetedGM(true);
          const nextMidnight = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate() + 1,
            0, 0, 0, 0
          ));
          const remaining = nextMidnight.getTime() - now;
          const hrs = Math.floor(remaining / (60 * 60 * 1000));
          const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
          const secs = Math.floor((remaining % (60 * 1000)) / 1000);
          setGmCountdown(`${hrs.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`);
        } else {
          setGreetedGM(false);
          setGmCountdown("");
        }
      } else {
        setGreetedGM(false);
        setGmCountdown("");
      }

      if (lastGN) {
        const lastGNTime = Number(lastGN);
        const lastGNDate = new Date(lastGNTime);
        const currentDate = new Date(now);
        
        const isSameDay = currentDate.getUTCFullYear() === lastGNDate.getUTCFullYear() &&
          currentDate.getUTCMonth() === lastGNDate.getUTCMonth() &&
          currentDate.getUTCDate() === lastGNDate.getUTCDate();
          
        if (isSameDay) {
          setGreetedGN(true);
          const nextMidnight = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate() + 1,
            0, 0, 0, 0
          ));
          const remaining = nextMidnight.getTime() - now;
          const hrs = Math.floor(remaining / (60 * 60 * 1000));
          const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
          const secs = Math.floor((remaining % (60 * 1000)) / 1000);
          setGnCountdown(`${hrs.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`);
        } else {
          setGreetedGN(false);
          setGnCountdown("");
        }
      } else {
        setGreetedGN(false);
        setGnCountdown("");
      }
    };

    checkGreetings();
    const interval = setInterval(checkGreetings, 1000);

    const savedCredits = localStorage.getItem("kii_slots_credits");
    if (savedCredits) setSlotsCredits(Number(savedCredits));

    return () => clearInterval(interval);
  }, []);

  const updateCredits = (amount: number) => {
    setSlotsCredits(prev => {
      const next = prev + amount;
      localStorage.setItem("kii_slots_credits", String(next));
      return next;
    });
  };

  const handleGreeting = async (type: "gm" | "gn") => {
    if (greetingLoading) return;
    playSound("click");
    setGreetingLoading(type);
    setErrorText(null);

    const actionText = type === "gm" ? "GM Greeting" : "GN Greeting";
    try {
      const res = await sendGasFeeTransaction(actionText, 0.001);
      if (res.success) {
        playSound("win");
        const now = Date.now();
        localStorage.setItem(`kii_last_${type}_time`, String(now));
        if (type === "gm") setGreetedGM(true);
        if (type === "gn") setGreetedGN(true);

        addXp(10);
        completeQuest("gm_gn");
        incrementDailyChallenge("daily_gm_gn");
        incrementDailyChallenge("daily_complete_5");
        triggerXpConfetti(10);
      } else {
        setErrorText(res.error || "Transaction rejected or failed.");
      }
    } catch (e: any) {
      setErrorText(e.message || "An unexpected error occurred.");
    } finally {
      setGreetingLoading(null);
    }
  };

  // Triggers the MetaMask transaction / Simulated gas payment
  const startArcadeTransaction = async (actionLabel: string, feeKii: number): Promise<string | null> => {
    playSound("click");
    setTxPending(true);
    setPendingTxHash(null);
    setErrorText(null);
    setGameOutcome({ status: "idle", message: "", xpEarned: 0 });
    setGamePlaying(false);

    try {
      const res = await sendGasFeeTransaction(actionLabel, feeKii);
      if (res.success) {
        const hash = res.txHash || "0x_arcade_sim_" + Math.random().toString(36).substring(2, 14);
        setPendingTxHash(hash);
        setTxPending(false);
        setGamePlaying(true);
        return hash;
      } else {
        setTxPending(false);
        setErrorText(res.error || "Transaction was rejected.");
        return null;
      }
    } catch (e: any) {
      setTxPending(false);
      setErrorText(e.message || "An unexpected error occurred.");
      return null;
    }
  };

  // 1. COIN FLIP PLAY
  const playCoinFlip = async () => {
    const txHash = await startArcadeTransaction("Coin Flip Play", 0.001);
    if (!txHash) return;

    setCoinAnimActive(true);
    playSound("coin");

    let animInterval = setInterval(() => {
      setCoinResult(prev => prev === "heads" ? "tails" : "heads");
      playSound("spin");
    }, 90);

    setTimeout(() => {
      clearInterval(animInterval);
      setCoinAnimActive(false);
      setGamePlaying(false);

      const finalOutcome = Math.random() > 0.5 ? "heads" : "tails";
      setCoinResult(finalOutcome);

      const won = finalOutcome === coinPrediction;
      const baseXP = 15;
      const winXP = won ? 75 : 0;
      const totalEarned = baseXP + winXP;

      addXp(totalEarned);
      completeQuest("play_game");
      incrementDailyChallenge("daily_play_game");
      incrementDailyChallenge("daily_complete_5");

      addTransaction({
        hash: txHash,
        type: "Coin Flip Play",
        status: "success",
        gasUsed: "21000",
        blockNumber: latestBlock + 1,
        details: `${displayAddress ? displayAddress.slice(0, 6) + "..." + displayAddress.slice(-4) : "Guest"} played Coin Flip and earned ${totalEarned} XP (${won ? "guessed right!" : "better luck next flip!"})`
      });

      if (won) {
        playSound("win");
        confetti({ particleCount: 60, spread: 60, colors: ["#D97706", "#F59E0B"] });
        setGameOutcome({
          status: "win",
          message: `Landed on ${finalOutcome.toUpperCase()}. You guessed right!`,
          xpEarned: totalEarned
        });
      } else {
        playSound("lose");
        setGameOutcome({
          status: "lose",
          message: `Landed on ${finalOutcome.toUpperCase()}. Better luck next flip!`,
          xpEarned: totalEarned
        });
      }
    }, 1500);
  };

  // 2. DICE ROLL PLAY (Guesses 1-6, rolls two dice, wins if both land on prediction - 1/36 chance)
  const playDiceRoll = async () => {
    const txHash = await startArcadeTransaction("Dice Roll Play", 0.001);
    if (!txHash) return;

    let rollInterval = setInterval(() => {
      setDiceResult([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]);
      playSound("dice");
    }, 90);

    setTimeout(() => {
      clearInterval(rollInterval);
      setGamePlaying(false);

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDiceResult([d1, d2]);

      // Double match required for 1/36 win condition
      const won = d1 === dicePrediction && d2 === dicePrediction;
      const baseXP = 15;
      const winXP = won ? 135 : 0;
      const totalEarned = baseXP + winXP;

      addXp(totalEarned);
      completeQuest("play_game");
      incrementDailyChallenge("daily_play_game");
      incrementDailyChallenge("daily_complete_5");

      addTransaction({
        hash: txHash,
        type: "Dice Roll Play",
        status: "success",
        gasUsed: "21000",
        blockNumber: latestBlock + 1,
        details: `${displayAddress ? displayAddress.slice(0, 6) + "..." + displayAddress.slice(-4) : "Guest"} ${won ? "rolled double on Dice Roll and won +150 XP" : "rolled Dice Roll and earned 15 XP (Base)"}`
      });

      if (won) {
        playSound("win");
        confetti({ particleCount: 80, spread: 70, colors: ["#10B981", "#34D399"] });
        setGameOutcome({
          status: "win",
          message: `Double matches! Rolled [${d1}, ${d2}] matching your prediction of ${dicePrediction}!`,
          xpEarned: totalEarned
        });
      } else {
        playSound("lose");
        setGameOutcome({
          status: "lose",
          message: `Rolled [${d1}, ${d2}]. Need double ${dicePrediction} to win jackpot. You still earn base XP!`,
          xpEarned: totalEarned
        });
      }
    }, 1500);
  };

  // 3. CRYPTO SLOTS PLAY
  const buyCredits = async (amount: number, kiiCost: number) => {
    playSound("click");
    setTxPending(true);
    setErrorText(null);

    try {
      const res = await sendGasFeeTransaction(`Buy ${amount} Slots Credits`, kiiCost);
      if (res.success) {
        playSound("win");
        updateCredits(amount);
        confetti({ particleCount: 30, spread: 40 });
      } else {
        setErrorText(res.error || "Credit transaction was rejected.");
      }
    } catch (e: any) {
      setErrorText(e.message || "An unexpected error occurred.");
    } finally {
      setTxPending(false);
    }
  };

  const playSlotsSpin = async () => {
    const txHash = await startArcadeTransaction("Crypto Slots Spin", 0.001);
    if (!txHash) return;

    setGamePlaying(true);
    setGameOutcome({ status: "idle", message: "", xpEarned: 0 });

    let spinInterval = setInterval(() => {
      setSlotsResult([
        slotLogos[Math.floor(Math.random() * 4)],
        slotLogos[Math.floor(Math.random() * 4)],
        slotLogos[Math.floor(Math.random() * 4)],
        slotLogos[Math.floor(Math.random() * 4)]
      ]);
      playSound("spin");
    }, 90);

    setTimeout(() => {
      clearInterval(spinInterval);
      setGamePlaying(false);

      const r1 = slotLogos[Math.floor(Math.random() * 4)];
      const r2 = slotLogos[Math.floor(Math.random() * 4)];
      const r3 = slotLogos[Math.floor(Math.random() * 4)];
      const r4 = slotLogos[Math.floor(Math.random() * 4)];
      setSlotsResult([r1, r2, r3, r4]);

      // Match frequencies
      const counts: Record<string, number> = {};
      [r1, r2, r3, r4].forEach(val => { counts[val] = (counts[val] || 0) + 1; });
      const maxMatch = Math.max(...Object.values(counts));

      let winXP = 0;
      let status: "win" | "lose" | "combo" = "lose";
      let msg = "";
      let detailSuffix = "spun the Slots and earned 15 XP (Base)";

      if (maxMatch === 4) {
        winXP = 185;
        status = "combo";
        msg = "QUADRUPLE MATCH COMBO! Perfect matching reels (+185 XP)!";
        detailSuffix = "spun the Slots and hit the COMBO! (+200 XP)";
        unlockAchievement("kii_gamer_badge");
      } else if (maxMatch === 3) {
        winXP = 85;
        status = "win";
        msg = "Triple match combo! Excellent spin! (+85 XP)";
        detailSuffix = "spun the Slots and earned +100 XP";
      } else if (maxMatch === 2) {
        winXP = 30;
        status = "win";
        msg = "Double match! Nice spin! (+30 XP)";
        detailSuffix = "spun the Slots and earned +45 XP";
      } else {
        winXP = 0;
        status = "lose";
        msg = "No matches. Give the reels another pull!";
      }

      const baseXP = 15;
      const totalEarned = baseXP + winXP;

      addXp(totalEarned);
      completeQuest("play_game");
      incrementDailyChallenge("daily_play_game");
      incrementDailyChallenge("daily_complete_5");

      addTransaction({
        hash: txHash,
        type: "Crypto Slots Spin",
        status: "success",
        gasUsed: "21000",
        blockNumber: latestBlock + 1,
        details: `${displayAddress ? displayAddress.slice(0, 6) + "..." + displayAddress.slice(-4) : "Guest"} ${detailSuffix}`
      });

      if (status !== "lose") {
        playSound("win");
        confetti({ particleCount: 75, spread: 70, colors: ["#F43F5E", "#E11D48", "#FDA4AF"] });
      } else {
        playSound("lose");
      }

      setGameOutcome({
        status,
        message: msg,
        xpEarned: totalEarned
      });
    }, 1800);
  };

  // 4. LUCKY NUMBER PLAY
  const playLuckyNumber = async () => {
    const txHash = await startArcadeTransaction("Lucky Number Guess", 0.001);
    if (!txHash) return;

    let animInterval = setInterval(() => {
      setLuckyResult(Math.floor(Math.random() * 10) + 1);
      playSound("spin");
    }, 90);

    setTimeout(() => {
      clearInterval(animInterval);
      setGamePlaying(false);

      const val = Math.floor(Math.random() * 10) + 1;
      setLuckyResult(val);

      const won = val === luckyPrediction;
      const baseXP = 15;
      const winXP = won ? 105 : 0;
      const totalEarned = baseXP + winXP;

      addXp(totalEarned);
      completeQuest("play_game");
      incrementDailyChallenge("daily_play_game");
      incrementDailyChallenge("daily_complete_5");

      addTransaction({
        hash: txHash,
        type: "Lucky Number Guess",
        status: "success",
        gasUsed: "21000",
        blockNumber: latestBlock + 1,
        details: `${displayAddress ? displayAddress.slice(0, 6) + "..." + displayAddress.slice(-4) : "Guest"} ${won ? "guessed the Lucky Number and won +120 XP" : "guessed the Lucky Number and earned 15 XP (Base)"}`
      });

      if (won) {
        playSound("win");
        confetti({ particleCount: 70, spread: 60, colors: ["#A78BFA", "#8B5CF6", "#7C3AED"] });
        setGameOutcome({
          status: "win",
          message: `Perfect prediction! Landing on lucky number ${val}!`,
          xpEarned: totalEarned
        });
      } else {
        playSound("lose");
        setGameOutcome({
          status: "lose",
          message: `Landed on wheel number ${val}. Better luck next spin!`,
          xpEarned: totalEarned
        });
      }
    }, 1500);
  };

  const handleShareOnX = (gameName: string, detail: string) => {
    playSound("click");
    const tweetText = `Just played ${gameName} on Kii Arcade and ${detail}! Participate in KiiChain testnet tasks and build XP on Kii Builder Hub. @KiiChain #KiiChain #Web3`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(window.location.origin)}`;
    window.open(shareUrl, "_blank");
  };

  return (
    <div className="space-y-8 select-none relative pb-16">
      
      {/* Sound Shake Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(-2px, -2px) rotate(-5deg); }
          30% { transform: translate(2px, 0px) rotate(5deg); }
          45% { transform: translate(-2px, 1px) rotate(-2deg); }
          60% { transform: translate(2px, -1px) rotate(2deg); }
        }
        .animate-shake {
          animation: shake 0.25s infinite linear;
        }
        @keyframes coin-flip-3d {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(1440deg); }
        }
        .coin-spin-active {
          animation: coin-flip-3d 1.5s cubic-bezier(0.15, 0.85, 0.35, 1) forwards;
        }
      `}} />

      {/* Main Header / Top Nav */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">KiiChain Game Arcade</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                Complete daily interactions, say greetings, and play developer arcade games. All actions execute Kii gas transactions.
              </p>
            </div>
          </div>
        </div>

        {/* Arcade Balance Banner Card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/30 p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 dark:bg-cyan-500/5 blur-3xl pointer-events-none" />
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest font-mono">Arcade Balance</span>
            <span className="text-2xl font-black text-cyan-500 dark:text-cyan-400 font-mono tracking-tight">
              {balance && Number(balance) > 0 ? `${Number(balance).toFixed(4)} KII` : "35.0004 KII"}
            </span>
          </div>
        </div>
      </div>

      {errorText && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-300 text-xs flex items-center gap-3 animate-pulse">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <span className="font-bold">Transaction Failed:</span> {errorText}
          </div>
        </div>
      )}

      {/* GM & GN BOARD (Visible when no game is active) */}
      {activeGame === null && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800/40 pb-2">
            <MessageSquare className="w-5 h-5 text-emerald-500 dark:text-emerald-400 glow-blue" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              GM & GN
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* GM GREET CARD */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-zinc-400 dark:hover:border-zinc-700 group">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/5 blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg flex-shrink-0">
                  🌞
                </div>
                <div className="space-y-1">
                  <h3 className="text-md font-bold text-zinc-900 dark:text-white tracking-wide">GM</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal font-medium">Send a GM message and earn XP</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800/60">
                <span className="text-[10px] font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase">
                  10 XP
                </span>

                {greetedGM ? (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold font-mono bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{gmCountdown}</span>
                  </div>
                ) : (
                  <button
                    disabled={greetingLoading !== null}
                    onClick={() => handleGreeting("gm")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow ${
                      greetingLoading === "gm"
                        ? "bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 cursor-wait"
                        : "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white border-amber-400/20"
                    }`}
                  >
                    {greetingLoading === "gm" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        Greet GM
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* GN GREET CARD */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-zinc-400 dark:hover:border-zinc-700 group">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-500/5 blur-3xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-lg flex-shrink-0">
                  🌙
                </div>
                <div className="space-y-1">
                  <h3 className="text-md font-bold text-zinc-900 dark:text-white tracking-wide">GN</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal font-medium">Send a GN message and earn XP</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800/60">
                <span className="text-[10px] font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase">
                  10 XP
                </span>

                {greetedGN ? (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold font-mono bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{gnCountdown}</span>
                  </div>
                ) : (
                  <button
                    disabled={greetingLoading !== null}
                    onClick={() => handleGreeting("gn")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow ${
                      greetingLoading === "gn"
                        ? "bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 cursor-wait"
                        : "bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 text-white border-violet-400/20"
                    }`}
                  >
                    {greetingLoading === "gn" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        Greet GN
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* GAMING SECTION: GRID MENU OR SINGLE ACTIVE GAME BOARD */}
      <section className="space-y-4 pt-4">
        {activeGame === null ? (
          <>
            <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800/40 pb-2">
              <Gamepad2 className="w-5 h-5 text-violet-500 dark:text-violet-400 glow-purple" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                GAMING
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Coin Flip */}
              <div 
                onClick={() => { playSound("click"); setActiveGame("coin"); }}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-zinc-400 dark:hover:border-zinc-700"
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-amber-500/5 dark:bg-amber-500/5 blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl">
                    🟡
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">Coin Flip</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal font-medium">Flip a coin and earn XP</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800/60 mt-6 font-mono text-[9px] font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    5 XP
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    +15 XP (Win)
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                    Gas Fee
                  </span>
                </div>
              </div>

              {/* Card 2: Dice Roll */}
              <div 
                onClick={() => { playSound("click"); setActiveGame("dice"); }}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-zinc-400 dark:hover:border-zinc-700"
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/5 dark:bg-emerald-500/5 blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">
                    🎲
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Dice Roll</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal font-medium">Roll dice and earn XP</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800/60 mt-6 font-mono text-[9px] font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    5 XP
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    +45 XP (Win)
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                    Gas Fee
                  </span>
                </div>
              </div>

              {/* Card 3: Crypto Slots */}
              <div 
                onClick={() => { playSound("click"); setActiveGame("slots"); }}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-zinc-400 dark:hover:border-zinc-700"
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-rose-500/5 dark:bg-rose-500/5 blur-2xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xl">
                    🎰
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">Crypto Slots</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal font-medium">Spin the reels and win ...</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800/60 mt-6 font-mono text-[9px] font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    5 XP
                  </span>
                  <span className="text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                    +60 XP (Combo)
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                    Gas Fee
                  </span>
                </div>
              </div>

              {/* Card 4: Lucky Number */}
              <div 
                onClick={() => { playSound("click"); setActiveGame("number"); }}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 flex flex-col justify-between min-h-[220px] relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-zinc-400 dark:hover:border-zinc-700"
              >
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 dark:bg-violet-500/5 blur-2xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xl">
                    🎯
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors">Lucky Number</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal font-medium">Guess 1-10 and earn XP</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800/60 mt-6 font-mono text-[9px] font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    5 XP
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                    +30 XP (Win)
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                    Gas Fee
                  </span>
                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
            
            {/* Back Button */}
            <button
              onClick={() => { playSound("click"); setActiveGame(null); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-brand-border text-zinc-400 hover:text-white transition-all text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Arcade Lobby
            </button>

            {/* SCREEN 1: COIN FLIP (Image 1 Mock) */}
            {activeGame === "coin" && (
              <div className="max-w-md mx-auto space-y-6 flex flex-col items-center">
                
                {/* Header Badge */}
                <div className="px-5 py-2 rounded-full bg-zinc-950 border border-amber-500/20 text-xs font-extrabold font-mono text-amber-400 tracking-wider flex items-center gap-2 shadow-lg">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">🟡</span>
                  COIN FLIP
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-brand-border text-[9px] text-zinc-500 font-semibold uppercase tracking-normal">50/50</span>
                </div>

                {/* Sub Stats */}
                <div className="flex gap-4 text-xs font-bold text-zinc-400">
                  <span className="flex items-center gap-1">⭐ 5 XP</span>
                  <span className="text-amber-500 flex items-center gap-1">↗️ +15 Win</span>
                </div>

                {/* Main Selection Area */}
                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                  {/* HEADS Selection */}
                  <div
                    onClick={() => { playSound("click"); setCoinPrediction("heads"); }}
                    className={`relative rounded-2xl p-6 border flex flex-col items-center justify-center gap-3 cursor-pointer select-none transition-all duration-300 min-h-[150px] ${
                      coinPrediction === "heads"
                        ? "border-amber-500 bg-amber-500/5 glow-blue shadow-lg"
                        : "border-brand-border bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    {coinPrediction === "heads" && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                    <div className="w-16 h-16 flex items-center justify-center">
                      <HeadsIcon />
                    </div>
                    <span className={`text-xs font-black tracking-widest ${coinPrediction === "heads" ? "text-amber-500" : "text-zinc-500"}`}>HEADS</span>
                  </div>

                  {/* TAILS Selection */}
                  <div
                    onClick={() => { playSound("click"); setCoinPrediction("tails"); }}
                    className={`relative rounded-2xl p-6 border flex flex-col items-center justify-center gap-3 cursor-pointer select-none transition-all duration-300 min-h-[150px] ${
                      coinPrediction === "tails"
                        ? "border-amber-500 bg-amber-500/5 glow-blue shadow-lg"
                        : "border-brand-border bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    {coinPrediction === "tails" && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                    <div className="w-16 h-16 flex items-center justify-center">
                      <TailsIcon />
                    </div>
                    <span className={`text-xs font-black tracking-widest ${coinPrediction === "tails" ? "text-amber-500" : "text-zinc-500"}`}>TAILS</span>
                  </div>
                </div>

                {/* Flip Button */}
                <div className="w-full relative">
                  {txPending ? (
                    <div className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-zinc-950 border border-brand-border text-white text-xs font-bold">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      Authorizing Gas Fee...
                    </div>
                  ) : gamePlaying ? (
                    <div className="w-full flex flex-col items-center justify-center gap-3 py-6 px-6 rounded-xl bg-zinc-950 border border-amber-500/20 text-white text-xs font-bold relative">
                      <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-500 flex items-center justify-center text-md font-black animate-spin bg-amber-500/10">
                        {coinResult?.toUpperCase() || "?"}
                      </div>
                      Flipping coin...
                    </div>
                  ) : (
                    <button
                      onClick={playCoinFlip}
                      className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm tracking-wider uppercase transition-all shadow-lg border border-amber-400/20 flex items-center justify-center gap-2"
                    >
                      <RotateCw className="w-4 h-4 animate-pulse" />
                      FLIP {coinPrediction.toUpperCase()}
                    </button>
                  )}
                </div>

                {/* Dynamic Outcome Message */}
                {gameOutcome.status !== "idle" && (
                  <div className={`p-4 rounded-xl border w-full text-center space-y-3 animate-[fadeIn_0.3s_ease-out] ${
                    gameOutcome.status === "win"
                      ? "border-kii-emerald/20 bg-kii-emerald/[0.02] text-kii-emerald"
                      : "border-zinc-800 bg-zinc-900/30 text-zinc-400"
                  }`}>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest">{gameOutcome.status === "win" ? "Winner!" : "Tough Luck"}</h4>
                    <p className="text-xs">{gameOutcome.message}</p>
                    <div className="text-xs font-bold font-mono text-white">XP Claimed: +{gameOutcome.xpEarned} XP</div>
                  </div>
                )}

                {/* Share Button */}
                <button
                  onClick={() => handleShareOnX("Coin Flip", gameOutcome.status === "win" ? "won +15 XP" : "earned 5 XP")}
                  className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share on X
                </button>

                {/* HOW TO PLAY CARDS */}
                <div className="w-full border border-brand-border/40 bg-zinc-950/20 p-5 rounded-2xl space-y-4">
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest block border-b border-brand-border pb-1">How to play</span>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-sans text-zinc-400">
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>🟡</span> Pick a side
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>🎯</span> 50% chance
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>⚡</span> 5 XP base
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>🏆</span> +15 XP win
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SCREEN 2: DICE ROLL (Image 2 Mock) */}
            {activeGame === "dice" && (
              <div className="max-w-md mx-auto space-y-6 flex flex-col items-center">
                
                {/* Header Badge */}
                <div className="px-5 py-2 rounded-full bg-zinc-950 border border-kii-emerald/20 text-xs font-extrabold font-mono text-kii-emerald tracking-wider flex items-center gap-2 shadow-lg">
                  <span className="w-4 h-4 rounded-full bg-kii-emerald/20 flex items-center justify-center text-[10px]">🎲</span>
                  DICE ROLL
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-brand-border text-[9px] text-zinc-500 font-semibold uppercase tracking-normal">1/36</span>
                </div>

                {/* Sub Stats */}
                <div className="flex gap-4 text-xs font-bold text-zinc-400">
                  <span className="flex items-center gap-1">⭐ 5 XP</span>
                  <span className="text-kii-emerald flex items-center gap-1">↗️ +45 Win</span>
                </div>

                {/* Selection Heading */}
                <span className="text-xs font-black text-white tracking-widest uppercase mt-2">Pick your number</span>

                {/* Number Grid 1-6 */}
                <div className="grid grid-cols-3 gap-3 w-full">
                  {[1, 2, 3, 4, 5, 6].map(num => {
                    const pipSymbol = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][num - 1];
                    const isSelected = dicePrediction === num;
                    return (
                      <div
                        key={num}
                        onClick={() => { playSound("click"); setDicePrediction(num); }}
                        className={`rounded-2xl p-4 border flex flex-col items-center justify-center gap-2 cursor-pointer select-none transition-all min-h-[90px] ${
                          isSelected
                            ? "border-kii-emerald bg-kii-emerald/5 glow-blue shadow"
                            : "border-brand-border bg-white/[0.01] hover:bg-white/[0.03]"
                        }`}
                      >
                        <span className={`text-xl ${isSelected ? "text-kii-emerald" : "text-zinc-500"}`}>{pipSymbol}</span>
                        <span className={`text-xs font-black font-mono ${isSelected ? "text-kii-emerald" : "text-zinc-400"}`}>{num}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Roll Button */}
                <div className="w-full relative pt-2">
                  {txPending ? (
                    <div className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-zinc-950 border border-brand-border text-white text-xs font-bold">
                      <Loader2 className="w-4 h-4 animate-spin text-kii-emerald" />
                      Authorizing Gas Fee...
                    </div>
                  ) : gamePlaying ? (
                    <div className="w-full flex items-center justify-center gap-6 py-4 px-6 rounded-xl bg-zinc-950 border border-kii-emerald/20 text-white text-xs font-bold relative">
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-md font-bold animate-shake">
                        {diceResult[0]}
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-md font-bold animate-shake">
                        {diceResult[1]}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={playDiceRoll}
                      className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-kii-emerald to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-sm tracking-wider uppercase transition-all shadow-lg border border-emerald-400/20 flex items-center justify-center gap-2"
                    >
                      <RotateCw className="w-4 h-4" />
                      ROLL FOR {dicePrediction}
                    </button>
                  )}
                </div>

                {/* Outcome Display */}
                {gameOutcome.status !== "idle" && (
                  <div className={`p-4 rounded-xl border w-full text-center space-y-3 animate-[fadeIn_0.3s_ease-out] ${
                    gameOutcome.status === "win"
                      ? "border-kii-emerald/20 bg-kii-emerald/[0.02] text-kii-emerald"
                      : "border-zinc-800 bg-zinc-900/30 text-zinc-400"
                  }`}>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest">{gameOutcome.status === "win" ? "Win!" : "Played"}</h4>
                    <p className="text-xs">{gameOutcome.message}</p>
                    <div className="text-xs font-bold font-mono text-white">XP Claimed: +{gameOutcome.xpEarned} XP</div>
                  </div>
                )}

                {/* Share Button */}
                <button
                  onClick={() => handleShareOnX("Dice Roll", gameOutcome.status === "win" ? `rolled double ${dicePrediction} and won +45 XP` : "earned 5 XP")}
                  className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share on X
                </button>

                {/* HOW TO PLAY CARDS */}
                <div className="w-full border border-brand-border/40 bg-zinc-950/20 p-5 rounded-2xl space-y-4">
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest block border-b border-brand-border pb-1">How to play</span>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-sans text-zinc-400">
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>🎲</span> Pick 1-6
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>🎯</span> 1/36 chance
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>⚡</span> 5 XP base
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>🏆</span> +45 XP win
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SCREEN 3: CRYPTO SLOTS (Image 3 Mock) */}
            {activeGame === "slots" && (
              <div className="max-w-lg mx-auto space-y-6">
                
                {/* Custom Title Card */}
                <div className="flex items-center justify-between border border-brand-border bg-zinc-950/40 p-4 rounded-2xl shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-none">Crypto Slots</h3>
                      <span className="text-[10px] text-zinc-500 font-medium mt-1 block">Match symbols, win XP</span>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-lg bg-zinc-950 border border-brand-border text-xs font-bold text-kii-blue flex items-center gap-1.5 font-mono">
                    <span>⚡</span>
                    <span>Gas fee only</span>
                  </div>
                </div>

                {/* Reel Cabinet */}
                <div className="border border-brand-border bg-zinc-950/20 p-6 rounded-2xl space-y-5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center block">REELS</span>
                  
                  {/* The Reels Layout */}
                  <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-950 border border-brand-border shadow-inner">
                    {slotsResult.map((sym, idx) => (
                      <div
                        key={idx}
                        className={`w-full aspect-square rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center shadow-inner ${
                          gamePlaying ? "animate-shake" : "scale-105 transition-transform"
                        }`}
                      >
                        {sym === "eth" && <EthereumLogo />}
                        {sym === "btc" && <BitcoinLogo />}
                        {sym === "usdc" && <USDCLogo />}
                        {sym === "usdt" && <TetherLogo />}
                      </div>
                    ))}
                  </div>

                  {/* Spin Actions */}
                  <div className="w-full pt-2">
                    {gamePlaying ? (
                      <div className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-zinc-950 border border-brand-border text-white text-xs font-bold">
                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        Reels Spinning...
                      </div>
                    ) : (
                      <button
                        onClick={playSlotsSpin}
                        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-sm tracking-wider uppercase transition-all shadow-lg border border-rose-500/20 text-center block"
                      >
                        SPIN REELS
                      </button>
                    )}
                  </div>
                </div>

                {/* Outcome Panel */}
                {gameOutcome.status !== "idle" && (
                  <div className={`p-4 rounded-xl border w-full text-center space-y-3 animate-[fadeIn_0.3s_ease-out] ${
                    gameOutcome.status === "win" || gameOutcome.status === "combo"
                      ? "border-kii-emerald/20 bg-kii-emerald/[0.02] text-kii-emerald"
                      : "border-zinc-800 bg-zinc-900/30 text-zinc-400"
                  }`}>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest">
                      {gameOutcome.status === "combo" ? "JACKPOT COMBO!" : gameOutcome.status === "win" ? "Win!" : "Played"}
                    </h4>
                    <p className="text-xs">{gameOutcome.message}</p>
                    <div className="text-xs font-bold font-mono text-white">XP Claimed: +{gameOutcome.xpEarned} XP</div>
                  </div>
                )}

                {/* Share Button */}
                <button
                  onClick={() => handleShareOnX("Crypto Slots", gameOutcome.status === "combo" ? "hit the QUADRUPLE matching slots jackpot (+60 XP)!" : "earned XP spinning the slots")}
                  className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share on X
                </button>

                {/* HOW TO PLAY CARDS */}
                <div className="w-full border border-brand-border/40 bg-zinc-950/20 p-5 rounded-2xl space-y-4">
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest block border-b border-brand-border pb-1">How to play</span>
                  <div className="text-[11px] font-sans text-zinc-400 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 font-bold">⭐</span> Spin costs gas fee only
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-kii-blue font-bold">▶️</span> Charged as gas-only transaction
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-kii-emerald font-bold">📈</span> 2+ matching symbols = bonus XP
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-kii-purple-light font-bold">⚡</span> 4 same = COMBO! +60 XP
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-bold">✓</span> 5 XP base per spin
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SCREEN 4: LUCKY NUMBER (Image 4 Mock) */}
            {activeGame === "number" && (
              <div className="max-w-md mx-auto space-y-6 flex flex-col items-center">
                
                {/* Header Badge */}
                <div className="px-5 py-2 rounded-full bg-zinc-950 border border-kii-purple/20 text-xs font-extrabold font-mono text-kii-purple-light tracking-wider flex items-center gap-2 shadow-lg">
                  <span className="w-4 h-4 rounded-full bg-kii-purple/25 flex items-center justify-center text-[10px]">🍀</span>
                  LUCKY NUMBER
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-brand-border text-[9px] text-zinc-500 font-semibold uppercase tracking-normal">10%</span>
                </div>

                {/* Sub Stats */}
                <div className="flex gap-4 text-xs font-bold text-zinc-400">
                  <span className="flex items-center gap-1">⭐ 5 XP</span>
                  <span className="text-kii-purple-light flex items-center gap-1">↗️ +30 Win</span>
                </div>

                {/* Selection Heading */}
                <span className="text-xs font-black text-white tracking-widest uppercase mt-2">Pick your lucky number</span>

                {/* Number Grid 1-10 */}
                <div className="grid grid-cols-5 gap-2 w-full">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => {
                    const isSelected = luckyPrediction === num;
                    return (
                      <div
                        key={num}
                        onClick={() => { playSound("click"); setLuckyPrediction(num); }}
                        className={`relative rounded-xl p-3.5 border flex flex-col items-center justify-center cursor-pointer select-none transition-all min-h-[55px] ${
                          isSelected
                            ? "border-kii-purple bg-kii-purple/5 glow-purple shadow"
                            : "border-brand-border bg-white/[0.01] hover:bg-white/[0.03]"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-kii-purple-light" />
                        )}
                        <span className={`text-xs font-extrabold font-mono ${isSelected ? "text-kii-purple-light" : "text-zinc-400"}`}>{num}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Guess Button */}
                <div className="w-full relative pt-2">
                  {txPending ? (
                    <div className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-zinc-950 border border-brand-border text-white text-xs font-bold">
                      <Loader2 className="w-4 h-4 animate-spin text-kii-purple" />
                      Authorizing Gas Fee...
                    </div>
                  ) : gamePlaying ? (
                    <div className="w-full flex flex-col items-center justify-center gap-2 py-6 px-6 rounded-xl bg-zinc-950 border border-kii-purple/20 text-white text-xs font-bold">
                      <div className="w-10 h-10 rounded-full border border-dashed border-kii-purple-light flex items-center justify-center text-xs animate-spin font-mono">
                        {luckyResult !== null ? luckyResult : "?"}
                      </div>
                      Spinning Wheel...
                    </div>
                  ) : (
                    <button
                      onClick={playLuckyNumber}
                      className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-kii-purple to-kii-purple-hover hover:opacity-95 text-white font-extrabold text-sm tracking-wider uppercase transition-all shadow-lg border border-kii-purple/20 flex items-center justify-center gap-2"
                    >
                      <RotateCw className="w-4 h-4 animate-pulse" />
                      GUESS {luckyPrediction}
                    </button>
                  )}
                </div>

                {/* Outcome Display */}
                {gameOutcome.status !== "idle" && (
                  <div className={`p-4 rounded-xl border w-full text-center space-y-3 animate-[fadeIn_0.3s_ease-out] ${
                    gameOutcome.status === "win"
                      ? "border-kii-emerald/20 bg-kii-emerald/[0.02] text-kii-emerald"
                      : "border-zinc-800 bg-zinc-900/30 text-zinc-400"
                  }`}>
                    <h4 className="text-xs font-extrabold uppercase tracking-widest">{gameOutcome.status === "win" ? "Win!" : "Played"}</h4>
                    <p className="text-xs">{gameOutcome.message}</p>
                    <div className="text-xs font-bold font-mono text-white">XP Claimed: +{gameOutcome.xpEarned} XP</div>
                  </div>
                )}

                {/* Share Button */}
                <button
                  onClick={() => handleShareOnX("Lucky Number", gameOutcome.status === "win" ? `guessed the wheel number ${luckyPrediction} and won +30 XP` : "earned 5 XP")}
                  className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share on X
                </button>

                {/* HOW TO PLAY CARDS */}
                <div className="w-full border border-brand-border/40 bg-zinc-950/20 p-5 rounded-2xl space-y-4">
                  <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest block border-b border-brand-border pb-1">How to play</span>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-sans text-zinc-400">
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>🍀</span> Pick 1-10
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>🎯</span> 10% chance
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>⚡</span> 5 XP base
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900/50 border border-brand-border flex items-center gap-2">
                      <span>🏆</span> +30 XP win
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </section>

    </div>
  );
}
