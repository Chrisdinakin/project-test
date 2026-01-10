'use client';

import { useState, useEffect } from 'react';
import { ArrowDownUp, Settings, Wallet, Loader2, CheckCircle } from 'lucide-react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import toast from 'react-hot-toast';
import { useTradingStore } from '@/hooks/useTradingStore';
import { DEPLOYED_CONTRACTS, SIMPLE_SWAP_ABI, MOCK_TOKEN_ABI } from '@/config/contracts';
import { MOCK_TOKENS } from '@/config/tokens';

export function SwapInterface() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  
  const { swapForm, setSwapForm } = useTradingStore();
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastAction, setLastAction] = useState<'approve' | 'swap' | null>(null);
  
  // Read contract hooks
  const { data: reserves } = useReadContract({
    address: DEPLOYED_CONTRACTS.SIMPLE_SWAP,
    abi: SIMPLE_SWAP_ABI,
    functionName: 'getReserves',
  });
  
  const { data: tkaBalance } = useReadContract({
    address: DEPLOYED_CONTRACTS.TOKEN_A,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });
  
  const { data: tkbBalance } = useReadContract({
    address: DEPLOYED_CONTRACTS.TOKEN_B,
    abi: MOCK_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });
  
  // Write contract hooks
  const { data: hash, writeContract, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  
  // Calculate output amount based on reserves (constant product formula)
  useEffect(() => {
    if (swapForm.fromAmount && !isNaN(parseFloat(swapForm.fromAmount)) && reserves) {
      const inputAmount = parseFloat(swapForm.fromAmount);
      const [reserveA, reserveB] = reserves as [bigint, bigint];
      
      let outputAmount: number;
      
      // Determine which direction we're swapping
      const isTkaToTkb = swapForm.fromToken === 'TKA';
      
      // Simple AMM calculation: (amountIn * reserveOut) / (reserveIn + amountIn)
      // With 0.3% fee: amountIn * 0.997
      const amountInWei = BigInt(Math.floor(inputAmount * 1e18));
      const amountInWithFee = (amountInWei * BigInt(997)) / BigInt(1000);
      
      if (isTkaToTkb) {
        const numerator = amountInWithFee * reserveB;
        const denominator = reserveA + amountInWithFee;
        outputAmount = Number(numerator / denominator) / 1e18;
      } else {
        const numerator = amountInWithFee * reserveA;
        const denominator = reserveB + amountInWithFee;
        outputAmount = Number(numerator / denominator) / 1e18;
      }
      
      // Apply slippage tolerance
      outputAmount = outputAmount * (1 - swapForm.slippage / 100);
      setSwapForm({ toAmount: outputAmount.toFixed(6) });
    } else {
      setSwapForm({ toAmount: '' });
    }
  }, [swapForm.fromAmount, swapForm.fromToken, swapForm.toToken, swapForm.slippage, reserves, setSwapForm]);
  
  const handleSwapTokens = () => {
    setSwapForm({
      fromToken: swapForm.toToken,
      toToken: swapForm.fromToken,
      fromAmount: swapForm.toAmount,
      toAmount: swapForm.fromAmount,
    });
  };
  
  const handleApprove = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    const tokenAddress = swapForm.fromToken === 'TKA' ? DEPLOYED_CONTRACTS.TOKEN_A : DEPLOYED_CONTRACTS.TOKEN_B;
    const amount = parseEther(swapForm.fromAmount);
    
    try {
      setLastAction('approve');
      writeContract({
        address: tokenAddress,
        abi: MOCK_TOKEN_ABI,
        functionName: 'approve',
        args: [DEPLOYED_CONTRACTS.SIMPLE_SWAP, amount],
      });
      toast.success('Approval transaction submitted!');
    } catch (error) {
      toast.error('Approval failed');
      console.error(error);
    }
  };
  
  const handleSwap = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!swapForm.fromAmount || parseFloat(swapForm.fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!swapForm.toAmount || parseFloat(swapForm.toAmount) <= 0) {
      toast.error('Output amount unavailable. Check liquidity and amount.');
      return;
    }
    
    if (!reserves || reserves[0] === BigInt(0) || reserves[1] === BigInt(0)) {
      toast.error('No liquidity in pool. Please add liquidity first.');
      return;
    }
    
    setIsSwapping(true);
    
    try {
      const tokenIn = swapForm.fromToken === 'TKA' ? DEPLOYED_CONTRACTS.TOKEN_A : DEPLOYED_CONTRACTS.TOKEN_B;
      const amountIn = parseEther(swapForm.fromAmount);
      const minAmountOut = parseEther(swapForm.toAmount);
      
      setLastAction('swap');
      writeContract({
        address: DEPLOYED_CONTRACTS.SIMPLE_SWAP,
        abi: SIMPLE_SWAP_ABI,
        functionName: 'swap',
        args: [tokenIn, amountIn, minAmountOut],
      });
      
      toast.success('Swap transaction submitted!');
    } catch (error) {
      toast.error('Swap failed or was rejected');
      console.error(error);
    } finally {
      setIsSwapping(false);
    }
  };
  
  // Show success message when transaction is confirmed
  useEffect(() => {
    if (!isConfirmed) return;
    if (lastAction === 'approve') {
      toast.success('Approval confirmed');
      setLastAction(null);
      return;
    }
    if (lastAction === 'swap') {
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-[var(--bg-secondary)] border border-[var(--success)]/30 shadow-lg rounded-xl pointer-events-auto`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-[var(--success)]" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Swap Confirmed
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)] font-mono">
                  {swapForm.fromAmount} {swapForm.fromToken} → {swapForm.toAmount} {swapForm.toToken}
                </p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 5000 });
      setSwapForm({ fromAmount: '', toAmount: '' });
      setLastAction(null);
    }
  }, [isConfirmed, lastAction, swapForm.fromAmount, swapForm.fromToken, swapForm.toAmount, swapForm.toToken, setSwapForm]);
  
  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Swap
          </h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
          </button>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-default)]">
            <label className="text-sm text-[var(--text-secondary)] font-medium">Slippage Tolerance</label>
            <div className="flex gap-2 mt-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSwapForm({ slippage: value })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    swapForm.slippage === value
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <input
                type="number"
                value={swapForm.slippage}
                onChange={(e) => setSwapForm({ slippage: parseFloat(e.target.value) || 0.5 })}
                className="w-16 px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent)] focus:outline-none"
                step="0.1"
                min="0"
                max="50"
              />
            </div>
          </div>
        )}
        
        {/* From Token Input */}
        <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 border border-[var(--border-default)]">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">From</span>
            {isConnected && (
              <span className="text-xs text-[var(--text-muted)]">
                Balance: <span className="font-mono text-[var(--text-secondary)]">{swapForm.fromToken === 'TKA' && tkaBalance 
                  ? (Number(tkaBalance) / 1e18).toFixed(4)
                  : swapForm.fromToken === 'TKB' && tkbBalance
                  ? (Number(tkbBalance) / 1e18).toFixed(4)
                  : '0.0000'}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <input
              type="number"
              placeholder="0.0"
              value={swapForm.fromAmount}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              onChange={(e) => setSwapForm({ fromAmount: e.target.value })}
              className="flex-1 bg-transparent text-3xl text-[var(--text-primary)] font-mono outline-none placeholder:text-[var(--text-placeholder)]"
            />
            <select
              value={swapForm.fromToken}
              onChange={(e) => setSwapForm({ 
                fromToken: e.target.value as 'TKA' | 'TKB',
                toToken: e.target.value === 'TKA' ? 'TKB' : 'TKA'
              })}
              className="bg-[var(--bg-elevated)] px-4 py-2.5 rounded-lg hover:bg-[var(--border-default)] transition-colors text-[var(--text-primary)] font-semibold outline-none cursor-pointer border border-[var(--border-default)]"
            >
              <option value="TKA">TKA</option>
              <option value="TKB">TKB</option>
            </select>
          </div>
          {isConnected && (
            <button
              onClick={() => {
                const balance = swapForm.fromToken === 'TKA' ? tkaBalance : tkbBalance;
                if (balance) {
                  setSwapForm({ fromAmount: (Number(balance) / 1e18).toString() });
                }
              }}
              className="mt-2 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
            >
              MAX
            </button>
          )}
        </div>
        
        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="bg-[var(--bg-secondary)] border border-[var(--border-default)] p-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent)] transition-all group"
          >
            <ArrowDownUp className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent)] group-hover:rotate-180 transition-all duration-300" />
          </button>
        </div>
        
        {/* To Token Output */}
        <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 border border-[var(--border-default)]">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">To</span>
            {isConnected && (
              <span className="text-xs text-[var(--text-muted)]">
                Balance: <span className="font-mono text-[var(--text-secondary)]">{swapForm.toToken === 'TKA' && tkaBalance 
                  ? (Number(tkaBalance) / 1e18).toFixed(4)
                  : swapForm.toToken === 'TKB' && tkbBalance
                  ? (Number(tkbBalance) / 1e18).toFixed(4)
                  : '0.0000'}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="0.0"
              value={swapForm.toAmount}
              readOnly
              className="flex-1 bg-transparent text-3xl text-[var(--text-primary)] font-mono outline-none placeholder:text-[var(--text-placeholder)]"
            />
            <button
              className="flex items-center gap-2 bg-[var(--bg-elevated)] px-4 py-2.5 rounded-lg cursor-default border border-[var(--border-default)]"
            >
              <span className="text-[var(--text-primary)] font-semibold">{swapForm.toToken}</span>
            </button>
          </div>
        </div>
        
        {/* Pool Info */}
        {reserves && reserves[0] > BigInt(0) && reserves[1] > BigInt(0) && (
          <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-subtle)]">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-muted)] font-medium">Pool Reserves</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--text-muted)]">TKA</span>
              <span className="text-[var(--text-secondary)] font-mono">{(Number(reserves[0]) / 1e18).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">TKB</span>
              <span className="text-[var(--text-secondary)] font-mono">{(Number(reserves[1]) / 1e18).toFixed(2)}</span>
            </div>
            {swapForm.fromAmount && parseFloat(swapForm.fromAmount) > 0 && (
              <>
                <div className="h-px bg-[var(--border-subtle)] my-3"></div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-muted)]">Rate</span>
                  <span className="text-[var(--text-secondary)] font-mono">
                    1 {swapForm.fromToken} ≈ {swapForm.toAmount && swapForm.fromAmount 
                      ? (parseFloat(swapForm.toAmount) / parseFloat(swapForm.fromAmount)).toFixed(4)
                      : '0.0000'} {swapForm.toToken}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Slippage</span>
                  <span className="text-[var(--text-secondary)] font-mono">{swapForm.slippage}%</span>
                </div>
              </>
            )}
          </div>
        )}
        
        {!reserves || reserves[0] === BigInt(0) || reserves[1] === BigInt(0) ? (
          <div className="mt-4 p-4 bg-[var(--warning-muted)] rounded-xl border border-[var(--warning)]/20">
            <p className="text-sm text-[var(--warning)] flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              No liquidity in pool. Add liquidity first to enable swaps.
            </p>
          </div>
        ) : null}
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleApprove}
            disabled={isPending || isConfirming || !isConnected || !swapForm.fromAmount}
            type="button"
            className={`flex-1 py-3.5 rounded-xl font-semibold transition-all ${
              isConnected && swapForm.fromAmount
                ? 'bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
            }`}
          >
            {isPending || isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Approving...
              </span>
            ) : (
              'Approve'
            )}
          </button>
          <button
            onClick={handleSwap}
            disabled={isSwapping || isPending || isConfirming || !isConnected || !swapForm.fromAmount}
            type="button"
            className={`flex-1 py-3.5 rounded-xl font-semibold transition-all ${
              isConnected && swapForm.fromAmount && reserves && reserves[0] > BigInt(0)
                ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
            }`}
          >
            {isSwapping || isPending || isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isConfirming ? 'Confirming...' : 'Swapping...'}
              </span>
            ) : !isConnected ? (
              <span className="flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4" />
                Connect
              </span>
            ) : !swapForm.fromAmount ? (
              'Enter Amount'
            ) : (
              'Swap'
            )}
          </button>
        </div>
        
        {/* Contract Info */}
        <div className="mt-4 p-4 bg-[var(--success-muted)] rounded-xl border border-[var(--success)]/20">
          <p className="text-xs text-[var(--success)] font-medium mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Connected to Sepolia
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">SimpleSwap</span>
              <span className="text-[var(--text-secondary)] font-mono">{DEPLOYED_CONTRACTS.SIMPLE_SWAP.slice(0, 10)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Token A</span>
              <span className="text-[var(--text-secondary)] font-mono">{DEPLOYED_CONTRACTS.TOKEN_A.slice(0, 10)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Token B</span>
              <span className="text-[var(--text-secondary)] font-mono">{DEPLOYED_CONTRACTS.TOKEN_B.slice(0, 10)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
