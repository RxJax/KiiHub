"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useWallet, WalletType, isEvmWallet } from "@/contexts/WalletContext";
import { useQuests } from "@/contexts/QuestContext";
import { POOL_REGISTRY } from "@/contexts/contracts";
import { ethers } from "ethers";
import kiiGovernanceStakingAbi from "@/abis/KiiGovernanceStaking.json";
import stakedKiiTokenAbi from "@/abis/StakedKiiToken.json";

const sanitizeAddress = (address: string | null | undefined): string => {
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
import { 
  ArrowLeftRight, 
  Coins, 
  Settings, 
  HelpCircle, 
  TrendingUp, 
  Layers, 
  Clock, 
  Activity, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  Info,
  Maximize2,
  TrendingDown,
  Zap,
  ArrowRight,
  TrendingUp as TrendUpIcon,
  ShieldCheck,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface SwapTx {
  hash: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  timestamp: number;
  status: "success" | "pending" | "failed";
}

const TOKEN_INFO: Record<string, { symbol: string; name: string; logo: string; isStable: boolean }> = {
  KII: { symbol: "KII", name: "Kii Native Gas", logo: "/Kii.jpg", isStable: false },
  USDC: { symbol: "USDC", name: "USD Coin", logo: "/usd-coin-usdc-logo.png", isStable: true },
  USDT: { symbol: "USDT", name: "Tether USD", logo: "/tether-usdt-logo.png", isStable: true },
  wBTC: { symbol: "wBTC", name: "Wrapped Bitcoin", logo: "/bitcoin-btc-logo.png", isStable: false },
  MXN: { symbol: "MXN", name: "Mexican Peso (Stable)", logo: "🇲🇽", isStable: true },
  BRL: { symbol: "BRL", name: "Brazilian Real (Stable)", logo: "🇧🇷", isStable: true },
  COP: { symbol: "COP", name: "Colombian Peso (Stable)", logo: "🇨🇴", isStable: true },
  sKII: { symbol: "sKII", name: "Staked Kii Token", logo: "/sKII.jpg", isStable: false },
};

// Rates relative to KII (simulated exchange rates)
const RATES_TO_KII: Record<string, number> = {
  KII: 1.0,
  USDC: 2.45,
  USDT: 2.44,
  wBTC: 0.0000377,
  MXN: 41.65,
  BRL: 12.25,
  COP: 9550.0,
  sKII: 1.0,
};

export default function KiiSwapDEX() {
  const { isConnected, displayAddress, transactions, balance, stablecoinBalances, executeSwapTransaction, mintTestToken, fundPoolReserves, fetchBalance, walletType, globalSwaps, isLoadingSwaps, addTransaction, latestBlock, globalActivities } = useWallet();
  const { trackSwapAction, triggerXpConfetti, totalXp } = useQuests();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddTokenToWallet = async (symbol: string) => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      showToast("MetaMask is not installed.", "error");
      return;
    }
    const tokenInfo = POOL_REGISTRY[symbol];
    if (!tokenInfo) {
      showToast("Token info not found.", "error");
      return;
    }

    try {
      const wasAdded = await (window as any).ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenInfo.tokenAddress,
            symbol: symbol,
            decimals: 18,
            image: window.location.origin + (symbol === "USDC" ? "/usd-coin-usdc-logo.png" : symbol === "USDT" ? "/tether-usdt-logo.png" : "/bitcoin-btc-logo.png"),
          },
        },
      });

      if (wasAdded) {
        showToast(`${symbol} added to MetaMask!`, "success");
      } else {
        showToast(`Failed to add ${symbol} to MetaMask.`, "error");
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Error adding token to wallet", "error");
    }
  };

  const [isMinting, setIsMinting] = useState<Record<string, boolean>>({});
  const [isFunding, setIsFunding] = useState<Record<string, boolean>>({});

  const handleMintToken = async (symbol: string) => {
    setIsMinting((prev) => ({ ...prev, [symbol]: true }));
    try {
      showToast(`Minting test ${symbol} tokens...`, "info");
      const res = await mintTestToken(symbol);
      if (res.success) {
        showToast(`Minted test ${symbol} successfully! Balance updated.`, "success");
        if (displayAddress && fetchBalance) {
          fetchBalance(displayAddress, walletType).catch(console.error);
        }
      } else {
        throw new Error(res.error || "Minting failed");
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to mint tokens.", "error");
    } finally {
      setIsMinting((prev) => ({ ...prev, [symbol]: false }));
    }
  };

  const handleFundPool = async (symbol: string) => {
    setIsFunding((prev) => ({ ...prev, [symbol]: true }));
    try {
      showToast(`Funding on-chain swap pool for ${symbol}...`, "info");
      const res = await fundPoolReserves(symbol);
      if (res.success) {
        showToast(`Pool reserves funded with test ${symbol} successfully!`, "success");
        if (displayAddress && fetchBalance) {
          fetchBalance(displayAddress, walletType).catch(console.error);
        }
      } else {
        throw new Error(res.error || "Funding failed");
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to fund swap pool reserves.", "error");
    } finally {
      setIsFunding((prev) => ({ ...prev, [symbol]: false }));
    }
  };
  
  const handleStake = async () => {
    if (!isConnected || !displayAddress) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    if (!govAmount || isNaN(Number(govAmount)) || Number(govAmount) <= 0) {
      showToast("Please enter a valid amount to stake.", "error");
      return;
    }

    setIsGovLoading(true);
    showToast("Initiating stake transaction...", "info");

    const inputAmount = Number(govAmount);

    try {
      const isEvm = isEvmWallet(walletType);
      const hasEthereum = typeof window !== "undefined" && (window as any).ethereum;

      if (isEvm && hasEthereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        
        const stakingAddress = "0x234FAE5cc64b81826452A28BE0eb6aC530044C01";
        const stakingContract = new ethers.Contract(stakingAddress, kiiGovernanceStakingAbi, signer);

        const parsedAmount = ethers.parseEther(govAmount);

        // Execute stake() with KII value passed in raw Wei (18 decimals) inside value property
        const tx = await stakingContract.stake({
          value: parsedAmount
        });

        showToast("Staking transaction submitted. Waiting for confirmation...", "info");
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          showToast("Staking successful!", "success");
          
          addTransaction({
            hash: tx.hash,
            type: "Stake KII",
            status: "success",
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: Number(receipt.blockNumber),
            details: `Staked ${govAmount} KII for sKII`
          });

          setGovAmount("");
          
          // Refresh balance in context
          if (fetchBalance) {
            await fetchBalance(displayAddress, walletType);
          }

          // Refresh total staked balance
          fetchTotalStakedKii();
        } else {
          throw new Error("Transaction reverted on chain.");
        }
      } else {
        // Simulated / Cosmos path
        const currentAddress = displayAddress.toLowerCase();
        const balanceKey = `kii_balance_${currentAddress}`;
        const currentBal = Number(localStorage.getItem(balanceKey) || balance || "10.00");
        
        if (inputAmount > currentBal) {
          showToast(`Insufficient KII balance. You have ${balance} KII but tried to stake ${govAmount} KII.`, "error");
          setIsGovLoading(false);
          return;
        }

        // Deduct KII
        const nextBal = Math.max(0, currentBal - inputAmount - 0.002);
        localStorage.setItem(balanceKey, nextBal.toFixed(4));
        
        // Add sKII
        const stableKey = `kii_stable_balances_${currentAddress}`;
        const cachedStable = localStorage.getItem(stableKey);
        let updatedStable: Record<string, string> = { USDC: "0.0000", USDT: "0.0000", wBTC: "0.00000000", sKII: "0.0000" };
        if (cachedStable) {
          try { updatedStable = JSON.parse(cachedStable); } catch(e) {}
        }
        updatedStable.sKII = (Number(updatedStable.sKII || "0") + inputAmount).toFixed(4);
        localStorage.setItem(stableKey, JSON.stringify(updatedStable));

        // Trigger react state update
        if (fetchBalance) {
          await fetchBalance(displayAddress, walletType);
        }

        const mockHash = "0x_stake_sim_" + Math.random().toString(36).substring(2, 14);
        addTransaction({
          hash: mockHash,
          type: "Stake KII (Simulated)",
          status: "success",
          gasUsed: "45000",
          blockNumber: latestBlock + 1,
          details: `Staked ${govAmount} KII for sKII (Simulated)`
        });

        showToast("Staking successful (Simulated)!", "success");
        setGovAmount("");
        fetchTotalStakedKii();
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.reason || e.message || "Failed to execute staking.", "error");
    } finally {
      setIsGovLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!isConnected || !displayAddress) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    if (!govAmount || isNaN(Number(govAmount)) || Number(govAmount) <= 0) {
      showToast("Please enter a valid amount to unstake.", "error");
      return;
    }

    setIsGovLoading(true);
    showToast("Step 1/2: Approving sKII token...", "info");

    const inputAmount = Number(govAmount);

    try {
      const isEvm = isEvmWallet(walletType);
      const hasEthereum = typeof window !== "undefined" && (window as any).ethereum;

      if (isEvm && hasEthereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();

        const stakingAddress = "0x234FAE5cc64b81826452A28BE0eb6aC530044C01";
        const skiiAddress = "0xc150f249A847b28f579fdA1984e81a494b9E262F";

        const tokenContract = new ethers.Contract(skiiAddress, stakedKiiTokenAbi, signer);
        const stakingContract = new ethers.Contract(stakingAddress, kiiGovernanceStakingAbi, signer);

        const parsedAmount = ethers.parseEther(govAmount);

        // STEP 1: Approve
        const approveTx = await tokenContract.approve(stakingAddress, parsedAmount);
        showToast("Approval transaction submitted. Waiting for confirmation...", "info");
        const approveReceipt = await approveTx.wait();

        if (approveReceipt.status !== 1) {
          throw new Error("Token approval failed.");
        }

        // STEP 2: Unstake Execution
        showToast("Step 2/2: Executing Unstake...", "info");
        const unstakeTx = await stakingContract.unstake(parsedAmount, {
          value: 0
        });

        showToast("Unstaking transaction submitted. Waiting for confirmation...", "info");
        const unstakeReceipt = await unstakeTx.wait();

        if (unstakeReceipt.status === 1) {
          showToast("Unstaking successful!", "success");

          addTransaction({
            hash: unstakeTx.hash,
            type: "Unstake KII",
            status: "success",
            gasUsed: unstakeReceipt.gasUsed.toString(),
            blockNumber: Number(unstakeReceipt.blockNumber),
            details: `Unstaked ${govAmount} sKII for KII`
          });

          setGovAmount("");

          // Refresh balance in context
          if (fetchBalance) {
            await fetchBalance(displayAddress, walletType);
          }

          // Refresh total staked balance
          fetchTotalStakedKii();
        } else {
          throw new Error("Unstaking transaction reverted.");
        }
      } else {
        // Simulated / Cosmos path
        const currentAddress = displayAddress.toLowerCase();
        
        const stableKey = `kii_stable_balances_${currentAddress}`;
        const cachedStable = localStorage.getItem(stableKey);
        let updatedStable: Record<string, string> = { USDC: "0.0000", USDT: "0.0000", wBTC: "0.00000000", sKII: "0.0000" };
        if (cachedStable) {
          try { updatedStable = JSON.parse(cachedStable); } catch(e) {}
        }
        
        const currentSKii = Number(updatedStable.sKII || "0");
        if (inputAmount > currentSKii) {
          showToast(`Insufficient sKII balance. You have ${currentSKii.toFixed(4)} sKII but tried to unstake ${govAmount} sKII.`, "error");
          setIsGovLoading(false);
          return;
        }

        // Deduct sKII
        updatedStable.sKII = Math.max(0, currentSKii - inputAmount).toFixed(4);
        localStorage.setItem(stableKey, JSON.stringify(updatedStable));

        // Add KII
        const balanceKey = `kii_balance_${currentAddress}`;
        const currentBal = Number(localStorage.getItem(balanceKey) || balance || "10.00");
        const nextBal = currentBal + inputAmount - 0.002;
        localStorage.setItem(balanceKey, nextBal.toFixed(4));
        
        if (fetchBalance) {
          await fetchBalance(displayAddress, walletType);
        }

        const mockHash = "0x_unstake_sim_" + Math.random().toString(36).substring(2, 14);
        addTransaction({
          hash: mockHash,
          type: "Unstake KII (Simulated)",
          status: "success",
          gasUsed: "55000",
          blockNumber: latestBlock + 1,
          details: `Unstaked ${govAmount} sKII for KII (Simulated)`
        });

        showToast("Unstaking successful (Simulated)!", "success");
        setGovAmount("");
        fetchTotalStakedKii();
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.reason || e.message || "Failed to execute unstaking.", "error");
    } finally {
      setIsGovLoading(false);
    }
  };

  // App tabs & modes
  const [activeTab, setActiveTab] = useState<"terminal" | "compare" | "pools" | "governance">("terminal");
  const [proMode, setProMode] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<number>(0.5);
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [govAmount, setGovAmount] = useState<string>("");
  const [isGovLoading, setIsGovLoading] = useState<boolean>(false);
  const [totalStakedKii, setTotalStakedKii] = useState<string>("4,821,900");

  const fetchTotalStakedKii = async () => {
    try {
      const rpcUrl = "https://json-rpc.dos.sentry.testnet.v3.kiivalidator.com/";
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const stakingAddress = "0x234FAE5cc64b81826452A28BE0eb6aC530044C01";
      const balanceWei = await provider.getBalance(stakingAddress);
      const balanceEth = ethers.formatEther(balanceWei);
      const formatted = Number(balanceEth).toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      });
      setTotalStakedKii(formatted);
    } catch (err) {
      console.warn("Failed to fetch total staked KII:", err);
    }
  };

  useEffect(() => {
    fetchTotalStakedKii();
    const interval = setInterval(fetchTotalStakedKii, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPool = localStorage.getItem("kii_swap_pool_address");
      if (savedPool) {
        setPoolAddress(savedPool);
      }
    }
  }, []);

  // Swap State
  const [fromToken, setFromToken] = useState<string>("KII");
  const [toToken, setToToken] = useState<string>("USDT");
  const [fromAmount, setFromAmount] = useState<string>("10");
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapStep, setSwapStep] = useState<string>("");

  // Toast state for warnings and notifications
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false,
    message: "",
    type: "info"
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Token selector dropdown state
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);

  // Recipient Address States
  const [isCustomRecipient, setIsCustomRecipient] = useState<boolean>(false);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [recipientValidation, setRecipientValidation] = useState<{
    isValid: boolean;
    type: "EVM" | "Cosmos" | null;
    message: string;
  }>({ isValid: false, type: null, message: "" });

  useEffect(() => {
    if (!recipientAddress) {
      setRecipientValidation({ isValid: false, type: null, message: "" });
      return;
    }
    const trimmed = recipientAddress.trim();
    if (trimmed.startsWith("0x")) {
      const isValidEvm = /^0x[a-fA-F0-9]{40}$/.test(trimmed);
      setRecipientValidation({
        isValid: isValidEvm,
        type: "EVM",
        message: isValidEvm ? "Valid Kiichain EVM address format" : "Must be a 42-character hexadecimal EVM address"
      });
    } else if (trimmed.startsWith("kii")) {
      const isValidCosmos = /^kii1[a-zA-Z0-9]{38,45}$/.test(trimmed);
      setRecipientValidation({
        isValid: isValidCosmos,
        type: "Cosmos",
        message: isValidCosmos ? "Valid Kiichain Cosmos address format" : "Must be a valid bech32 address starting with kii1"
      });
    } else {
      setRecipientValidation({
        isValid: false,
        type: null,
        message: "Address must start with '0x' or 'kii'"
      });
    }
  }, [recipientAddress]);

  // Unique deployed contracts extracted from user history
  const uniqueDeployedContracts = Array.from(
    new Map(
      transactions
        .filter((tx) => tx.type.toLowerCase().includes("deploy") && tx.status === "success" && tx.details)
        .map((tx) => {
          const addressMatch = tx.details?.match(/0x[a-fA-F0-9]{40}/i);
          return {
            name: tx.type.replace("Deploy ", ""),
            address: addressMatch ? addressMatch[0] : null
          };
        })
        .filter((c) => c.address !== null)
        .map((c) => [c.address, c])
    ).values()
  ) as { name: string; address: string }[];

  // FX Comparison States
  const [compareAmount, setCompareAmount] = useState<string>("1000");
  const [compareFrom, setCompareFrom] = useState<string>("USDC");
  const [compareTo, setCompareTo] = useState<string>("BRL");

  // Chart & Order Book mock states
  const [priceData, setPriceData] = useState<number[]>([1.44, 1.45, 1.43, 1.46, 1.48, 1.47, 1.49, 1.52, 1.51, 1.53]);
  const [orderBook, setOrderBook] = useState<{ price: number; amount: number; type: "buy" | "sell" }[]>([]);
  const [kiiPrice, setKiiPrice] = useState<number>(2.45);
  const [change24h, setChange24h] = useState<number>(3.82);

  // Initialize data
  useEffect(() => {
    // Generate initial order book
    const list = [];
    for (let i = 0; i < 5; i++) {
      list.push({ price: 2.45 + (i + 1) * 0.002, amount: Math.floor(Math.random() * 800) + 100, type: "sell" as const });
    }
    for (let i = 0; i < 5; i++) {
      list.push({ price: 2.45 - (i + 1) * 0.002, amount: Math.floor(Math.random() * 900) + 150, type: "buy" as const });
    }
    setOrderBook(list.sort((a, b) => b.price - a.price));

    // Order book initialized

    // Chart jitter simulation
    const interval = setInterval(() => {
      // Jitter price
      setKiiPrice((prev) => {
        const delta = (Math.random() - 0.5) * 0.01;
        const next = Math.max(0.1, prev + delta);
        
        // Add to chart data
        setPriceData((chart) => {
          const updated = [...chart.slice(1), Number((next / RATES_TO_KII[toToken]).toFixed(3))];
          return updated;
        });

        return Number(next.toFixed(3));
      });

      // Update order book prices slightly
      setOrderBook((book) => {
        return book.map((item) => {
          const delta = (Math.random() - 0.5) * 0.002;
          return {
            ...item,
            amount: Math.max(10, Math.floor(item.amount + (Math.random() - 0.5) * 50)),
            price: Number((item.price + delta).toFixed(4))
          };
        }).sort((a, b) => b.price - a.price);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [displayAddress, toToken]);

  // Compute conversion estimate
  const rateFrom = RATES_TO_KII[fromToken] || 1;
  const rateTo = RATES_TO_KII[toToken] || 1;
  const exchangeRate = rateTo / rateFrom;
  const expectedOutput = Number(fromAmount) ? Number(fromAmount) * exchangeRate : 0;

  // Execute Swap Simulation with premium stages
  const handleSwap = async () => {
    const inputVal = Number(fromAmount);
    if (!inputVal || inputVal <= 0) return;

    // Validate balance before proceeding
    if (fromToken === "KII") {
      const userBalance = Number(balance);
      if (inputVal > userBalance) {
        showToast(`Insufficient KII balance. You have ${balance} KII but tried to swap ${fromAmount} KII.`, "error");
        return;
      }
    } else {
      const tokenBalance = Number(stablecoinBalances[fromToken] || "0");
      if (inputVal > tokenBalance) {
        showToast(`Insufficient ${fromToken} balance. You have ${stablecoinBalances[fromToken] || "0.0000"} ${fromToken} but tried to swap ${fromAmount} ${fromToken}.`, "error");
        return;
      }
    }

    if (isCustomRecipient && !recipientValidation.isValid) {
      showToast("Please enter a valid Kiichain address (starts with '0x' or 'kii').", "error");
      return;
    }

    setIsSwapping(true);
    
    const steps = [
      "Finding Liquidity Pools...",
      "Optimizing Routing Pathways...",
      "Locking Conversion Rates...",
      isCustomRecipient 
        ? `Bridging Assets to Destination ${recipientValidation.type === "EVM" ? "EVM Address" : "Cosmos Address"}...`
        : "Executing Cross-Border Swap...",
      "Confirming Final Settlement..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setSwapStep(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Finalize Swap
    try {
      const targetAddress = isCustomRecipient ? recipientAddress.trim() : poolAddress;
      // Execute the real/simulated swap transaction deducting and adding balances
      const res = await executeSwapTransaction(fromToken, toToken, inputVal, expectedOutput, targetAddress);
      if (!res.success) {
        throw new Error(res.error || "Swap failed");
      }

      // Trigger Quest System Update
      trackSwapAction(fromToken, toToken, inputVal);
      triggerXpConfetti(50);
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#6366F1", "#10B981", "#F59E0B"]
      });

      // Clear input and custom recipient address if checked
      setFromAmount("");
      if (isCustomRecipient) {
        setRecipientAddress("");
      }

      showToast(`Swap settled successfully! Swapped ${inputVal} ${fromToken} for ${toToken === "wBTC" ? expectedOutput.toFixed(8) : expectedOutput.toFixed(4)} ${toToken}.`, "success");

      // Explicitly trigger balance fetch immediately after swap confirmation
      if (displayAddress && fetchBalance) {
        fetchBalance(displayAddress, walletType).catch((err) => {
          console.warn("Failed to fetch balance immediately on confirmation:", err);
        });
        
        // Secondary safety poll after block propagation
        setTimeout(() => {
          if (displayAddress && fetchBalance) {
            fetchBalance(displayAddress, walletType).catch(console.error);
          }
        }, 2000);
        setTimeout(() => {
          if (displayAddress && fetchBalance) {
            fetchBalance(displayAddress, walletType).catch(console.error);
          }
        }, 5000);
      }

    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Swap execution failed.", "error");
    } finally {
      setIsSwapping(false);
      setSwapStep("");
    }
  };

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  // Direct Transfer States
  const [transferAsset, setTransferAsset] = useState<string>("KII");
  const [transferRecipient, setTransferRecipient] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [showTransferAssetDropdown, setShowTransferAssetDropdown] = useState<boolean>(false);

  const handleDirectTransfer = async () => {
    if (!isConnected || !displayAddress) {
      showToast("Please connect your wallet first.", "error");
      return;
    }

    const recipient = transferRecipient.trim();
    if (!recipient) {
      showToast("Please enter a recipient address.", "error");
      return;
    }

    const amount = Number(transferAmount);
    if (!amount || amount <= 0) {
      showToast("Please enter a valid amount to transfer.", "error");
      return;
    }

    setIsTransferring(true);
    showToast(`Initiating transfer of ${transferAmount} ${transferAsset}...`, "info");

    try {
      const isEvm = isEvmWallet(walletType);
      const hasEthereum = typeof window !== "undefined" && (window as any).ethereum;

      if (isEvm && hasEthereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        
        if (transferAsset === "KII") {
          // ROUTE A: Standard eth_sendTransaction
          const parsedAmount = ethers.parseEther(transferAmount);
          const hexValue = "0x" + parsedAmount.toString(16);
          
          showToast("Sending native KII transaction...", "info");
          const txHash = await (window as any).ethereum.request({
            method: "eth_sendTransaction",
            params: [
              {
                from: displayAddress,
                to: recipient,
                value: hexValue,
              },
            ],
          });

          showToast("Direct transfer submitted. Waiting for confirmation...", "info");
          
          // Wait for transaction receipt
          let receipt = null;
          while (!receipt) {
            await new Promise((r) => setTimeout(r, 1000));
            try {
              receipt = await provider.getTransactionReceipt(txHash);
            } catch (err) {}
          }

          if (receipt && receipt.status === 1) {
            showToast(`Direct transfer of ${transferAmount} KII successful!`, "success");
            addTransaction({
              hash: txHash,
              type: "Direct Transfer KII",
              status: "success",
              gasUsed: receipt.gasUsed.toString(),
              blockNumber: Number(receipt.blockNumber),
              details: `Transferred ${transferAmount} KII to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`
            });
            setTransferAmount("");
            setTransferRecipient("");
          } else {
            throw new Error("Transaction reverted on-chain.");
          }
        } else {
          // ROUTE B: ERC-20 transfer
          const tokenInfo = POOL_REGISTRY[transferAsset];
          if (!tokenInfo) {
            throw new Error(`Token configuration for ${transferAsset} not found.`);
          }

          const tokenAddress = tokenInfo.tokenAddress;
          const signer = await provider.getSigner();
          
          const testTokenAbi = [
            {
              "inputs": [
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "amount", "type": "uint256" }
              ],
              "name": "transfer",
              "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ];

          const tokenContract = new ethers.Contract(tokenAddress, testTokenAbi, signer);
          const parsedAmount = ethers.parseUnits(transferAmount, 18);

          showToast(`Sending ${transferAsset} token transfer...`, "info");
          const tx = await tokenContract.transfer(recipient, parsedAmount, {
            value: 0
          });

          showToast("Direct token transfer submitted. Waiting for confirmation...", "info");
          const receipt = await tx.wait();

          if (receipt && receipt.status === 1) {
            showToast(`Direct transfer of ${transferAmount} ${transferAsset} successful!`, "success");
            addTransaction({
              hash: tx.hash,
              type: `Direct Transfer ${transferAsset}`,
              status: "success",
              gasUsed: receipt.gasUsed.toString(),
              blockNumber: Number(receipt.blockNumber),
              details: `Transferred ${transferAmount} ${transferAsset} to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`
            });
            setTransferAmount("");
            setTransferRecipient("");
          } else {
            throw new Error("Transaction reverted on-chain.");
          }
        }
        
        // Refresh balance dynamically via balance update hooks
        if (fetchBalance) {
          await fetchBalance(displayAddress, walletType);
        }
      } else {
        // Simulated / Cosmos Wallet path
        const currentAddress = displayAddress.toLowerCase();
        
        if (transferAsset === "KII") {
          const balanceKey = `kii_balance_${currentAddress}`;
          const currentBal = Number(localStorage.getItem(balanceKey) || balance || "10.00");
          if (amount > currentBal) {
            showToast(`Insufficient KII balance. You have ${balance} KII but tried to transfer ${transferAmount} KII.`, "error");
            setIsTransferring(false);
            return;
          }
          const nextBal = Math.max(0, currentBal - amount - 0.002);
          localStorage.setItem(balanceKey, nextBal.toFixed(4));
        } else {
          const stableKey = `kii_stable_balances_${currentAddress}`;
          const cachedStable = localStorage.getItem(stableKey);
          let updatedStable: Record<string, string> = { USDC: "0.0000", USDT: "0.0000", wBTC: "0.00000000", sKII: "0.0000" };
          if (cachedStable) {
            try { updatedStable = JSON.parse(cachedStable); } catch(e) {}
          }
          const currentTokenBal = Number(updatedStable[transferAsset] || "0");
          if (amount > currentTokenBal) {
            showToast(`Insufficient ${transferAsset} balance. You have ${currentTokenBal} ${transferAsset} but tried to transfer ${transferAmount} ${transferAsset}.`, "error");
            setIsTransferring(false);
            return;
          }
          updatedStable[transferAsset] = Math.max(0, currentTokenBal - amount).toFixed(transferAsset === "wBTC" ? 8 : 4);
          localStorage.setItem(stableKey, JSON.stringify(updatedStable));
        }

        // Trigger balance refresh in context
        if (fetchBalance) {
          await fetchBalance(displayAddress, walletType);
        }

        const mockHash = "0x_transfer_sim_" + Math.random().toString(36).substring(2, 14);
        addTransaction({
          hash: mockHash,
          type: `Direct Transfer ${transferAsset} (Simulated)`,
          status: "success",
          gasUsed: "21000",
          blockNumber: latestBlock + 1,
          details: `Transferred ${transferAmount} ${transferAsset} to ${recipient.slice(0, 6)}...${recipient.slice(-4)} (Simulated)`
        });

        showToast(`Direct transfer of ${transferAmount} ${transferAsset} successful (Simulated)!`, "success");
        setTransferAmount("");
        setTransferRecipient("");
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.reason || e.message || "Direct transfer failed.", "error");
    } finally {
      setIsTransferring(false);
    }
  };

  const settlementItems = useMemo(() => {
    const swaps = globalSwaps.map(s => ({
      hash: s.hash,
      timestamp: s.timestamp,
      details: `${s.fromAmount.toLocaleString(undefined, { minimumFractionDigits: s.fromToken === "wBTC" ? 8 : 2, maximumFractionDigits: s.fromToken === "wBTC" ? 8 : 4 })} ${s.fromToken} → ${s.toAmount.toLocaleString(undefined, { minimumFractionDigits: s.toToken === "wBTC" ? 8 : 2, maximumFractionDigits: s.toToken === "wBTC" ? 8 : 4 })} ${s.toToken}`,
      isSwap: true,
      fromAmount: s.fromAmount,
      fromToken: s.fromToken,
      toAmount: s.toAmount,
      toToken: s.toToken
    }));

    const transfers = globalActivities
      .filter(act => {
        const isTransfer = act.type === "Direct Transfer" || 
                           act.type === "Transaction" ||
                           act.type.toLowerCase().includes("transfer");
        if (!isTransfer) return false;
        return displayAddress && act.userAddress.toLowerCase() === displayAddress.toLowerCase();
      })
      .map(t => ({
        hash: t.hash,
        timestamp: t.timestamp,
        details: t.details,
        isSwap: false,
        fromAmount: 0,
        fromToken: "",
        toAmount: 0,
        toToken: ""
      }));

    const merged = [...swaps, ...transfers];
    const map = new Map<string, typeof merged[0]>();
    merged.forEach(item => map.set(item.hash.toLowerCase(), item));
    return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [globalSwaps, globalActivities]);

  const recentSwapSettlementsCard = (
    <section className="glass-panel p-5 rounded-xl border border-brand-border space-y-4">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-kii-blue" />
        Recent Swap & Transfer Settlements
      </h3>

      {isLoadingSwaps && settlementItems.length === 0 ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3.5 rounded-lg border border-brand-border/60 bg-zinc-950/10">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-zinc-800/60" />
                <div className="space-y-2">
                  <div className="h-3 w-36 bg-zinc-800/60 rounded" />
                  <div className="h-2.5 w-16 bg-zinc-900/60 rounded" />
                </div>
              </div>
              <div className="h-3 w-20 bg-zinc-800/60 rounded" />
            </div>
          ))}
        </div>
      ) : settlementItems.length > 0 ? (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {settlementItems.map((tx) => (
            <div key={tx.hash} className="p-3.5 rounded-lg border border-brand-border bg-zinc-950/20 flex justify-between items-center text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-sm">{tx.isSwap ? "💱" : "💸"}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {tx.details}
                    </span>
                    <span className="text-[8px] font-bold text-kii-emerald px-1 bg-kii-emerald/10 border border-kii-emerald/20 rounded uppercase">
                      SETTLED
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              <a
                href={`https://explorer.kiichain.io/tx/${tx.hash}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-kii-blue hover:underline flex items-center gap-0.5"
              >
                Hash: {tx.hash.slice(0, 8)}...
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-zinc-600 text-xs font-medium">
          No swap or transfer transactions recorded on-chain yet. Execute a swap or transfer to see settlements.
        </div>
      )}
    </section>
  );

  const directTransfersCard = (
    <section className="glass-panel p-5 rounded-xl border border-brand-border space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5 text-kii-purple-light" />
          Direct Transfer Engine
        </span>
      </div>

      {/* Asset Dropdown */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Select Asset</label>
        <div className="relative">
          <button
            onClick={() => setShowTransferAssetDropdown(!showTransferAssetDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-950 border border-brand-border text-xs text-white font-bold hover:border-zinc-700 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <img src={TOKEN_INFO[transferAsset]?.logo} className="w-4 h-4 rounded-full" alt="" />
              {transferAsset}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>
          {showTransferAssetDropdown && (
            <div className="absolute left-0 mt-1 w-full rounded-xl bg-zinc-950/95 border border-brand-border shadow-2xl z-50 p-1 space-y-0.5 backdrop-blur-md">
              {["KII", "USDT", "USDC", "wBTC"].map((symbol) => {
                const info = TOKEN_INFO[symbol];
                return (
                  <button
                    key={symbol}
                    onClick={() => {
                      setTransferAsset(symbol);
                      setShowTransferAssetDropdown(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-white/[0.04] flex items-center justify-between gap-1 text-xs text-zinc-300 font-semibold"
                  >
                    <span className="flex items-center gap-1.5">
                      <img src={info.logo} className="w-3.5 h-3.5 rounded-full" alt="" />
                      {symbol}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recipient Input */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Recipient Address</label>
        <input
          type="text"
          value={transferRecipient}
          onChange={(e) => setTransferRecipient(e.target.value)}
          placeholder="Enter recipient wallet address (0x...)"
          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-brand-border text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
        />
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Amount to Transfer</label>
        <input
          type="number"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-brand-border text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
        />
      </div>

      {/* Action Button */}
      <button
        onClick={handleDirectTransfer}
        disabled={isTransferring || !transferRecipient.trim() || !transferAmount || Number(transferAmount) <= 0}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-kii-purple to-kii-blue hover:opacity-95 text-white font-bold text-xs tracking-wider uppercase transition-opacity shadow-lg shadow-kii-purple/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isTransferring ? "Executing Transfer..." : "EXECUTE TRANSFER"}
      </button>
    </section>
  );

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kii-blue"></div>
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider font-mono">Loading KiiSwap DEX...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/40 pb-4 lg:pr-[380px]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-kii-blue/20 flex items-center justify-center border border-kii-blue/30">
              <ArrowLeftRight className="w-3.5 h-3.5 text-kii-blue" />
            </div>
            <h1 className="text-2xl font-black text-white">KiiSwap DEX Terminal</h1>
            <span className="text-[9px] font-extrabold text-kii-purple-light uppercase tracking-wider bg-kii-purple/10 px-2 py-0.5 rounded border border-kii-purple/20">
              FX Infrastructure v1.0
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Experience onchain FX and stablecoin swaps directly on KiiChain Testnet.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Pro Trader Mode toggle */}
          <div className="flex items-center gap-2.5 bg-zinc-950/60 p-2 rounded-lg border border-brand-border">
            <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
              Pro Trader Layout
            </span>
            <button
              onClick={() => setProMode(!proMode)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors relative ${
                proMode ? "bg-kii-purple" : "bg-zinc-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                  proMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Slippage Settings Shortcut */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg bg-zinc-950/60 border border-brand-border text-zinc-500 hover:text-white transition-colors"
            title="Slippage configuration"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CORE MENU TABS */}
      <div className="flex border-b border-brand-border gap-4">
        <button
          onClick={() => setActiveTab("terminal")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "terminal" 
              ? "border-kii-purple-light text-white" 
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          KiiSwap Terminal
        </button>
        <button
          onClick={() => setActiveTab("governance")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "governance" 
              ? "border-kii-purple-light text-white" 
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Governance
        </button>
        <button
          onClick={() => setActiveTab("compare")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "compare" 
              ? "border-kii-purple-light text-white" 
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Compare FX Rates
        </button>
        <button
          onClick={() => setActiveTab("pools")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === "pools" 
              ? "border-kii-purple-light text-white" 
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Liquidity Pools
        </button>
      </div>

      {/* 1. KIISWAP TERMINAL TAB */}
      {activeTab === "terminal" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT AREA: Price chart and Order flow (only in Pro mode) */}
          {proMode && (
            <div className="lg:col-span-8 space-y-6">
              
              {/* Live Price Header */}
              <div className="glass-panel p-5 rounded-xl border border-brand-border grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Active Pair</span>
                  <span className="text-sm font-black text-white font-mono flex items-center gap-1">
                    {fromToken} / {toToken}
                  </span>
                </div>
                
                <div className="space-y-1 pl-4 border-l border-brand-border/40">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">Oracle Price</span>
                  <span className="text-sm font-black text-kii-teal font-mono">
                    ${(kiiPrice / RATES_TO_KII[toToken]).toFixed(4)}
                  </span>
                </div>

                <div className="space-y-1 pl-4 border-l border-brand-border/40">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">24h Shift</span>
                  <span className="text-sm font-black text-emerald-400 font-mono flex items-center gap-0.5">
                    <TrendUpIcon className="w-3.5 h-3.5" />
                    +{change24h}%
                  </span>
                </div>

                <div className="space-y-1 pl-4 border-l border-brand-border/40">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">DEX Liquidity</span>
                  <span className="text-sm font-black text-white font-mono">$1,850,225</span>
                </div>
              </div>

              {/* Glowing Line Price Chart */}
              <div className="glass-panel p-6 rounded-xl border border-brand-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-kii-teal" />
                    Rate Chart feed
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono">Real-time Conversion</span>
                </div>

                {/* Simulated Chart lines visual */}
                <div className="h-48 w-full bg-zinc-950/30 rounded-lg border border-brand-border/40 relative flex items-end overflow-hidden pt-6">
                  {/* Glowing Price Graph lines SVG */}
                  <svg className="w-full h-full absolute inset-0 overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Grid Lines */}
                    <line x1="0" y1="40" x2="1000" y2="40" stroke="#ffffff" strokeOpacity="0.02" strokeWidth="1" />
                    <line x1="0" y1="80" x2="1000" y2="80" stroke="#ffffff" strokeOpacity="0.02" strokeWidth="1" />
                    <line x1="0" y1="120" x2="1000" y2="120" stroke="#ffffff" strokeOpacity="0.02" strokeWidth="1" />
                    
                    {/* The glowing price line */}
                    <path
                      d={`M ${priceData.map((val, idx) => {
                        const x = (idx / (priceData.length - 1)) * 600;
                        const min = Math.min(...priceData);
                        const max = Math.max(...priceData);
                        const y = 140 - ((val - min) / (max - min || 1)) * 90;
                        return `${x} ${y}`;
                      }).join(" L ")}`}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      className="transition-all duration-500"
                    />

                    {/* Gradient Fill under path */}
                    <path
                      d={`M 0 200 L ${priceData.map((val, idx) => {
                        const x = (idx / (priceData.length - 1)) * 600;
                        const min = Math.min(...priceData);
                        const max = Math.max(...priceData);
                        const y = 140 - ((val - min) / (max - min || 1)) * 90;
                        return `${x} ${y}`;
                      }).join(" L ")} L 600 200 Z`}
                      fill="url(#chartGradient)"
                    />
                  </svg>
                  
                  {/* Grid labels */}
                  <div className="absolute top-2 left-2 text-[9px] font-mono text-zinc-500">Rate Limit: Max</div>
                  <div className="absolute bottom-2 left-2 text-[9px] font-mono text-zinc-500">Rate Limit: Min</div>
                </div>
              </div>

              {/* Order Book & Recent Trade analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Order Book */}
                <div className="glass-panel p-5 rounded-xl border border-brand-border space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Liquidity Order Book
                  </h3>
                  
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="grid grid-cols-3 text-zinc-500 font-semibold border-b border-brand-border/40 pb-2">
                      <span>Rate ({toToken})</span>
                      <span className="text-right">Volume ({fromToken})</span>
                      <span className="text-right">Total (USD)</span>
                    </div>

                    {/* Sells (Red) */}
                    <div className="space-y-1">
                      {orderBook.filter(o => o.type === "sell").slice(0, 3).map((order, idx) => (
                        <div key={`sell-${idx}`} className="grid grid-cols-3 text-rose-400 hover:bg-rose-500/5 py-0.5 rounded transition-colors">
                          <span className="font-bold">{order.price.toFixed(4)}</span>
                          <span className="text-right text-zinc-400">{order.amount.toLocaleString()}</span>
                          <span className="text-right text-zinc-500">${(order.price * order.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      ))}
                    </div>

                    {/* Spread indicator */}
                    <div className="py-1 border-y border-brand-border/20 text-center text-[10px] text-zinc-500 font-bold bg-white/[0.01]">
                      Spread: 0.0020 {toToken}
                    </div>

                    {/* Buys (Green) */}
                    <div className="space-y-1">
                      {orderBook.filter(o => o.type === "buy").slice(0, 3).map((order, idx) => (
                        <div key={`buy-${idx}`} className="grid grid-cols-3 text-emerald-400 hover:bg-emerald-500/5 py-0.5 rounded transition-colors">
                          <span className="font-bold">{order.price.toFixed(4)}</span>
                          <span className="text-right text-zinc-400">{order.amount.toLocaleString()}</span>
                          <span className="text-right text-zinc-500">${(order.price * order.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Market Depth Graph */}
                <div className="glass-panel p-5 rounded-xl border border-brand-border flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                      DEX Depth Analysis
                    </h3>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Shows the distribution of locked liquidity pools depth on KiiChain. Stablepools maintain ultra-low slippage depths.
                    </p>
                  </div>

                  {/* Simulated Depth charts visual */}
                  <div className="h-32 w-full bg-zinc-950/20 border border-brand-border/40 rounded-lg relative flex items-end overflow-hidden mt-4">
                    {/* Sells Depth (Red area right) */}
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-rose-500/5 border-l border-rose-500/20 flex items-end justify-end">
                      <div className="h-2/3 w-full bg-rose-500/10 clip-depth-sell" />
                    </div>

                    {/* Buys Depth (Green area left) */}
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-emerald-500/5 border-r border-emerald-500/20 flex items-end">
                      <div className="h-4/5 w-full bg-emerald-500/10 clip-depth-buy" />
                    </div>

                    <div className="absolute inset-x-0 bottom-2 text-center text-[9px] font-mono text-zinc-400">
                      Mid Price: {kiiPrice}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* RIGHT AREA: Swap card and Pools visualization */}
          <div className={`${proMode ? "lg:col-span-4" : "lg:col-span-6"} space-y-6`}>
            
            {/* SWAP INTERFACE CARD */}
            <div className="glass-panel p-5 rounded-xl border border-brand-border space-y-5 relative">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-kii-blue" />
                  Conversion Engine
                </span>
                
                {/* Slippage Display */}
                <button 
                  onClick={() => setShowSettings(true)}
                  className="text-[10px] font-bold text-kii-blue bg-kii-blue/10 px-2 py-0.5 rounded border border-kii-blue/20 hover:opacity-80 transition-opacity"
                >
                  Slippage: {slippage}%
                </button>
              </div>

              {/* Liquidity Pool Warning/Status Alert */}
              {poolAddress && (
                <div className="p-3 rounded-lg border border-brand-border bg-white/[0.01] space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-kii-blue tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-kii-blue" />
                    Active Deployed Pool Swaps
                  </div>
                  <p className="text-[9px] text-zinc-400 leading-normal truncate">
                    Routing swaps directly to: <code className="text-white font-mono bg-zinc-900 px-1 rounded select-all">{poolAddress}</code>
                  </p>
                </div>
              )}

              {/* INPUT BOX: Pay */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-brand-border space-y-2 relative">
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase">
                  <span>You Pay</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => {
                        const maxVal = fromToken === "KII" ? balance : (stablecoinBalances[fromToken] || "0.0000");
                        setFromAmount(maxVal);
                      }}
                      className="hover:text-white transition-colors cursor-pointer"
                      title="Set maximum balance"
                    >
                      Balance: {fromToken === "KII" ? `${balance} KII` : `${stablecoinBalances[fromToken] || "0.0000"} ${fromToken}`}
                    </button>
                    {fromToken !== "KII" && walletType === "metamask" && (
                      <button
                        onClick={() => handleAddTokenToWallet(fromToken)}
                        className="text-kii-blue hover:text-white transition-colors font-bold text-[9px] cursor-pointer"
                        title="Add Token to Wallet"
                      >
                        (Add Token to Wallet)
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    disabled={isSwapping}
                    placeholder="0.0"
                    className="bg-transparent border-0 font-mono text-lg font-black text-white focus:outline-none w-full"
                  />
                  
                  {/* From Token Select Button */}
                  <div className="relative">
                    {fromToken === "KII" ? (
                      <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-brand-border flex items-center gap-1.5 select-none opacity-85">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          <img src={TOKEN_INFO[fromToken]?.logo} className="w-4 h-4 rounded-full" alt="" />
                          {fromToken}
                        </span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => !isSwapping && setShowFromDropdown(!showFromDropdown)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-brand-border flex items-center gap-1.5 hover:border-zinc-700 transition-colors"
                        >
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <img src={TOKEN_INFO[fromToken]?.logo} className="w-4 h-4 rounded-full" alt="" />
                            {fromToken}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        </button>
                        
                        {/* Dropdown */}
                        {showFromDropdown && (
                          <div className="absolute right-0 mt-1 w-40 rounded-xl bg-zinc-950/95 border border-brand-border shadow-2xl z-50 p-1 space-y-0.5 max-h-48 overflow-y-auto backdrop-blur-md">
                            {["USDC", "USDT", "wBTC"].map((symbol) => {
                              const info = TOKEN_INFO[symbol];
                              return (
                                <button
                                  key={symbol}
                                  onClick={() => {
                                    setFromToken(symbol);
                                    setShowFromDropdown(false);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded hover:bg-white/[0.04] flex items-center justify-between gap-1 text-[11px] text-zinc-300 font-semibold"
                                >
                                  <span className="flex items-center gap-1">
                                    <img src={info.logo} className="w-3.5 h-3.5 rounded-full" alt="" />
                                    {symbol}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* FLIP TOGGLE BUTTON */}
              <div className="flex justify-center -my-3.5 relative z-10">
                <button
                  onClick={handleSwapTokens}
                  disabled={isSwapping}
                  className="p-2 rounded-full bg-zinc-900 border border-brand-border text-zinc-500 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  <ArrowLeftRight className="w-4 h-4 rotate-90" />
                </button>
              </div>

              {/* INPUT BOX: Receive */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-brand-border space-y-2">
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase">
                  <span>You Receive</span>
                  <div className="flex items-center gap-1.5">
                    <span>
                      Balance: {toToken === "KII" ? `${balance} KII` : `${stablecoinBalances[toToken] || "0.0000"} ${toToken}`}
                    </span>
                    {toToken !== "KII" && walletType === "metamask" && (
                      <button
                        onClick={() => handleAddTokenToWallet(toToken)}
                        className="text-kii-blue hover:text-white transition-colors font-bold text-[9px] cursor-pointer"
                        title="Add Token to Wallet"
                      >
                        (Add Token to Wallet)
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-lg font-black text-zinc-400">
                    {expectedOutput ? (toToken === "wBTC" ? expectedOutput.toFixed(8) : expectedOutput.toFixed(4)) : "0.00"}
                  </div>
                  
                  {/* To Token Select Button */}
                  <div className="relative">
                    {toToken === "KII" ? (
                      <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-brand-border flex items-center gap-1.5 select-none opacity-85">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          <img src={TOKEN_INFO[toToken]?.logo} className="w-4 h-4 rounded-full" alt="" />
                          {toToken}
                        </span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => !isSwapping && setShowToDropdown(!showToDropdown)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-brand-border flex items-center gap-1.5 hover:border-zinc-700 transition-colors"
                        >
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <img src={TOKEN_INFO[toToken]?.logo} className="w-4 h-4 rounded-full" alt="" />
                            {toToken}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        </button>
                        
                        {/* Dropdown */}
                        {showToDropdown && (
                          <div className="absolute right-0 mt-1 w-40 rounded-xl bg-zinc-950/95 border border-brand-border shadow-2xl z-50 p-1 space-y-0.5 max-h-48 overflow-y-auto backdrop-blur-md">
                            {["USDC", "USDT", "wBTC"].map((symbol) => {
                              const info = TOKEN_INFO[symbol];
                              return (
                                <button
                                  key={symbol}
                                  onClick={() => {
                                    setToToken(symbol);
                                    setShowToDropdown(false);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded hover:bg-white/[0.04] flex items-center justify-between gap-1 text-[11px] text-zinc-300 font-semibold"
                                >
                                  <span className="flex items-center gap-1">
                                    <img src={info.logo} className="w-3.5 h-3.5 rounded-full" alt="" />
                                    {symbol}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* RECIPIENT / CUSTOM ADDRESS INTERACTION CONTAINER (Hidden for now) */}

              {/* QUOTE PREVIEW PANEL */}
              {Number(fromAmount) > 0 && (
                <div className="p-3.5 rounded-lg bg-white/[0.01] border border-brand-border/60 text-[11px] space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Route Path</span>
                    <span className="text-white font-bold flex items-center gap-1">
                      {fromToken} <ArrowRight className="w-3 h-3 text-kii-purple" /> {toToken}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Network Gas Fee</span>
                    <span className="text-kii-teal font-bold">$0.01 (~0.002 KII)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Price Impact</span>
                    <span className="text-white font-bold">0.02%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Settlement Time</span>
                    <span className="text-zinc-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-kii-blue" />
                      ~3 Seconds
                    </span>
                  </div>
                </div>
              )}

              {/* TRANSACTION STEP ANIMATION (PREMIUM MOTION) */}
              {isSwapping && (
                <div className="p-4 rounded-xl border border-kii-purple/30 bg-kii-purple/[0.02] space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-kii-purple animate-spin" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Processing FX Route</span>
                  </div>
                  
                  {/* Glowing progress line */}
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-kii-purple to-kii-blue absolute inset-y-0 w-2/3 animate-progress-glow" />
                  </div>
                  
                  <p className="text-[11px] font-mono text-zinc-400 italic">
                    {swapStep}
                  </p>
                </div>
              )}

              {/* SWAP TRIGGER BUTTON */}
              <button
                onClick={handleSwap}
                disabled={isSwapping || !fromAmount || Number(fromAmount) <= 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-kii-purple to-kii-blue hover:opacity-95 text-white font-bold text-xs tracking-wider uppercase transition-opacity shadow-lg shadow-kii-purple/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSwapping ? "Executing Onchain Settlement..." : "Convert Onchain Assets"}
              </button>

            </div>



            {/* LIQUIDITY VISUALIZATION CARD (Hidden for now) */}
            {/*
            <div className="glass-panel p-5 rounded-xl border border-brand-border space-y-5">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-kii-teal" />
                  Liquidity Depth Status
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                  Dynamic pools health metrics backing cross-border settlement rates.
                </p>
              </div>

              <div className="space-y-4">
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-white font-bold">KII Pool Depth</span>
                    <span className="text-zinc-500">920,500 KII Locked</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-950 border border-brand-border/40 overflow-hidden">
                    <div className="h-full bg-kii-purple" style={{ width: "85%" }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>Health: 99.8%</span>
                    <span>Utilization: 64%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-white font-bold">USDC Pool Depth</span>
                    <span className="text-zinc-500">1,245,000 USDC Locked</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-950 border border-brand-border/40 overflow-hidden">
                    <div className="h-full bg-kii-blue" style={{ width: "92%" }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>Health: 100%</span>
                    <span>Utilization: 38%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-white font-bold">USDT Pool Depth</span>
                    <span className="text-zinc-500">850,000 USDT Locked</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-950 border border-brand-border/40 overflow-hidden">
                    <div className="h-full bg-kii-teal" style={{ width: "78%" }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>Health: 99.7%</span>
                    <span>Utilization: 48%</span>
                  </div>
                </div>

              </div>
            </div>
            */}

            {/* PORTFOLIO BALANCE CARD */}
            <div className="glass-panel p-5 rounded-xl border border-brand-border space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-kii-blue" />
                  Your Onchain Balance Portfolio
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                  Dynamic balance updates of stablecoins and native gas assets.
                </p>
              </div>

              <div className="space-y-2.5 font-mono text-[11px]">
                {/* KII Balance */}
                <div className="flex justify-between items-center py-1.5 border-b border-brand-border/40">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <img src="/Kii.jpg" className="w-4 h-4 rounded-full" alt="KII" /> KII
                  </span>
                  <span className="text-kii-blue font-bold">{balance} KII</span>
                </div>
                {/* sKII Balance */}
                <div className="flex justify-between items-center py-1.5 border-b border-brand-border/40">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <img src="/sKII.jpg" className="w-4 h-4 rounded-full" alt="sKII" /> sKII
                  </span>
                  <span className="text-kii-purple-light font-bold">{stablecoinBalances.sKII || "0.0000"} sKII</span>
                </div>
                {/* USDC Balance */}
                <div className="flex justify-between items-center py-1.5 border-b border-brand-border/40">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <img src="/usd-coin-usdc-logo.png" className="w-4 h-4 rounded-full" alt="USDC" /> USDC
                  </span>
                  <span className="text-white font-bold">{stablecoinBalances.USDC || "0.0000"} USDC</span>
                </div>
                {/* USDT Balance */}
                <div className="flex justify-between items-center py-1.5 border-b border-brand-border/40">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <img src="/tether-usdt-logo.png" className="w-4 h-4 rounded-full" alt="USDT" /> USDT
                  </span>
                  <span className="text-white font-bold">{stablecoinBalances.USDT || "0.0000"} USDT</span>
                </div>
                {/* wBTC Balance */}
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <img src="/bitcoin-btc-logo.png" className="w-4 h-4 rounded-full" alt="wBTC" /> wBTC
                  </span>
                  <span className="text-white font-bold">{stablecoinBalances.wBTC || "0.00000000"} wBTC</span>
                </div>
              </div>
            </div>

            {/* In Pro mode, render settlements underneath portfolio card */}
            {proMode && (
              <div className="space-y-6 pt-2">
                {directTransfersCard}
                {recentSwapSettlementsCard}
              </div>
            )}

          </div>

          {/* In non-Pro mode, render settlements on the right-hand column */}
          {!proMode && (
            <div className="lg:col-span-6 space-y-6">
              {directTransfersCard}
              {recentSwapSettlementsCard}
            </div>
          )}

        </div>
      )}

      {/* 2. COMPARE FX RATES TAB */}
      {(activeTab === "compare" || !proMode && activeTab === "terminal") && activeTab === "compare" && (
        <div className="glass-panel p-6 rounded-xl border border-brand-border space-y-6">
          <div className="max-w-xl space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-kii-blue" />
              Onchain FX Simulator
            </h2>
            <p className="text-xs text-zinc-400">
              Compare Traditional Swift Transfer rails side-by-side with KiiChain's stablecoin cross-border settlement infrastructure.
            </p>
          </div>

          {/* Input amount */}
          <div className="flex flex-col sm:flex-row gap-4 items-end max-w-xl pb-4 border-b border-brand-border/40">
            <div className="space-y-2 flex-1 w-full">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Simulator Base Amount</label>
              <input
                type="number"
                value={compareAmount}
                onChange={(e) => setCompareAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-brand-border rounded-lg text-xs text-white font-mono"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">From</label>
                <select
                  value={compareFrom}
                  onChange={(e) => setCompareFrom(e.target.value)}
                  className="bg-zinc-900 border border-brand-border text-zinc-300 text-xs px-3 py-2.5 rounded-lg"
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="KII">KII</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">To</label>
                <select
                  value={compareTo}
                  onChange={(e) => setCompareTo(e.target.value)}
                  className="bg-zinc-900 border border-brand-border text-zinc-300 text-xs px-3 py-2.5 rounded-lg"
                >
                  <option value="BRL">BRL (Brazilian Real)</option>
                  <option value="MXN">MXN (Mexican Peso)</option>
                  <option value="COP">COP (Colombian Peso)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            
            {/* Traditional Bank rails */}
            <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/[0.01] space-y-5 relative">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider block">Traditional Swift Bank</span>
                <span className="text-xs text-zinc-500 font-mono">Traditional Rails</span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-zinc-500">Service Fee:</span>
                  <span className="font-bold text-white">$40.00 USD</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-zinc-500">Processing Delay:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    3 - 5 Business Days
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-zinc-500">Intermediary Spreads:</span>
                  <span className="font-bold text-zinc-400">1.82% markup</span>
                </div>
                
                <div className="border-t border-brand-border/40 pt-4 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Expected Settlement Value</span>
                  <span className="text-xl font-mono font-black text-rose-400">
                    {(Number(compareAmount) ? (Number(compareAmount) - 40) * (RATES_TO_KII[compareTo] / RATES_TO_KII[compareFrom]) * 0.98 : 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} {compareTo}
                  </span>
                </div>
              </div>
            </div>

            {/* KiiChain Cross-border rails */}
            <div className="p-6 rounded-xl border border-kii-purple/40 bg-kii-purple/[0.02] space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-kii-purple/5 blur-2xl pointer-events-none" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-kii-purple-light uppercase tracking-wider block">KiiChain Settlement</span>
                <span className="text-[9px] text-kii-teal font-extrabold bg-kii-teal/10 border border-kii-teal/20 px-2 py-0.5 rounded tracking-wide">
                  98% FEE SAVINGS
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-zinc-500">Service Fee:</span>
                  <span className="font-bold text-kii-teal">$1.00 USD</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-zinc-500">Processing Delay:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-kii-blue animate-pulse" />
                    ~3 Seconds (Instant)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-zinc-500">Intermediary Spreads:</span>
                  <span className="font-bold text-kii-teal">0.02% impact</span>
                </div>

                <div className="border-t border-brand-border/40 pt-4 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Expected Settlement Value</span>
                  <span className="text-xl font-mono font-black text-kii-teal">
                    {(Number(compareAmount) ? (Number(compareAmount) - 1) * (RATES_TO_KII[compareTo] / RATES_TO_KII[compareFrom]) * 0.9998 : 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} {compareTo}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. LIQUIDITY POOLS TAB */}
      {activeTab === "pools" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
          {/* Main Card (AMM Liquidity Provisioning) - takes 8 cols */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-brand-border space-y-6 relative overflow-hidden">
              
              {/* Blur Frost Overlay */}
              <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[4px] z-20 flex flex-col items-center justify-center p-4">
                <div className="p-6 rounded-2xl border border-brand-border bg-zinc-950/90 backdrop-blur-md text-center max-w-sm space-y-3.5 shadow-[0_0_50px_rgba(139,92,246,0.15)]">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-kii-purple/10 border border-kii-purple/30 text-kii-purple-light animate-pulse">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black tracking-widest text-white uppercase">
                    V2 Infrastructure
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                    Automatic Market Maker (AMM) pool structures are currently under audit. Native gas provisioning and LP locking updates will go live shortly.
                  </p>
                  <div className="inline-block px-3 py-1 rounded bg-kii-purple/15 border border-kii-purple/30 text-[9px] font-black text-kii-purple-light uppercase tracking-widest shadow-lg shadow-kii-purple/10 animate-bounce">
                    COMING SOON - V2 INFRASTRUCTURE
                  </div>
                </div>
              </div>

              {/* Form Content (Fully Visible but Disabled) */}
              <div className="space-y-4 opacity-30 select-none pointer-events-none">
                <div className="flex justify-between items-center pb-2 border-b border-brand-border/40">
                  <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-kii-blue animate-pulse" />
                    AMM Liquidity Provisioning
                  </h2>
                  <span className="text-[9px] font-bold text-zinc-500 font-mono">DEX ENGINE V2</span>
                </div>

                {/* Asset Pair Config Row */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Select Liquidity Pair</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {["KII / USDT", "KII / USDC", "KII / wBTC"].map((pair, idx) => (
                      <div
                        key={pair}
                        className={`p-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 ${
                          idx === 0
                            ? "bg-kii-purple/5 text-kii-purple-light border-kii-purple/20"
                            : "bg-zinc-950/50 border-brand-border text-zinc-400"
                        }`}
                      >
                        <span>{idx === 0 ? "🟣🟢" : idx === 1 ? "🟣🔵" : "🟣🟠"}</span>
                        {pair}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input form text boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Native KII Input */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-brand-border space-y-2 relative text-left">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Deposit Native Amount</span>
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        disabled
                        placeholder="0.0"
                        className="bg-transparent border-0 font-mono text-sm font-black text-white focus:outline-none w-full"
                      />
                      <span className="text-[9px] font-black text-zinc-400 flex items-center gap-1 bg-zinc-950 border border-brand-border px-2 py-0.5 rounded">
                        🟣 KII
                      </span>
                    </div>
                  </div>

                  {/* Token Input */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-brand-border space-y-2 relative text-left">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Deposit Token Amount</span>
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        disabled
                        placeholder="0.0"
                        className="bg-transparent border-0 font-mono text-sm font-black text-white focus:outline-none w-full"
                      />
                      <span className="text-[9px] font-black text-zinc-400 flex items-center gap-1 bg-zinc-950 border border-brand-border px-2 py-0.5 rounded">
                        🟢 USDT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simulated LP rates preview */}
                <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-brand-border/40 text-[10px] space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Exchange Rate</span>
                    <span className="text-white font-bold">1 KII = 2.44 USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Pool Weight Allocation</span>
                    <span className="text-white font-bold">50% KII / 50% USDT</span>
                  </div>
                </div>

                {/* Provision button */}
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-zinc-900 border border-brand-border text-zinc-600 font-bold text-xs tracking-wider uppercase"
                >
                  Confirm Provisioning
                </button>
              </div>

            </div>
          </div>

          {/* Stats Window - takes 4 cols */}
          <div className="lg:col-span-4">
            <div className="glass-panel p-5 rounded-xl border border-brand-border space-y-5 text-left">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-kii-blue animate-pulse" />
                  Expected Pool Matrix Stats
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 font-medium leading-relaxed">
                  Projected metrics matching future liquidity rewards and volume.
                </p>
              </div>

              {/* Matrix Grid Showcase */}
              <div className="space-y-4 font-mono text-[11px]">
                
                {/* APY */}
                <div className="p-3.5 rounded-lg border border-brand-border/40 bg-zinc-950/30 flex justify-between items-center">
                  <span className="text-zinc-400 font-bold">Estimated APY</span>
                  <span className="text-kii-teal font-extrabold text-xs tracking-wider">--.- %</span>
                </div>

                {/* Pool Share */}
                <div className="p-3.5 rounded-lg border border-brand-border/40 bg-zinc-950/30 flex justify-between items-center">
                  <span className="text-zinc-400 font-bold">Your Pool Share</span>
                  <span className="text-white font-extrabold text-xs">0.00%</span>
                </div>

                {/* Active Liquidity */}
                <div className="p-3.5 rounded-lg border border-brand-border/40 bg-zinc-950/30 flex justify-between items-center">
                  <span className="text-zinc-400 font-bold">Active Total Liquidity</span>
                  <span className="text-white font-extrabold text-xs">$0.00</span>
                </div>

                {/* Micro monitor diagnostics style lines */}
                <div className="border-t border-brand-border/40 pt-3 text-[9px] text-zinc-500 space-y-1 font-mono uppercase tracking-wide">
                  <div className="flex justify-between">
                    <span>SYS DIAGNOSTICS</span>
                    <span className="text-kii-teal font-bold">SECURE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>POOL REWARDS FEED</span>
                    <span>LOCKED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LIQUIDITY TRACKING</span>
                    <span>READY</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. GOVERNANCE TAB */}
      {activeTab === "governance" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
          {/* Main Card (Governance Staking) - takes 8 cols */}
          <div className="lg:col-span-8 space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-brand-border space-y-6 relative overflow-hidden">
              
              {/* Decorative background grid and glows */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-kii-purple/5 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-kii-blue/5 blur-3xl pointer-events-none" />

              <div className="flex justify-between items-center pb-2 border-b border-brand-border/40">
                <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-kii-purple-light animate-pulse" />
                  KiiSwap Governance Staking
                </h2>
                <span className="text-[9px] font-bold text-zinc-500 font-mono">LIVE ON TESTNET</span>
              </div>

              {/* 3D OVERLAPPING COINS GRAPHIC CONTAINER */}
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="relative w-48 h-28 flex items-center justify-center">
                  
                  {/* Outer glowing rings */}
                  <div className="absolute w-36 h-36 rounded-full bg-kii-purple/10 blur-xl animate-pulse-slow" />
                  <div className="absolute w-36 h-36 rounded-full bg-kii-blue/10 blur-xl animate-pulse-slow delay-75" />

                  {/* KII Coin (Left, slightly back) */}
                  <div className="absolute left-6 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 via-indigo-900 to-zinc-950 border-2 border-indigo-400/50 shadow-[0_10px_30px_rgba(99,102,241,0.4)] flex items-center justify-center overflow-hidden transform -rotate-12 hover:rotate-0 hover:scale-105 transition-all duration-500 z-10 cursor-pointer">
                    <img src="/Kii.jpg" alt="KII" className="w-full h-full object-cover" />
                  </div>

                  {/* sKII Coin (Right, overlapping, front) */}
                  <div className="absolute right-6 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-600 via-cyan-900 to-zinc-950 border-2 border-cyan-400/50 shadow-[0_10px_30px_rgba(6,182,212,0.4)] flex items-center justify-center overflow-hidden transform rotate-12 hover:rotate-0 hover:scale-105 transition-all duration-500 z-20 cursor-pointer">
                    <img src="/sKII.jpg" alt="sKII" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-base font-black text-white">Stake KII and receive sKII</h3>
                  <p className="text-[11px] text-zinc-500 max-w-md mx-auto leading-relaxed">
                    Convert native KII gas tokens into staked KII (sKII) custom assets. Accrue governance voting rights and validate protocol proposals interactively.
                  </p>
                </div>
              </div>

              {/* INPUT QUANTITY FIELD & CONTROLS */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-950 border border-brand-border space-y-2 relative text-left">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase">
                    <span>Input Quantity</span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => setGovAmount(balance)}
                        className="hover:text-white transition-colors cursor-pointer text-zinc-500"
                        title="Set maximum balance"
                      >
                        Available: {balance} KII
                      </button>
                      <span className="text-zinc-500">|</span>
                      <span>Staked: {stablecoinBalances.sKII || "0.0000"} sKII</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="number"
                      value={govAmount}
                      onChange={(e) => setGovAmount(e.target.value)}
                      disabled={isGovLoading}
                      placeholder="0.0"
                      className="bg-transparent border-0 font-mono text-lg font-black text-white focus:outline-none w-full"
                    />
                    
                    <span className="text-[9px] font-black text-zinc-400 flex items-center gap-1.5 bg-zinc-950 border border-brand-border px-2.5 py-1 rounded">
                      🟣 KII / sKII
                    </span>
                  </div>
                </div>

                {/* Simulated Stake Stats Preview */}
                <div className="p-3.5 rounded-lg bg-zinc-950/40 border border-brand-border/40 text-[10px] space-y-2.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Staking Rate</span>
                    <span className="text-white font-bold">1 KII = 1.0000 sKII</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Redemption Protocol</span>
                    <span className="text-white font-bold">Instant Release (via Unstake)</span>
                  </div>
                  {govAmount && !isNaN(Number(govAmount)) && Number(govAmount) > 0 && (
                    <div className="flex justify-between border-t border-brand-border/20 pt-2 text-[11px]">
                      <span className="text-kii-purple-light font-bold">Estimated Output</span>
                      <span className="text-kii-teal font-extrabold">{Number(govAmount).toFixed(4)} sKII</span>
                    </div>
                  )}
                </div>

                {/* Staking / Unstaking Loading State */}
                {isGovLoading && (
                  <div className="p-4 rounded-xl border border-kii-purple/30 bg-kii-purple/[0.02] space-y-3">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-kii-purple animate-spin" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Processing Onchain Stake Pipeline</span>
                    </div>
                    
                    {/* Glowing progress line */}
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-kii-purple to-kii-blue absolute inset-y-0 w-2/3 animate-progress-glow" />
                    </div>
                  </div>
                )}

                {/* ACTION BUTTON CONTROLS (Pills side-by-side or standard pill styling) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* STAKE Pill Accent Button */}
                  <button
                    onClick={handleStake}
                    disabled={isGovLoading || !govAmount || Number(govAmount) <= 0}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-kii-purple to-kii-blue hover:opacity-95 text-white font-bold text-xs tracking-wider uppercase transition-opacity shadow-lg shadow-kii-purple/10 disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  >
                    Stake Assets
                  </button>

                  {/* UNSTAKE Pill Button */}
                  <button
                    onClick={handleUnstake}
                    disabled={isGovLoading || !govAmount || Number(govAmount) <= 0}
                    className="py-3 px-4 rounded-xl bg-zinc-900 border border-brand-border hover:bg-zinc-800 text-white font-bold text-xs tracking-wider uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  >
                    Unstake Assets
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Stats Window - takes 4 cols */}
          <div className="lg:col-span-4">
            <div className="glass-panel p-5 rounded-xl border border-brand-border space-y-5 text-left">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-kii-purple-light animate-pulse" />
                  Staking Matrix Indicators
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 font-medium leading-relaxed">
                  Projected protocol rates for active delegators and liquidity nodes.
                </p>
              </div>

              {/* Stats Grid Showcase */}
              <div className="space-y-4 font-mono text-[11px]">
                
                {/* APY */}
                <div className="p-3.5 rounded-lg border border-brand-border/40 bg-zinc-950/30 flex justify-between items-center">
                  <span className="text-zinc-400 font-bold">Staking APR</span>
                  <span className="text-kii-teal font-extrabold text-xs tracking-wider">12.45%</span>
                </div>

                {/* Pool Share */}
                <div className="p-3.5 rounded-lg border border-brand-border/40 bg-zinc-950/30 flex justify-between items-center">
                  <span className="text-zinc-400 font-bold">Exchange Ratio</span>
                  <span className="text-white font-extrabold text-xs">1:1 pegged</span>
                </div>

                {/* Active Liquidity */}
                <div className="p-3.5 rounded-lg border border-brand-border/40 bg-zinc-950/30 flex justify-between items-center">
                  <span className="text-zinc-400 font-bold">Total KII Staked</span>
                  <span className="text-white font-extrabold text-xs">{totalStakedKii} KII</span>
                </div>

                {/* Micro monitor diagnostics style lines */}
                <div className="border-t border-brand-border/40 pt-3 text-[9px] text-zinc-500 space-y-1 font-mono uppercase tracking-wide">
                  <div className="flex justify-between">
                    <span>GOV REGISTRY STATUS</span>
                    <span className="text-kii-teal font-bold">CONNECTED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VOTING WEIGHT POW</span>
                    <span className="text-kii-purple-light font-bold">ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VALIDATOR SLOTS</span>
                    <span>64 / 64 ACTIVE</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION HISTORY GRID FEED (Moved to grid layout) */}

      {/* SLIPPAGE SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-5 rounded-xl border border-brand-border-purple/35 w-80 max-w-full space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Advanced Transaction Parameters
            </h3>
            
            <div className="space-y-2.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Slippage Tolerance</label>
              <div className="grid grid-cols-3 gap-2">
                {[0.1, 0.5, 1.0].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSlippage(val)}
                    className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                      slippage === val 
                        ? "bg-kii-purple/10 text-kii-purple-light border-kii-purple/35" 
                        : "bg-zinc-950 border-brand-border text-zinc-400 hover:text-white"
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Liquidity Pool Address</label>
              <input
                type="text"
                value={poolAddress}
                onChange={(e) => {
                  setPoolAddress(e.target.value);
                  localStorage.setItem("kii_swap_pool_address", e.target.value);
                }}
                placeholder="e.g. 0x..."
                className="w-full px-3 py-2 bg-zinc-950 border border-brand-border rounded-lg text-[10px] text-white font-mono focus:outline-none focus:border-kii-purple/50"
              />
            </div>

            <div className="p-3 bg-zinc-950/60 rounded border border-brand-border/40 text-[10px] text-zinc-500 font-mono leading-normal">
              Specify a custom SimpleSwapPool contract address. Swaps will execute real testnet pool contract interactions.
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 bg-gradient-to-r from-kii-purple to-kii-blue text-white font-bold text-xs rounded-lg uppercase tracking-wider shadow"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-xl border bg-zinc-950/90 backdrop-blur-md shadow-2xl transition-all duration-300 ${
          toast.type === "error" ? "border-rose-500/30 shadow-rose-950/10" : 
          toast.type === "success" ? "border-emerald-500/30 shadow-emerald-950/10" : 
          "border-brand-border"
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-300">
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Info className="w-4 h-4 text-kii-blue" />
            )}
            <span className="text-white text-[11px] font-medium leading-relaxed">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
