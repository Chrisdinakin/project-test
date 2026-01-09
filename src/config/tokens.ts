// Mock Token Addresses for Sepolia Testnet
// These are placeholder addresses since actual USDC/WBTC don't exist on Sepolia

export const MOCK_TOKENS = {
  // Mock USDC address on Sepolia (placeholder)
  USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as `0x${string}`,
  // Mock WBTC address on Sepolia (placeholder)
  WBTC: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c' as `0x${string}`,
  // Native SepoliaETH (wrapped)
  WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as `0x${string}`,
} as const;

export const TOKEN_DECIMALS = {
  ETH: 18,
  USDC: 6,
  WBTC: 8,
  WETH: 18,
} as const;

export const TOKEN_SYMBOLS = {
  ETH: 'SepoliaETH',
  USDC: 'USDC',
  WBTC: 'WBTC',
  WETH: 'WETH',
} as const;

export type TokenSymbol = keyof typeof TOKEN_DECIMALS;
