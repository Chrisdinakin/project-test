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
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-muted)] flex items-center justify-center">
              <Terminal className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                AI Commands
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Natural language → Trading actions
              </p>
            </div>
          </div>
          {chatMessages.length > 0 && (
            <button
              onClick={clearChatMessages}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors group"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--error)]" />
            </button>
          )}
        </div>
        
        {/* Chat Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Sparkles className="w-10 h-10 text-[var(--accent)]/40 mb-4" />
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                Type a command to get started
              </p>
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-muted)]">Example commands:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {exampleCommands.slice(0, 3).map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(cmd)}
                      className="px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 transition-colors"
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
                        ? 'bg-[var(--accent-muted)]'
                        : 'bg-[var(--success-muted)]'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-[var(--accent)]" />
                    ) : (
                      <Bot className="w-4 h-4 text-[var(--success)]" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] p-3 rounded-xl text-sm ${
                      message.role === 'user'
                        ? 'bg-[var(--accent-muted)] border border-[var(--accent)]/20 text-[var(--text-primary)]'
                        : 'bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.commandResult && message.commandResult.parsedSuccessfully && (
                      <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                        <span className="text-xs text-[var(--success)]">
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
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--success-muted)]">
                <Bot className="w-4 h-4 text-[var(--success)] animate-pulse" />
              </div>
              <div className="bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command... (e.g., 'Swap 0.5 ETH for USDC')"
              className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-placeholder)]"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className={`px-4 rounded-xl transition-all ${
                input.trim() && !isProcessing
                  ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
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
                className="px-2.5 py-1 bg-[var(--bg-tertiary)]/50 border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors"
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
