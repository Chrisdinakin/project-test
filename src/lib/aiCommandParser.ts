import type { AICommandResult, SwapFormState, FuturesFormState } from '@/types/trading';

/**
 * Parse natural language commands into structured trading actions
 * Examples:
 * - "Swap 0.5 ETH for USDC"
 * - "Long ETH with 5x leverage"
 * - "Short BTC 0.1 at 50000"
 */
export function parseAICommand(command: string): AICommandResult {
  const normalizedCommand = command.toLowerCase().trim();
  
  // Try to parse swap commands
  const swapResult = parseSwapCommand(normalizedCommand);
  if (swapResult.parsedSuccessfully) {
    return swapResult;
  }
  
  // Try to parse futures commands
  const futuresResult = parseFuturesCommand(normalizedCommand);
  if (futuresResult.parsedSuccessfully) {
    return futuresResult;
  }
  
  // Unknown command
  return {
    action: 'unknown',
    rawCommand: command,
    parsedSuccessfully: false,
    message: "I couldn't understand that command. Try something like 'Swap 0.5 ETH for USDC' or 'Long ETH with 5x leverage'",
  };
}

function parseSwapCommand(command: string): AICommandResult {
  // Pattern: "swap X ETH for USDC" or "swap X USDC for ETH" or "exchange X ETH to USDC"
  const swapPatterns = [
    /(?:swap|exchange|convert|trade)\s+([\d.]+)\s*(eth|sepolia\s*eth|usdc)\s+(?:for|to|into)\s*(eth|sepolia\s*eth|usdc)/i,
    /(?:buy|get)\s+([\d.]+)\s*(usdc|eth)\s+(?:with|using)\s*(eth|usdc)/i,
  ];
  
  for (const pattern of swapPatterns) {
    const match = command.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      let fromToken = normalizeToken(match[2]);
      let toToken = normalizeToken(match[3]);
      
      // Handle "buy X USDC with ETH" -> swap ETH for USDC
      if (command.includes('buy') || command.includes('get')) {
        [fromToken, toToken] = [toToken, fromToken];
      }
      
      if (!isNaN(amount) && fromToken && toToken && fromToken !== toToken) {
        const swapData: Partial<SwapFormState> = {
          fromToken: fromToken as 'ETH' | 'USDC',
          toToken: toToken as 'ETH' | 'USDC',
          fromAmount: amount.toString(),
        };
        
        return {
          action: 'swap',
          swapData,
          rawCommand: command,
          parsedSuccessfully: true,
          message: `Parsed: Swap ${amount} ${fromToken} for ${toToken}`,
        };
      }
    }
  }
  
  return {
    action: 'unknown',
    rawCommand: command,
    parsedSuccessfully: false,
  };
}

function parseFuturesCommand(command: string): AICommandResult {
  // Pattern: "long/short ETH/BTC with Xx leverage" or "open long/short position on ETH"
  const futuresPatterns = [
    /(long|short)\s+(eth|btc|bitcoin|ethereum)(?:\s+(?:with|at))?\s*(?:([\d.]+)\s*x?\s*(?:leverage)?)?/i,
    /(?:open|create)\s+(?:a\s+)?(long|short)\s+(?:position\s+)?(?:on\s+)?(eth|btc|bitcoin|ethereum)/i,
    /(eth|btc|bitcoin|ethereum)\s+(long|short)(?:\s+([\d.]+)\s*x)?/i,
  ];
  
  for (const pattern of futuresPatterns) {
    const match = command.match(pattern);
    if (match) {
      let position: 'long' | 'short';
      let asset: 'ETH' | 'BTC';
      let leverage = 1;
      
      // Handle different match group orders based on pattern
      if (match[1] === 'long' || match[1] === 'short') {
        position = match[1] as 'long' | 'short';
        asset = normalizeAsset(match[2]);
        leverage = match[3] ? parseFloat(match[3]) : 1;
      } else {
        asset = normalizeAsset(match[1]);
        position = match[2] as 'long' | 'short';
        leverage = match[3] ? parseFloat(match[3]) : 1;
      }
      
      // Extract size if mentioned
      const sizeMatch = command.match(/([\d.]+)\s*(?:eth|btc|size|amount)/i);
      const size = sizeMatch ? sizeMatch[1] : '';
      
      // Extract leverage if mentioned separately
      const leverageMatch = command.match(/(\d+)\s*x\s*(?:leverage)?/i);
      if (leverageMatch) {
        leverage = parseInt(leverageMatch[1], 10);
      }
      
      const futuresData: Partial<FuturesFormState> = {
        asset,
        position,
        leverage: Math.min(Math.max(leverage, 1), 100), // Clamp between 1-100x
        size,
      };
      
      return {
        action: 'futures',
        futuresData,
        rawCommand: command,
        parsedSuccessfully: true,
        message: `Parsed: ${position.toUpperCase()} ${asset} with ${leverage}x leverage`,
      };
    }
  }
  
  return {
    action: 'unknown',
    rawCommand: command,
    parsedSuccessfully: false,
  };
}

function normalizeToken(token: string): 'ETH' | 'USDC' | null {
  const normalized = token.toLowerCase().replace(/\s+/g, '');
  if (normalized === 'eth' || normalized === 'sepoliaeth') {
    return 'ETH';
  }
  if (normalized === 'usdc') {
    return 'USDC';
  }
  return null;
}

function normalizeAsset(asset: string): 'ETH' | 'BTC' {
  const normalized = asset.toLowerCase();
  if (normalized === 'btc' || normalized === 'bitcoin') {
    return 'BTC';
  }
  return 'ETH';
}

/**
 * Generate response message for the AI Commander
 */
export function generateAIResponse(result: AICommandResult): string {
  if (!result.parsedSuccessfully) {
    return result.message || "I couldn't understand that command. Please try again with a clearer instruction.";
  }
  
  if (result.action === 'swap' && result.swapData) {
    const { fromToken, toToken, fromAmount } = result.swapData;
    return `✅ I've populated the swap form:\n` +
           `• From: ${fromAmount || '0'} ${fromToken || 'ETH'}\n` +
           `• To: ${toToken || 'USDC'}\n\n` +
           `Switch to the Swap tab to review and execute the transaction.`;
  }
  
  if (result.action === 'futures' && result.futuresData) {
    const { asset, position, leverage, size } = result.futuresData;
    return `✅ I've set up your futures position:\n` +
           `• Asset: ${asset || 'ETH'}\n` +
           `• Position: ${(position || 'long').toUpperCase()}\n` +
           `• Leverage: ${leverage || 1}x\n` +
           (size ? `• Size: ${size}\n` : '') +
           `\nSwitch to the Futures tab to review and simulate the trade.`;
  }
  
  return "Command processed successfully.";
}
