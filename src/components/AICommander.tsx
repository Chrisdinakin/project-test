'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Terminal, Sparkles, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTradingStore } from '@/hooks/useTradingStore';
import { parseAICommand, generateAIResponse } from '@/lib/aiCommandParser';
import type { ChatMessage } from '@/types/trading';

export function AICommander() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { chatMessages, addChatMessage, clearChatMessages, processAICommand } = useTradingStore();
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    addChatMessage(userMessage);
    setInput('');
    setIsProcessing(true);
    
    // Simulate processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Parse the command
    const commandResult = parseAICommand(userMessage.content);
    
    // Generate response with updated navigation message
    let responseContent = generateAIResponse(commandResult);
    if (commandResult.parsedSuccessfully) {
      if (commandResult.action === 'swap') {
        responseContent = responseContent.replace('Switch to the Swap tab', 'Navigate to the Swap page');
      } else if (commandResult.action === 'futures') {
        responseContent = responseContent.replace('Switch to the Futures tab', 'Navigate to the Futures page');
      }
    }
    
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      commandResult,
    };
    
    addChatMessage(assistantMessage);
    
    // If command was parsed successfully, populate the form
    if (commandResult.parsedSuccessfully) {
      processAICommand(commandResult);
      
      // Navigate immediately after processing
      if (commandResult.action === 'swap') {
        router.push('/');
      } else if (commandResult.action === 'futures') {
        router.push('/futures');
      }
    }
    
    setIsProcessing(false);
  };
  
  const exampleCommands = [
    'Swap 0.5 ETH for USDC',
    'Exchange 100 USDC to ETH',
    'Long ETH with 10x leverage',
    'Short BTC 0.1',
    'Open long position on Ethereum',
  ];
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-zinc-900/80 border border-cyan-500/20 rounded-xl backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-400 font-mono">
                AI COMMANDER
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                Natural language → Trading actions
              </p>
            </div>
          </div>
          {chatMessages.length > 0 && (
            <button
              onClick={clearChatMessages}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4 text-zinc-500 group-hover:text-red-400" />
            </button>
          )}
        </div>
        
        {/* Chat Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Sparkles className="w-12 h-12 text-cyan-500/50 mb-4" />
              <p className="text-zinc-400 font-mono text-sm mb-4">
                Type a command to get started
              </p>
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 font-mono">Example commands:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {exampleCommands.slice(0, 3).map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(cmd)}
                      className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-cyan-400 font-mono hover:border-cyan-500/50 transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-cyan-500/20'
                        : 'bg-green-500/20'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg font-mono text-sm ${
                      message.role === 'user'
                        ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-100'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.commandResult && message.commandResult.parsedSuccessfully && (
                      <div className="mt-2 pt-2 border-t border-zinc-700">
                        <span className="text-xs text-green-400">
                          ✓ Form populated - Navigating to {message.commandResult.action} page...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
          
          {isProcessing && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/20">
                <Bot className="w-4 h-4 text-green-400 animate-pulse" />
              </div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command... (e.g., 'Swap 0.5 ETH for USDC')"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono text-sm outline-none focus:border-cyan-500 transition-colors placeholder:text-zinc-500"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className={`px-4 rounded-lg transition-all ${
                input.trim() && !isProcessing
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black'
                  : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Quick Commands */}
          <div className="mt-3 flex flex-wrap gap-2">
            {exampleCommands.map((cmd, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(cmd)}
                className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded text-xs text-zinc-500 font-mono hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
