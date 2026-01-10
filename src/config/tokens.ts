// Mock Token Addresses for Sepolia Testnet
// ✅ These are REAL deployed contracts on Sepolia testnet
// Deployed tokens can be used for actual transactions and testing

export const MOCK_TOKENS = {
  // TokenA (TKA) - Deployed MockToken on Sepolia
  TKA: '0xF64f05F486155fAc6Cb36750Ef530f839f3ab9A0' as `0x${string}`,
  // TokenB (TKB) - Deployed MockToken on Sepolia  
  TKB: '0xBD0d58F20A8c3F99Eaf282ec81e687dA14813754' as `0x${string}`,
  // Native SepoliaETH (wrapped) - Real Sepolia WETH address
  WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as `0x${string}`,
} as const;

export const TOKEN_DECIMALS = {
  ETH: 18,
  TKA: 18,
  TKB: 18,
  WETH: 18,
} as const;

export const TOKEN_SYMBOLS = {
  ETH: 'SepoliaETH',
  TKA: 'Token A',
  TKB: 'Token B',
  WETH: 'WETH',
} as const;

export type TokenSymbol = keyof typeof TOKEN_DECIMALS;
