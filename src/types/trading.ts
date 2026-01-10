// Trading types for Swap and Futures interfaces
import type { UTCTimestamp } from 'lightweight-charts';

export interface SwapFormState {
  fromToken: 'TKA' | 'TKB';
  toToken: 'TKA' | 'TKB';
  fromAmount: string;
  toAmount: string;
  slippage: number;
}

export interface FuturesFormState {
  asset: 'ETH' | 'BTC' | 'BNB' | 'SOL' | 'XRP' | 'ADA' | 'DOGE' | 'TRX' | 'TON' | 'LINK';
  position: 'long' | 'short';
  leverage: number;
  size: string;
  entryPrice: string;
}

export interface AICommandResult {
  action: 'swap' | 'futures' | 'unknown';
  swapData?: Partial<SwapFormState>;
  futuresData?: Partial<FuturesFormState>;
  rawCommand: string;
  parsedSuccessfully: boolean;
  message?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  commandResult?: AICommandResult;
}

export interface PriceData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}
