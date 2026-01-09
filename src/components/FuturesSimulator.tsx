'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Loader2 } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import toast from 'react-hot-toast';
import { useTradingStore } from '@/hooks/useTradingStore';
import type { PriceData } from '@/types/trading';

// Configuration constants for mock data generation
const MOCK_DATA_CONFIG = {
  ETH_BASE_PRICE: 2000,     // Base ETH price in USD
  BTC_BASE_PRICE: 45000,    // Base BTC price in USD
  VOLATILITY_FACTOR: 0.02,  // 2% volatility per candle
  MIN_PRICE_RATIO: 0.8,     // Price won't go below 80% of base
  CHART_HOURS: 168,         // 7 days * 24 hours of data points
};

// API configuration
const COINGECKO_API_TIMEOUT_MS = 10000; // 10 second timeout

export function FuturesSimulator() {
  const { isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { futuresForm, setFuturesForm } = useTradingStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import('lightweight-charts').createChart> | null>(null);
  
  // Fetch price data from CoinGecko with timeout
  useEffect(() => {
    const fetchPriceData = async () => {
      setIsChartLoading(true);
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), COINGECKO_API_TIMEOUT_MS);
      
      try {
        const coinId = futuresForm.asset === 'ETH' ? 'ethereum' : 'bitcoin';
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=7`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Failed to fetch price data');
        
        const data = await response.json();
        
        // Transform CoinGecko OHLC data to our format
        const formattedData: PriceData[] = data.map((item: number[]) => ({
          time: Math.floor(item[0] / 1000) as import('lightweight-charts').UTCTimestamp, // Convert ms to seconds
          open: item[1],
          high: item[2],
          low: item[3],
          close: item[4],
        }));
        
        setPriceData(formattedData);
        if (formattedData.length > 0) {
          setCurrentPrice(formattedData[formattedData.length - 1].close);
          setFuturesForm({ entryPrice: formattedData[formattedData.length - 1].close.toString() });
        }
      } catch (error) {
        console.error('Error fetching price data:', error);
        // Generate mock data as fallback
        const mockData = generateMockPriceData(futuresForm.asset);
        setPriceData(mockData);
        if (mockData.length > 0) {
          setCurrentPrice(mockData[mockData.length - 1].close);
          setFuturesForm({ entryPrice: mockData[mockData.length - 1].close.toString() });
        }
      } finally {
        setIsChartLoading(false);
      }
    };
    
    fetchPriceData();
    // Refresh price every 60 seconds
    const interval = setInterval(fetchPriceData, 60000);
    return () => clearInterval(interval);
  }, [futuresForm.asset, setFuturesForm]);
  
  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || priceData.length === 0 || isChartLoading) return;
    
    const initChart = async () => {
      const { createChart, ColorType, CandlestickSeries } = await import('lightweight-charts');
      
      // Clean up existing chart
      if (chartRef.current) {
        chartRef.current.remove();
      }
      
      const chart = createChart(chartContainerRef.current!, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { color: 'rgba(34, 211, 238, 0.1)' },
          horzLines: { color: 'rgba(34, 211, 238, 0.1)' },
        },
        width: chartContainerRef.current!.clientWidth,
        height: 300,
        timeScale: {
          borderColor: 'rgba(34, 211, 238, 0.3)',
        },
        rightPriceScale: {
          borderColor: 'rgba(34, 211, 238, 0.3)',
        },
        crosshair: {
          vertLine: {
            color: 'rgba(34, 211, 238, 0.5)',
            labelBackgroundColor: '#22d3ee',
          },
          horzLine: {
            color: 'rgba(34, 211, 238, 0.5)',
            labelBackgroundColor: '#22d3ee',
          },
        },
      });
      
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
      });
      
      candlestickSeries.setData(priceData);
      chart.timeScale().fitContent();
      
      chartRef.current = chart;
      
      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    };
    
    initChart();
    
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [priceData, isChartLoading]);
  
  const handleOpenPosition = async (position: 'long' | 'short') => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!futuresForm.size || parseFloat(futuresForm.size) <= 0) {
      toast.error('Please enter a position size');
      return;
    }
    
    setIsLoading(true);
    setFuturesForm({ position });
    
    try {
      // Mock contract signature
      await signMessageAsync({
        message: `Mock ${position.toUpperCase()} Position:
Asset: ${futuresForm.asset}
Size: ${futuresForm.size}
Leverage: ${futuresForm.leverage}x
Entry Price: $${currentPrice?.toLocaleString() || 'N/A'}`,
      });
      
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-zinc-900 border ${
            position === 'long' ? 'border-green-500/30 shadow-green-500/20' : 'border-red-500/30 shadow-red-500/20'
          } shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {position === 'long' ? (
                  <TrendingUp className="h-6 w-6 text-green-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-400" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium ${position === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                  {position.toUpperCase()} Position Simulated!
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {futuresForm.size} {futuresForm.asset} @ {futuresForm.leverage}x
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Entry: ${currentPrice?.toLocaleString() || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 5000 });
      
    } catch {
      toast.error('Position simulation failed or was rejected');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-zinc-900/80 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-cyan-400 font-mono">
              FUTURES SIMULATOR
            </h2>
          </div>
          {currentPrice && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400 font-mono">{futuresForm.asset}</span>
              <span className="text-lg font-bold text-green-400 font-mono">
                ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
        
        {/* Asset Selector */}
        <div className="flex gap-2 mb-6">
          {(['ETH', 'BTC'] as const).map((asset) => (
            <button
              key={asset}
              onClick={() => setFuturesForm({ asset })}
              className={`px-6 py-2 rounded-lg font-mono font-bold transition-all ${
                futuresForm.asset === asset
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {asset}
            </button>
          ))}
        </div>
        
        {/* Chart */}
        <div className="mb-6 bg-zinc-800/50 rounded-lg border border-zinc-700 p-4">
          {isChartLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div ref={chartContainerRef} className="w-full" />
          )}
        </div>
        
        {/* Trading Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Position Size */}
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <label className="text-sm text-zinc-400 font-mono mb-2 block">
              Position Size ({futuresForm.asset})
            </label>
            <input
              type="number"
              placeholder="0.0"
              value={futuresForm.size}
              onChange={(e) => setFuturesForm({ size: e.target.value })}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white font-mono text-lg outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          
          {/* Leverage */}
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
            <label className="text-sm text-zinc-400 font-mono mb-2 block">
              Leverage: {futuresForm.leverage}x
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={futuresForm.leverage}
              onChange={(e) => setFuturesForm({ leverage: parseInt(e.target.value, 10) })}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-zinc-500 font-mono mt-1">
              <span>1x</span>
              <span>25x</span>
              <span>50x</span>
              <span>75x</span>
              <span>100x</span>
            </div>
          </div>
        </div>
        
        {/* Position Value */}
        {futuresForm.size && currentPrice && (
          <div className="mt-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
              <div>
                <span className="text-zinc-400">Notional</span>
                <p className="text-white">
                  ${(parseFloat(futuresForm.size) * currentPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-zinc-400">Leveraged</span>
                <p className="text-cyan-400">
                  ${(parseFloat(futuresForm.size) * currentPrice * futuresForm.leverage).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-zinc-400">Liq. Price (Long)</span>
                <p className="text-red-400">
                  ${(currentPrice * (1 - 1 / futuresForm.leverage * 0.9)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-zinc-400">Liq. Price (Short)</span>
                <p className="text-red-400">
                  ${(currentPrice * (1 + 1 / futuresForm.leverage * 0.9)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Long/Short Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => handleOpenPosition('long')}
            disabled={isLoading || !isConnected || !futuresForm.size}
            className={`py-4 rounded-lg font-bold font-mono text-lg transition-all flex items-center justify-center gap-2 ${
              isConnected && futuresForm.size
                ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white'
                : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isLoading && futuresForm.position === 'long' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
            LONG
          </button>
          
          <button
            onClick={() => handleOpenPosition('short')}
            disabled={isLoading || !isConnected || !futuresForm.size}
            className={`py-4 rounded-lg font-bold font-mono text-lg transition-all flex items-center justify-center gap-2 ${
              isConnected && futuresForm.size
                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white'
                : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isLoading && futuresForm.position === 'short' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            SHORT
          </button>
        </div>
        
        {/* Warning */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-500/80 font-mono">
            <p className="font-bold">Simulation Mode</p>
            <p className="mt-1">This is a mock futures interface. No real positions are opened. Signatures are used to simulate contract interactions on Sepolia testnet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate mock price data as fallback when API is unavailable
function generateMockPriceData(asset: 'ETH' | 'BTC'): PriceData[] {
  type UTCTimestamp = import('lightweight-charts').UTCTimestamp;
  const { ETH_BASE_PRICE, BTC_BASE_PRICE, VOLATILITY_FACTOR, MIN_PRICE_RATIO, CHART_HOURS } = MOCK_DATA_CONFIG;
  
  const basePrice = asset === 'ETH' ? ETH_BASE_PRICE : BTC_BASE_PRICE;
  const data: PriceData[] = [];
  const now = Math.floor(Date.now() / 1000);
  const hourInSeconds = 3600;
  
  let price = basePrice;
  for (let i = CHART_HOURS; i >= 0; i--) {
    const volatility = basePrice * VOLATILITY_FACTOR;
    const change = (Math.random() - 0.5) * volatility;
    price = Math.max(price + change, basePrice * MIN_PRICE_RATIO);
    
    const open = price;
    const close = price + (Math.random() - 0.5) * volatility * 0.5;
    const high = Math.max(open, close) + Math.random() * volatility * 0.3;
    const low = Math.min(open, close) - Math.random() * volatility * 0.3;
    
    data.push({
      time: (now - i * hourInSeconds) as UTCTimestamp,
      open,
      high,
      low,
      close,
    });
    
    price = close;
  }
  
  return data;
}
