'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { AlertTriangle } from 'lucide-react';
import { AddLiquidity, Navigation, Header } from '@/components';
import { SEPOLIA_CHAIN_ID } from '@/config/wagmi';

export default function LiquidityPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const isWrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <Header />
          <ConnectButton
            showBalance={{ smallScreen: false, largeScreen: true }}
            chainStatus="icon"
          />
        </div>

        {isWrongNetwork && (
          <div className="mb-6 p-4 bg-[var(--error-muted)] border border-[var(--error)]/20 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--error)]" />
            <div>
              <p className="text-[var(--error)] font-medium">Wrong Network</p>
              <p className="text-[var(--text-secondary)] text-sm">Please switch to Ethereum Sepolia</p>
            </div>
          </div>
        )}

        <div className="mb-8 flex justify-center">
          <Navigation />
        </div>

        <main className="pb-16">
          <AddLiquidity />
        </main>
      </div>
    </div>
  );
}
