'use client';

import { ArrowLeftRight, BarChart3, Droplets, Terminal, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  
  const tabs = [
    { id: '/', label: 'SWAP', icon: ArrowLeftRight },
    { id: '/liquidity', label: 'LIQUIDITY', icon: Droplets },
    { id: '/futures', label: 'FUTURES', icon: BarChart3 },
    { id: '/ai', label: 'AI CMD', icon: Terminal },
  ];
  
  return (
    <nav className="flex items-center justify-center gap-2 p-2 bg-zinc-900/50 rounded-xl border border-cyan-500/20 backdrop-blur-sm">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = pathname === id;
        return (
          <Link
            key={id}
            href={id}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-mono font-bold text-sm transition-all ${
              isActive
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500 shadow-lg shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Header() {
  return (
    <header className="flex flex-col items-center gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
          <Zap className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 font-mono">
            CYBER TERMINAL
          </h1>
          <p className="text-sm text-zinc-500 font-mono">
            Web3 Trading Interface • Sepolia Testnet
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-xs text-yellow-500 font-mono">
          TESTNET MODE • Chain ID: 11155111
        </span>
      </div>
    </header>
  );
}
