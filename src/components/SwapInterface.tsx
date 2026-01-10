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
  
  const { swapForm, setSwapForm } = useTradingStore();
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
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
    
    if (!reserves || reserves[0] === BigInt(0) || reserves[1] === BigInt(0)) {
      toast.error('No liquidity in pool. Please add liquidity first.');
      return;
    }
    
    setIsSwapping(true);
    
    try {
      const tokenIn = swapForm.fromToken === 'TKA' ? DEPLOYED_CONTRACTS.TOKEN_A : DEPLOYED_CONTRACTS.TOKEN_B;
      const amountIn = parseEther(swapForm.fromAmount);
      const minAmountOut = parseEther(swapForm.toAmount);
      
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
    if (isConfirmed) {
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-zinc-900 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-cyan-400">
                  Transaction Confirmed!
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {swapForm.fromAmount} {swapForm.fromToken} → {swapForm.toAmount} {swapForm.toToken}
                </p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 5000 });
      
      setSwapForm({ fromAmount: '', toAmount: '' });
    }
  }, [isConfirmed, swapForm.fromAmount, swapForm.fromToken, swapForm.toAmount, swapForm.toToken, setSwapForm]);
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-zinc-900/80 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-cyan-400 font-mono">
            SWAP
          </h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-zinc-400 hover:text-cyan-400" />
          </button>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <label className="text-sm text-zinc-400 font-mono">Slippage Tolerance</label>
            <div className="flex gap-2 mt-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSwapForm({ slippage: value })}
                  className={`px-3 py-1 rounded text-sm font-mono ${
                    swapForm.slippage === value
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                      : 'bg-zinc-700 text-zinc-400 border border-zinc-600'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <input
                type="number"
                value={swapForm.slippage}
                onChange={(e) => setSwapForm({ slippage: parseFloat(e.target.value) || 0.5 })}
                className="w-16 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-sm text-cyan-400 font-mono"
                step="0.1"
                min="0"
                max="50"
              />
            </div>
          </div>
        )}
        
        {/* From Token Input */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-zinc-400 font-mono">From</span>
            {isConnected && (
              <span className="text-sm text-zinc-500 font-mono">
                Balance: {swapForm.fromToken === 'TKA' && tkaBalance 
                  ? (Number(tkaBalance) / 1e18).toFixed(4)
                  : swapForm.fromToken === 'TKB' && tkbBalance
                  ? (Number(tkbBalance) / 1e18).toFixed(4)
                  : '0.0000'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <input
              type="number"
              placeholder="0.0"
              value={swapForm.fromAmount}
              onChange={(e) => setSwapForm({ fromAmount: e.target.value })}
              className="flex-1 bg-transparent text-2xl text-white font-mono outline-none"
            />
            <select
              value={swapForm.fromToken}
              onChange={(e) => setSwapForm({ 
                fromToken: e.target.value as 'TKA' | 'TKB',
                toToken: e.target.value === 'TKA' ? 'TKB' : 'TKA'
              })}
              className="bg-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-600 transition-colors text-cyan-400 font-bold font-mono outline-none cursor-pointer"
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
              className="mt-2 text-xs text-cyan-500 hover:text-cyan-400 font-mono"
            >
              MAX
            </button>
          )}
        </div>
        
        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="bg-zinc-800 border border-cyan-500/30 p-2 rounded-lg hover:bg-zinc-700 hover:border-cyan-500 transition-all group"
          >
            <ArrowDownUp className="w-5 h-5 text-cyan-400 group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>
        
        {/* To Token Output */}
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-zinc-400 font-mono">To</span>
            {isConnected && (
              <span className="text-sm text-zinc-500 font-mono">
                Balance: {swapForm.toToken === 'TKA' && tkaBalance 
                  ? (Number(tkaBalance) / 1e18).toFixed(4)
                  : swapForm.toToken === 'TKB' && tkbBalance
                  ? (Number(tkbBalance) / 1e18).toFixed(4)
                  : '0.0000'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="0.0"
              value={swapForm.toAmount}
              readOnly
              className="flex-1 bg-transparent text-2xl text-white font-mono outline-none"
            />
            <button
              className="flex items-center gap-2 bg-zinc-700 px-4 py-2 rounded-lg cursor-default"
            >
              <span className="text-cyan-400 font-bold font-mono">{swapForm.toToken}</span>
            </button>
          </div>
        </div>
        
        {/* Pool Info */}
        {reserves && reserves[0] > BigInt(0) && reserves[1] > BigInt(0) && (
          <div className="mt-4 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
            <div className="flex justify-between text-sm font-mono mb-1">
              <span className="text-zinc-400">Pool Reserves</span>
            </div>
            <div className="flex justify-between text-sm font-mono">
              <span className="text-zinc-400">TKA</span>
              <span className="text-zinc-300">{(Number(reserves[0]) / 1e18).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-mono">
              <span className="text-zinc-400">TKB</span>
              <span className="text-zinc-300">{(Number(reserves[1]) / 1e18).toFixed(2)}</span>
            </div>
            {swapForm.fromAmount && parseFloat(swapForm.fromAmount) > 0 && (
              <>
                <div className="border-t border-zinc-700 my-2"></div>
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-zinc-400">Rate</span>
                  <span className="text-zinc-300">
                    1 {swapForm.fromToken} ≈ {swapForm.toAmount && swapForm.fromAmount 
                      ? (parseFloat(swapForm.toAmount) / parseFloat(swapForm.fromAmount)).toFixed(4)
                      : '0.0000'} {swapForm.toToken}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-zinc-400">Slippage</span>
                  <span className="text-zinc-300">{swapForm.slippage}%</span>
                </div>
              </>
            )}
          </div>
        )}
        
        {!reserves || reserves[0] === BigInt(0) || reserves[1] === BigInt(0) ? (
          <div className="mt-4 p-3 bg-amber-900/20 rounded-lg border border-amber-500/30">
            <p className="text-sm text-amber-400 font-mono">
              ⚠️ No liquidity in pool. Add liquidity first to enable swaps.
            </p>
          </div>
        ) : null}
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleApprove}
            disabled={isPending || isConfirming || !isConnected || !swapForm.fromAmount}
            className={`flex-1 py-3 rounded-lg font-bold font-mono transition-all ${
              isConnected && swapForm.fromAmount
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
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
            className={`flex-1 py-3 rounded-lg font-bold font-mono transition-all ${
              isConnected && swapForm.fromAmount && reserves && reserves[0] > BigInt(0)
                ? 'bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black'
                : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
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
                Wallet
              </span>
            ) : !swapForm.fromAmount ? (
              'Enter Amount'
            ) : (
              'Swap'
            )}
          </button>
        </div>
        
        {/* Contract Info */}
        <div className="mt-4 p-3 bg-green-900/10 rounded-lg border border-green-500/20">
          <p className="text-xs text-green-400 font-mono mb-2">
            ✅ Connected to deployed contracts on Sepolia
          </p>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-500">SimpleSwap:</span>
              <span className="text-cyan-400">{DEPLOYED_CONTRACTS.SIMPLE_SWAP.slice(0, 10)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">TokenA (TKA):</span>
              <span className="text-cyan-400">{DEPLOYED_CONTRACTS.TOKEN_A.slice(0, 10)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">TokenB (TKB):</span>
              <span className="text-cyan-400">{DEPLOYED_CONTRACTS.TOKEN_B.slice(0, 10)}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
