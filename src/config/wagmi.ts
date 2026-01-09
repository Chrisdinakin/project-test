import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// Enforce Ethereum Sepolia (Chain ID 11155111) strictly
export const config = getDefaultConfig({
  appName: 'Cyber Terminal dApp',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project',
  chains: [sepolia], // Only Sepolia network
  ssr: true,
});

// Chain ID for Sepolia
export const SEPOLIA_CHAIN_ID = 11155111;
