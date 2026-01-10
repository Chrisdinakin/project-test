export const TOP_COINS = [
  { symbol: 'BTC', id: 'bitcoin', name: 'Bitcoin' },
  { symbol: 'ETH', id: 'ethereum', name: 'Ethereum' },
  { symbol: 'BNB', id: 'binancecoin', name: 'BNB' },
  { symbol: 'SOL', id: 'solana', name: 'Solana' },
  { symbol: 'XRP', id: 'ripple', name: 'XRP' },
  { symbol: 'ADA', id: 'cardano', name: 'Cardano' },
  { symbol: 'DOGE', id: 'dogecoin', name: 'Dogecoin' },
  { symbol: 'TRX', id: 'tron', name: 'TRON' },
  { symbol: 'TON', id: 'the-open-network', name: 'Toncoin' },
  { symbol: 'LINK', id: 'chainlink', name: 'Chainlink' },
] as const;

export type TopCoinSymbol = typeof TOP_COINS[number]['symbol'];
