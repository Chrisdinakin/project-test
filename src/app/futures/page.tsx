'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { AlertTriangle } from 'lucide-react';
import { AdvancedFuturesSimulator, Navigation, Header } from '@/components';
import { SEPOLIA_CHAIN_ID } from '@/config/wagmi';

export default function FuturesPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  
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
          <div className="mb-6 p-4 bg-[var(--error-muted)] border border-[var(--error)]/20 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
            <div>
              <p className="text-[var(--error)] font-medium">Wrong Network</p>
              <p className="text-[var(--text-secondary)] text-sm">
                Please switch to Ethereum Sepolia
              </p>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div className="mb-8 flex justify-center">
          <Navigation />
        </div>
        
        {/* Main Content - Futures Trading */}
        <main className="pb-16">
          <AdvancedFuturesSimulator />
        </main>
        
        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg-secondary)]/95 border-t border-[var(--border-subtle)] backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--success)] rounded-full"></span>
              Sepolia Testnet
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              Built with Next.js + Wagmi + RainbowKit
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
