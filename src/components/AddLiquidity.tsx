'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Loader2, Droplets, ShieldCheck, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { DEPLOYED_CONTRACTS, SIMPLE_SWAP_ABI, MOCK_TOKEN_ABI } from '@/config/contracts';

export function AddLiquidity() {
  const { address, isConnected } = useAccount();

  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [lastAction, setLastAction] = useState<'approveA' | 'approveB' | 'addLiquidity' | null>(null);

  // Pool reserves
  const { data: reserves } = useReadContract({
    address: DEPLOYED_CONTRACTS.SIMPLE_SWAP,
    abi: SIMPLE_SWAP_ABI,
    functionName: 'getReserves',
  });

  // Balances
  const { data: balanceAData } = useReadContract({
    address: DEPLOYED_CONTRACTS.TOKEN_A,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: balanceBData } = useReadContract({
    address: DEPLOYED_CONTRACTS.TOKEN_B,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Allowances
  const { data: allowanceAData } = useReadContract({
    address: DEPLOYED_CONTRACTS.TOKEN_A,
    abi: MOCK_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, DEPLOYED_CONTRACTS.SIMPLE_SWAP] : undefined,
  });

  const { data: allowanceBData } = useReadContract({
    address: DEPLOYED_CONTRACTS.TOKEN_B,
    abi: MOCK_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, DEPLOYED_CONTRACTS.SIMPLE_SWAP] : undefined,
  });

  // Write + receipt
  const { data: txHash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const allowanceA = (allowanceAData as bigint | undefined) ?? BigInt(0);
  const allowanceB = (allowanceBData as bigint | undefined) ?? BigInt(0);
  const balanceA = (balanceAData as bigint | undefined) ?? BigInt(0);
  const balanceB = (balanceBData as bigint | undefined) ?? BigInt(0);
  const poolReserves = reserves as [bigint, bigint] | undefined;

  const amountAWei = useMemo(() => {
    if (!amountA || Number.isNaN(Number(amountA))) return null;
    try {
      return parseEther(amountA);
    } catch {
      return null;
    }
  }, [amountA]);

  const amountBWei = useMemo(() => {
    if (!amountB || Number.isNaN(Number(amountB))) return null;
    try {
      return parseEther(amountB);
    } catch {
      return null;
    }
  }, [amountB]);

  const needsApproveA = !!amountAWei && allowanceA < amountAWei;
  const needsApproveB = !!amountBWei && allowanceB < amountBWei;

  useEffect(() => {
    if (isConfirmed && lastAction) {
      if (lastAction === 'addLiquidity') {
        toast.success('Liquidity added successfully');
        setAmountA('');
        setAmountB('');
      } else if (lastAction === 'approveA') {
        toast.success('Token A approved');
      } else if (lastAction === 'approveB') {
        toast.success('Token B approved');
      }
      setLastAction(null);
    }
  }, [isConfirmed, lastAction]);

  const ensureConnected = () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return false;
    }
    return true;
  };

  const handleApprove = async (token: 'A' | 'B') => {
    if (!ensureConnected()) return;

    const amountWei = token === 'A' ? amountAWei : amountBWei;
    if (!amountWei || amountWei <= 0) {
      toast.error('Enter a valid amount first');
      return;
    }

    const tokenAddress = token === 'A' ? DEPLOYED_CONTRACTS.TOKEN_A : DEPLOYED_CONTRACTS.TOKEN_B;

    try {
      setLastAction(token === 'A' ? 'approveA' : 'approveB');
      writeContract({
        address: tokenAddress,
        abi: MOCK_TOKEN_ABI,
        functionName: 'approve',
        args: [DEPLOYED_CONTRACTS.SIMPLE_SWAP, amountWei],
      });
    } catch (err) {
      console.error(err);
      toast.error('Approval failed');
    }
  };

  const handleAddLiquidity = async () => {
    if (!ensureConnected()) return;
    if (!amountAWei || !amountBWei || amountAWei <= 0 || amountBWei <= 0) {
      toast.error('Enter both token amounts');
      return;
    }

    if (balanceA < amountAWei || balanceB < amountBWei) {
      toast.error('Insufficient token balance');
      return;
    }

    if (needsApproveA || needsApproveB) {
      toast.error('Approve both tokens first');
      return;
    }

    try {
      setLastAction('addLiquidity');
      writeContract({
        address: DEPLOYED_CONTRACTS.SIMPLE_SWAP,
        abi: SIMPLE_SWAP_ABI,
        functionName: 'addLiquidity',
        args: [amountAWei, amountBWei],
      });
    } catch (err) {
      console.error(err);
      toast.error('Add liquidity failed');
    }
  };

  const renderBalance = (balance: bigint) => (Number(balance) / 1e18).toFixed(4);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-zinc-900/80 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 rounded-xl">
              <Droplets className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-cyan-400/80 font-mono">POOLED LIQUIDITY</p>
              <h2 className="text-xl font-bold text-white font-mono">Add TKA / TKB</h2>
            </div>
          </div>
          <div className="text-xs text-zinc-400 font-mono bg-zinc-800/60 px-3 py-1 rounded-lg border border-zinc-700/60">
            SimpleSwap Contract
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-800/50">
            <div className="flex items-center justify-between mb-2 text-sm text-zinc-400 font-mono">
              <span>Token A (TKA)</span>
              {isConnected && <span>Balance: {renderBalance(balanceA)} TKA</span>}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                placeholder="0.0"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                className="flex-1 bg-transparent text-2xl text-white font-mono outline-none"
              />
              <button
                onClick={() => setAmountA(balanceA ? (Number(balanceA) / 1e18).toString() : '')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
              >
                MAX
              </button>
            </div>
            <button
              onClick={() => handleApprove('A')}
              disabled={!needsApproveA || isPending || isConfirming}
              className={`mt-3 w-full py-2 rounded-lg font-mono text-sm transition-all ${
                needsApproveA ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {(isPending && lastAction === 'approveA') || (isConfirming && lastAction === 'approveA') ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving...
                </span>
              ) : needsApproveA ? 'Approve TKA' : 'TKA Approved'}
            </button>
          </div>

          <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-800/50">
            <div className="flex items-center justify-between mb-2 text-sm text-zinc-400 font-mono">
              <span>Token B (TKB)</span>
              {isConnected && <span>Balance: {renderBalance(balanceB)} TKB</span>}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                placeholder="0.0"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                className="flex-1 bg-transparent text-2xl text-white font-mono outline-none"
              />
              <button
                onClick={() => setAmountB(balanceB ? (Number(balanceB) / 1e18).toString() : '')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
              >
                MAX
              </button>
            </div>
            <button
              onClick={() => handleApprove('B')}
              disabled={!needsApproveB || isPending || isConfirming}
              className={`mt-3 w-full py-2 rounded-lg font-mono text-sm transition-all ${
                needsApproveB ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {(isPending && lastAction === 'approveB') || (isConfirming && lastAction === 'approveB') ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Approving...
                </span>
              ) : needsApproveB ? 'Approve TKB' : 'TKB Approved'}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 mb-4">
          <p className="text-sm text-cyan-300 font-mono mb-1">How it works</p>
          <ul className="text-xs text-cyan-100/80 font-mono space-y-1 list-disc list-inside">
            <li>Approve TKA and TKB once for the SimpleSwap contract.</li>
            <li>Enter equal-value amounts (1:1 by price) and click Add Liquidity.</li>
            <li>After confirmation, swaps become available in the Swap tab.</li>
          </ul>
        </div>

        <button
          onClick={handleAddLiquidity}
          disabled={isPending || isConfirming || !isConnected || !amountAWei || !amountBWei}
          className={`w-full py-3 rounded-lg font-bold font-mono transition-all ${
            isConnected && amountAWei && amountBWei && !needsApproveA && !needsApproveB
              ? 'bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black'
              : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
          }`}
        >
          {(isPending && lastAction === 'addLiquidity') || (isConfirming && lastAction === 'addLiquidity') ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isConfirming ? 'Confirming...' : 'Adding...'}
            </span>
          ) : !isConnected ? (
            <span className="flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </span>
          ) : needsApproveA || needsApproveB ? (
            'Approve both tokens first'
          ) : (
            'Add Liquidity'
          )}
        </button>

        {poolReserves && (
          <div className="mt-4 p-4 rounded-lg border border-zinc-700 bg-zinc-800/40">
            <div className="flex items-center gap-2 text-sm text-zinc-300 font-mono mb-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Pool Reserves (current)
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm font-mono">
              <div className="flex items-center justify-between text-zinc-400">
                <span>TKA</span>
                <span className="text-zinc-100">{(Number(poolReserves[0]) / 1e18).toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>TKB</span>
                <span className="text-zinc-100">{(Number(poolReserves[1]) / 1e18).toFixed(3)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
