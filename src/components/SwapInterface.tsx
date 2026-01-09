'use client';

import { useState, useEffect } from 'react';
import { ArrowDownUp, Settings, Wallet, Loader2, CheckCircle } from 'lucide-react';
import { useAccount, useBalance, useSignMessage } from 'wagmi';
import { formatEther } from 'viem';
import toast from 'react-hot-toast';
import { useTradingStore } from '@/hooks/useTradingStore';

// Mock exchange rate: 1 ETH = 2000 USDC
const MOCK_ETH_PRICE = 2000;

export function SwapInterface() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { signMessageAsync } = useSignMessage();
  
  const { swapForm, setSwapForm } = useTradingStore();
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Calculate output amount based on input
  useEffect(() => {
    if (swapForm.fromAmount && !isNaN(parseFloat(swapForm.fromAmount))) {
      const inputAmount = parseFloat(swapForm.fromAmount);
      let outputAmount: number;
      
      if (swapForm.fromToken === 'ETH') {
        outputAmount = inputAmount * MOCK_ETH_PRICE;
      } else {
        outputAmount = inputAmount / MOCK_ETH_PRICE;
      }
      
      // Apply slippage
      outputAmount = outputAmount * (1 - swapForm.slippage / 100);
      setSwapForm({ toAmount: outputAmount.toFixed(swapForm.toToken === 'USDC' ? 2 : 6) });
    } else {
      setSwapForm({ toAmount: '' });
    }
  }, [swapForm.fromAmount, swapForm.fromToken, swapForm.toToken, swapForm.slippage, setSwapForm]);
  
  const handleSwapTokens = () => {
    setSwapForm({
      fromToken: swapForm.toToken,
      toToken: swapForm.fromToken,
      fromAmount: swapForm.toAmount,
      toAmount: swapForm.fromAmount,
    });
  };
  
  const handleSwap = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!swapForm.fromAmount || parseFloat(swapForm.fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsSwapping(true);
    
    try {
      // Mock swap by signing a message (simulates contract interaction)
      await signMessageAsync({
        message: `Mock Swap: ${swapForm.fromAmount} ${swapForm.fromToken} -> ${swapForm.toAmount} ${swapForm.toToken}`,
      });
      
      // Show success toast (mock success since there's no real liquidity)
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
                  Swap Simulated Successfully!
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {swapForm.fromAmount} {swapForm.fromToken} → {swapForm.toAmount} {swapForm.toToken}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  (Mock transaction - no actual liquidity on Sepolia)
                </p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 5000 });
      
      // Reset form after successful swap
      setSwapForm({ fromAmount: '', toAmount: '' });
    } catch {
      toast.error('Swap failed or was rejected');
    } finally {
      setIsSwapping(false);
    }
  };
  
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
            {isConnected && swapForm.fromToken === 'ETH' && ethBalance && (
              <span className="text-sm text-zinc-500 font-mono">
                Balance: {parseFloat(formatEther(ethBalance.value)).toFixed(4)}
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
            <button
              className="flex items-center gap-2 bg-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-600 transition-colors"
            >
              <span className="text-cyan-400 font-bold font-mono">{swapForm.fromToken}</span>
            </button>
          </div>
          {isConnected && swapForm.fromToken === 'ETH' && ethBalance && (
            <button
              onClick={() => setSwapForm({ fromAmount: formatEther(ethBalance.value) })}
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
              className="flex items-center gap-2 bg-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-600 transition-colors"
            >
              <span className="text-cyan-400 font-bold font-mono">{swapForm.toToken}</span>
            </button>
          </div>
        </div>
        
        {/* Rate Info */}
        {swapForm.fromAmount && parseFloat(swapForm.fromAmount) > 0 && (
          <div className="mt-4 p-3 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
            <div className="flex justify-between text-sm font-mono">
              <span className="text-zinc-400">Rate</span>
              <span className="text-zinc-300">
                1 ETH = {MOCK_ETH_PRICE.toLocaleString()} USDC
              </span>
            </div>
            <div className="flex justify-between text-sm font-mono mt-1">
              <span className="text-zinc-400">Slippage</span>
              <span className="text-zinc-300">{swapForm.slippage}%</span>
            </div>
          </div>
        )}
        
        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={isSwapping || !isConnected || !swapForm.fromAmount}
          className={`w-full mt-6 py-4 rounded-lg font-bold font-mono text-lg transition-all ${
            isConnected && swapForm.fromAmount
              ? 'bg-gradient-to-r from-cyan-500 to-green-500 hover:from-cyan-400 hover:to-green-400 text-black'
              : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
          }`}
        >
          {isSwapping ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Swapping...
            </span>
          ) : !isConnected ? (
            <span className="flex items-center justify-center gap-2">
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </span>
          ) : !swapForm.fromAmount ? (
            'Enter Amount'
          ) : (
            'Swap'
          )}
        </button>
        
        {/* Mock Notice */}
        <p className="mt-4 text-xs text-center text-zinc-500 font-mono">
          ⚠️ Mock interface - No real liquidity pools on Sepolia
        </p>
      </div>
    </div>
  );
}
