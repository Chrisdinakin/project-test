'use client';

import { create } from 'zustand';
import type { SwapFormState, FuturesFormState, AICommandResult, ChatMessage } from '@/types/trading';

interface TradingStore {
  // Swap form state
  swapForm: SwapFormState;
  setSwapForm: (form: Partial<SwapFormState>) => void;
  resetSwapForm: () => void;
  
  // Futures form state
  futuresForm: FuturesFormState;
  setFuturesForm: (form: Partial<FuturesFormState>) => void;
  resetFuturesForm: () => void;
  
  // AI Commander chat history
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  
  // Process AI command result to populate forms
  processAICommand: (result: AICommandResult) => void;
}

const defaultSwapForm: SwapFormState = {
  fromToken: 'TKA',
  toToken: 'TKB',
  fromAmount: '',
  toAmount: '',
  slippage: 0.5,
};

const defaultFuturesForm: FuturesFormState = {
  asset: 'ETH',
  position: 'long',
  leverage: 1,
  size: '',
  entryPrice: '',
};

export const useTradingStore = create<TradingStore>((set, get) => ({
  // Swap form
  swapForm: defaultSwapForm,
  setSwapForm: (form) => set((state) => ({ 
    swapForm: { ...state.swapForm, ...form } 
  })),
  resetSwapForm: () => set({ swapForm: defaultSwapForm }),
  
  // Futures form
  futuresForm: defaultFuturesForm,
  setFuturesForm: (form) => set((state) => ({ 
    futuresForm: { ...state.futuresForm, ...form } 
  })),
  resetFuturesForm: () => set({ futuresForm: defaultFuturesForm }),
  
  // Chat messages
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({ 
    chatMessages: [...state.chatMessages, message] 
  })),
  clearChatMessages: () => set({ chatMessages: [] }),
  
  // Process AI command and populate appropriate form
  // Note: Navigation is now handled by the AI Commander component
  // using Next.js router.push instead of activeTab state
  processAICommand: (result) => {
    const { setSwapForm, setFuturesForm } = get();
    
    if (result.action === 'swap' && result.swapData) {
      setSwapForm(result.swapData);
    } else if (result.action === 'futures' && result.futuresData) {
      setFuturesForm(result.futuresData);
    }
  },
}));
