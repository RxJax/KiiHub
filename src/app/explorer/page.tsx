"use client";

import React, { useState, useEffect } from "react";
import { 
  Layers, 
  ExternalLink,
  Users,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";

const SENTRY_RPC_URL = "https://json-rpc.dos.sentry.testnet.v3.kiivalidator.com/";
const globalSentryProvider = typeof window !== "undefined" ? new ethers.JsonRpcProvider(SENTRY_RPC_URL) : null;

interface Block {
  height: number;
  hash: string;
  txs: number;
  time: string;
  validator: string;
}

interface Tx {
  hash: string;
  type: string;
  sender: string;
  gas: string;
  status: "success" | "failed";
  timestamp: string;
}

export default function Explorer() {
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [validators, setValidators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<boolean>(false);

  // Timeago helper
  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor(Date.now() / 1000 - timestamp);
    if (diff < 0) return "just now";
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Fetch real testnet data
  useEffect(() => {
    let isMounted = true;

    const fetchRealData = async () => {
      try {
        setConnectionError(false);
        // Fetch real validators from Cosmos API Node
        const valRes = await fetch("https://api.uno.sentry.testnet.v3.kiivalidator.com/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED");
        if (valRes.ok && isMounted) {
          const valData = await valRes.json();
          if (valData.validators && valData.validators.length > 0) {
            const parsedVals = valData.validators.map((val: any) => {
              const name = val.description.moniker || "Validator";
              const tokens = Math.floor(Number(val.tokens) / 1000000);
              const commission = `${(Number(val.commission.commission_rates.rate) * 100).toFixed(0)}%`;
              return {
                name,
                votingPower: `${tokens.toLocaleString()} KII`,
                commission,
                uptime: "100.0%"
              };
            }).slice(0, 8);
            
            if (parsedVals.length > 0) {
              setValidators(parsedVals);
            }
          }
        }
      } catch (err) {
        console.warn("Could not query validators from Cosmos LCD:", err);
      }

      try {
        // Fetch EVM Block heights and block details
        const provider = globalSentryProvider || new ethers.JsonRpcProvider(SENTRY_RPC_URL);
        const currentHeight = await provider.getBlockNumber();
        if (isMounted) {
          setBlockHeight(currentHeight);
        }

        // Fetch last 5 blocks in parallel
        const blockHeights = Array.from({ length: 5 }, (_, i) => currentHeight - i);
        const blockPromises = blockHeights.map((h) => provider.getBlock(h).catch(() => null));
        const resolvedBlocks = await Promise.all(blockPromises);

        const fetchedBlocks: Block[] = [];
        const txPromises: Promise<any>[] = [];
        const txBlockTimestamps: number[] = [];

        resolvedBlocks.forEach((block, index) => {
          const height = blockHeights[index];
          if (block) {
            fetchedBlocks.push({
              height,
              hash: block.hash || "0x",
              txs: block.transactions.length,
              time: formatTimeAgo(block.timestamp),
              validator: block.miner ? `${block.miner.slice(0, 8)}...${block.miner.slice(-6)}` : "Consensus Node"
            });

            // Gather up to 2 transactions per block to fetch details in parallel
            const maxTxs = Math.min(block.transactions.length, 2);
            for (let j = 0; j < maxTxs; j++) {
              txPromises.push(provider.getTransaction(block.transactions[j]).catch(() => null));
              txBlockTimestamps.push(block.timestamp);
            }
          }
        });

        // Resolve all transactions in parallel
        const resolvedTxs = await Promise.all(txPromises);
        const fetchedTxs: Tx[] = [];

        resolvedTxs.forEach((tx, idx) => {
          if (tx) {
            fetchedTxs.push({
              hash: tx.hash,
              type: tx.to ? "Transfer / Interaction" : "Contract Deploy",
              sender: tx.from,
              gas: tx.gasLimit.toString(),
              status: "success",
              timestamp: formatTimeAgo(txBlockTimestamps[idx])
            });
          }
        });

        if (isMounted) {
          setBlocks(fetchedBlocks);
          setTxs(fetchedTxs);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn("Could not query real blocks from EVM RPC:", err);
        if (isMounted) {
          setConnectionError(true);
          setIsLoading(false);
        }
      }
    };

    fetchRealData();

    // Set polling loop to fetch every 6 seconds
    const interval = setInterval(() => {
      fetchRealData();
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Truncate address helper
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Compass className="w-8 h-8 text-kii-blue" />
            Chain Activity Monitor
          </h1>
          <p className="text-zinc-400 text-sm">
            Real-time blocks, transactions, and validator directories synced directly from testnet sentry nodes.
          </p>
        </div>
        
        <a
          href="https://explorer.kiichain.io/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-kii-purple to-kii-blue hover:opacity-95 text-white font-bold text-xs tracking-wider uppercase transition-opacity shadow-lg shadow-kii-purple/15 flex-shrink-0"
        >
          Open KiiChain Explorer
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Connection Offline Alert */}
      {connectionError && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/[0.02] text-zinc-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-red-400">Node Connection Offline</h4>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Failed to connect to the KiiChain testnet JSON-RPC sentry nodes. This may be due to temporary node maintenance, internet offline, or CORS filters. Showing cached blocks.
            </p>
          </div>
        </div>
      )}

      {/* Network Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Height */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Block Height</span>
            <span className={`text-lg font-bold font-mono ${connectionError ? "text-red-400" : "text-white"}`}>
              {isLoading ? "Fetching..." : blockHeight ? `#${blockHeight.toLocaleString()}` : "Offline"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-kii-purple/10 border border-kii-purple/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-kii-purple" />
          </div>
        </div>

        {/* Metric Total Validators */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Active Validators</span>
            <span className="text-lg font-bold text-white font-mono">
              {isLoading ? "Fetching..." : `${validators.length} Validators`}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-kii-blue/10 border border-kii-blue/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-kii-blue" />
          </div>
        </div>

        {/* Metric Consensus Health */}
        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Network Status</span>
            <span className="text-lg font-bold text-white flex items-center gap-1.5 font-sans">
              <span className={`w-2 h-2 rounded-full ${connectionError ? "bg-red-500 animate-pulse" : "bg-kii-teal animate-pulse"}`} />
              {connectionError ? "Degraded Sync" : "Testnet Live"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-brand-border flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-zinc-400" />
          </div>
        </div>

      </div>

      {/* Blocks & Transactions Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Latest Blocks */}
        <section className="glass-panel rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-kii-purple" />
            Latest Blocks
          </h3>

          <div className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-zinc-500 text-xs">Querying blockchain ledger...</div>
            ) : blocks.length > 0 ? (
              <AnimatePresence initial={false}>
                {blocks.map((block) => (
                  <motion.div
                    key={block.height}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-zinc-950 rounded-lg border border-brand-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-kii-purple/10 border border-kii-purple/20 flex flex-col items-center justify-center text-[10px] text-kii-purple-light font-bold font-mono">
                        <span>BK</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white font-mono">#{block.height}</span>
                        <span className="text-[10px] text-zinc-500 font-sans mt-0.5">{block.time}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-bold text-white">{block.txs} Txs</span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[120px]" title={block.hash}>
                        {block.hash.slice(0, 14)}...
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="py-8 text-center text-zinc-600 text-xs">No blocks retrieved. Verify node connectivity.</div>
            )}
          </div>
        </section>

        {/* Latest Transactions */}
        <section className="glass-panel rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-kii-blue" />
            Latest Block Transactions
          </h3>

          <div className="space-y-3">
            {isLoading ? (
              <div className="py-8 text-center text-zinc-500 text-xs">Scanning block events...</div>
            ) : txs.length > 0 ? (
              <AnimatePresence initial={false}>
                {txs.map((tx) => (
                  <motion.div
                    key={tx.hash}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-zinc-950 rounded-lg border border-brand-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-kii-blue/10 border border-kii-blue/20 flex items-center justify-center text-[10px] text-kii-blue-light font-bold">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-white truncate max-w-[120px] font-mono" title={tx.hash}>{tx.hash}</span>
                        <span className="text-[10px] text-zinc-500 truncate max-w-[160px] font-mono mt-0.5">
                          From: {truncateAddress(tx.sender)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="font-semibold text-white text-[11px]">{tx.type}</span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{tx.gas} gas</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div className="py-12 text-center text-zinc-600 text-xs font-semibold">
                No transactions recorded in the latest block heights.
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Validators Directory */}
      <section className="glass-panel rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-400" />
          Active Validator Directory
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-zinc-400">
            <thead>
              <tr className="border-b border-brand-border text-left text-zinc-500">
                <th className="pb-3 font-semibold">Validator Name</th>
                <th className="pb-3 font-semibold">Voting Power</th>
                <th className="pb-3 font-semibold">Commission Fee</th>
                <th className="pb-3 font-semibold text-right">Consensus Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40 font-mono">
              {validators.length > 0 ? (
                validators.map((val) => (
                  <tr key={val.name} className="hover:bg-white/[0.01]">
                    <td className="py-3 font-bold text-white font-sans">{val.name}</td>
                    <td className="py-3 text-zinc-300">{val.votingPower}</td>
                    <td className="py-3 text-zinc-400">{val.commission}</td>
                    <td className="py-3 text-right">
                      <span className="px-1.5 py-0.2 rounded bg-kii-emerald/10 text-kii-emerald border border-kii-emerald/20 text-[10px] font-sans font-bold">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500 text-xs font-semibold">
                    {connectionError 
                      ? "Failed to query Cosmos staking sentry registry." 
                      : "Loading active validator directory from testnet registries..."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
