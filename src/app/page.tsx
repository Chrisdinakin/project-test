'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { AlertTriangle } from 'lucide-react';
import { SwapInterface, FuturesSimulator, AICommander, Navigation, Header } from '@/components';
import { useTradingStore } from '@/hooks/useTradingStore';
import { SEPOLIA_CHAIN_ID } from '@/config/wagmi';

export default function Home() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { activeTab } = useTradingStore();
  
  const isWrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID;
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Connect Button */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <Header />
          <ConnectButton 
            showBalance={{ smallScreen: false, largeScreen: true }}
            chainStatus="icon"
          />
        </div>
        
        {/* Wrong Network Warning */}
        {isWrongNetwork && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <p className="text-red-400 font-mono font-bold">Wrong Network</p>
              <p className="text-red-400/70 font-mono text-sm">
                Please switch to Ethereum Sepolia (Chain ID: 11155111)
              </p>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div className="mb-8 flex justify-center">
          <Navigation />
        </div>
        
        {/* Main Content */}
        <main className="pb-16">
          {activeTab === 'swap' && <SwapInterface />}
          {activeTab === 'futures' && <FuturesSimulator />}
          {activeTab === 'ai' && <AICommander />}
        </main>
        
        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900/80 border-t border-zinc-800 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-xs text-zinc-500 font-mono">
              <span className="text-cyan-500">●</span> Sepolia Testnet
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              Built with Next.js + Wagmi v2 + RainbowKit
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
