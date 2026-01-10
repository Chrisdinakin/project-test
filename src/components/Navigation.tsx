'use client';

import { ArrowLeftRight, BarChart3, Droplets, Terminal } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  
  const tabs = [
    { id: '/', label: 'Swap', icon: ArrowLeftRight },
    { id: '/liquidity', label: 'Liquidity', icon: Droplets },
    { id: '/futures', label: 'Futures', icon: BarChart3 },
    { id: '/ai', label: 'AI Commands', icon: Terminal },
  ];
  
  return (
    <nav className="flex items-center justify-center">
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)]">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = pathname === id;
          return (
            <Link
              key={id}
              href={id}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Header() {
  return (
    <header className="flex flex-col items-center gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent-muted)] flex items-center justify-center">
          <svg className="w-6 h-6 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            DeFi Terminal
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Trading Interface • Sepolia Testnet
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--warning-muted)] rounded-full">
        <span className="w-2 h-2 bg-[var(--warning)] rounded-full animate-pulse" />
        <span className="text-xs text-[var(--warning)] font-medium">
          Testnet Mode
        </span>
      </div>
    </header>
  );
}
