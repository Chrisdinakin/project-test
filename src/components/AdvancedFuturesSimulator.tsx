'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Loader2, BarChart2, Maximize2 } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import toast from 'react-hot-toast';
import { useTradingStore } from '@/hooks/useTradingStore';
import type { PriceData } from '@/types/trading';
import type { 
  IChartApi, 
  ISeriesApi, 
  CandlestickSeriesPartialOptions,
  LineSeriesPartialOptions,
  HistogramSeriesPartialOptions,
  UTCTimestamp
} from 'lightweight-charts';

// Configuration constants for mock data generation
const MOCK_DATA_CONFIG = {
  ETH_BASE_PRICE: 2000,
  BTC_BASE_PRICE: 45000,
  VOLATILITY_FACTOR: 0.02,
  MIN_PRICE_RATIO: 0.8,
  CHART_HOURS: 168,
  VOLUME_BASE: 500000,
  VOLUME_VARIATION: 1000000,
};

// API configuration
const COINGECKO_API_TIMEOUT_MS = 10000;

// Timeframe options
const TIMEFRAMES = [
  { label: '1H', value: '1', days: 1 },
  { label: '4H', value: '4', days: 2 },
  { label: '1D', value: '24', days: 7 },
  { label: '1W', value: '168', days: 30 },
  { label: '1M', value: '720', days: 90 },
];

type Timeframe = typeof TIMEFRAMES[number];

// Chart types
const CHART_TYPES = [
  { label: 'Candles', value: 'candlestick' },
  { label: 'Line', value: 'line' },
  { label: 'Area', value: 'area' },
];

interface VolumeData {
  time: UTCTimestamp;
  value: number;
  color: string;
}

export function AdvancedFuturesSimulator() {
  const { isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { futuresForm, setFuturesForm } = useTradingStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(TIMEFRAMES[2]);
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');
  const [showVolume, setShowVolume] = useState(true);
  const [showMA, setShowMA] = useState(false);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const maSeriesRef = useRef<ISeriesApi<any> | null>(null);
  
  // Fetch price data
  useEffect(() => {
    const fetchPriceData = async () => {
      setIsChartLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), COINGECKO_API_TIMEOUT_MS);
      
      try {
        const coinId = futuresForm.asset === 'ETH' ? 'ethereum' : 'bitcoin';
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${selectedTimeframe.days}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Failed to fetch price data');
        
        const data = await response.json();
        
        const formattedData: PriceData[] = data.map((item: number[]) => ({
          time: Math.floor(item[0] / 1000) as UTCTimestamp,
          open: item[1],
          high: item[2],
          low: item[3],
          close: item[4],
        }));
        
        // Generate volume data
        const volumes: VolumeData[] = formattedData.map((d, i) => ({
          time: d.time,
          value: Math.random() * MOCK_DATA_CONFIG.VOLUME_VARIATION + MOCK_DATA_CONFIG.VOLUME_BASE,
          color: i > 0 && d.close >= formattedData[i - 1].close ? '#22c55e' : '#ef4444',
        }));
        
        setPriceData(formattedData);
        setVolumeData(volumes);
        
        if (formattedData.length > 0) {
          const latest = formattedData[formattedData.length - 1].close;
          const first = formattedData[0].close;
          setCurrentPrice(latest);
          // Note: Price change is calculated for the selected timeframe period, not strictly 24h
          setPriceChange24h(((latest - first) / first) * 100);
          setFuturesForm({ entryPrice: latest.toString() });
        }
      } catch (error) {
        console.error('Error fetching price data:', error);
        const mockData = generateMockPriceData(futuresForm.asset);
        const volumes: VolumeData[] = mockData.map((d, i) => ({
          time: d.time,
          value: Math.random() * MOCK_DATA_CONFIG.VOLUME_VARIATION + MOCK_DATA_CONFIG.VOLUME_BASE,
          color: i > 0 && d.close >= mockData[i - 1].close ? '#22c55e' : '#ef4444',
        }));
        setPriceData(mockData);
        setVolumeData(volumes);
        if (mockData.length > 0) {
          setCurrentPrice(mockData[mockData.length - 1].close);
          setFuturesForm({ entryPrice: mockData[mockData.length - 1].close.toString() });
        }
      } finally {
        setIsChartLoading(false);
      }
    };
    
    fetchPriceData();
    const interval = setInterval(fetchPriceData, 60000);
    return () => clearInterval(interval);
  }, [futuresForm.asset, selectedTimeframe, setFuturesForm]);
  
  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || priceData.length === 0 || isChartLoading) return;
    
    const initChart = async () => {
      const { createChart, ColorType, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } = 
        await import('lightweight-charts');
      
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
        height: 400,
        timeScale: {
          borderColor: 'rgba(34, 211, 238, 0.3)',
          timeVisible: true,
          secondsVisible: false,
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
      
      // Add main price series
      if (chartType === 'candlestick') {
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderDownColor: '#ef4444',
          borderUpColor: '#22c55e',
          wickDownColor: '#ef4444',
          wickUpColor: '#22c55e',
        } as CandlestickSeriesPartialOptions);
        candleSeries.setData(priceData);
        mainSeriesRef.current = candleSeries;
      } else if (chartType === 'line') {
        const lineSeries = chart.addSeries(LineSeries, {
          color: '#22d3ee',
          lineWidth: 2,
        } as LineSeriesPartialOptions);
        const lineData = priceData.map(d => ({ time: d.time, value: d.close }));
        lineSeries.setData(lineData);
        mainSeriesRef.current = lineSeries;
      } else {
        const areaSeries = chart.addSeries(AreaSeries, {
          topColor: 'rgba(34, 211, 238, 0.4)',
          bottomColor: 'rgba(34, 211, 238, 0.0)',
          lineColor: '#22d3ee',
          lineWidth: 2,
        } as LineSeriesPartialOptions);
        const areaData = priceData.map(d => ({ time: d.time, value: d.close }));
        areaSeries.setData(areaData);
        mainSeriesRef.current = areaSeries;
      }
      
      // Add volume series
      if (showVolume && volumeData.length > 0) {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
        } as HistogramSeriesPartialOptions);
        volumeSeries.setData(volumeData);
        volumeSeriesRef.current = volumeSeries;
        
        chart.priceScale('volume').applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
      }
      
      // Add moving average
      if (showMA) {
        const maSeries = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 1,
        } as LineSeriesPartialOptions);
        const maData = calculateMA(priceData, 20);
        maSeries.setData(maData);
        maSeriesRef.current = maSeries;
      }
      
      chart.timeScale().fitContent();
      chartRef.current = chart;
      
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
  }, [priceData, volumeData, isChartLoading, chartType, showVolume, showMA]);
  
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
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-zinc-900/80 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-cyan-400 font-mono">
              ADVANCED FUTURES SIMULATOR
            </h2>
          </div>
          {currentPrice && (
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-zinc-400 font-mono block">{futuresForm.asset}/USD</span>
                <span className="text-2xl font-bold text-cyan-400 font-mono">
                  ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className={`text-sm font-mono px-2 py-1 rounded ${
                priceChange24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </div>
            </div>
          )}
        </div>
        
        {/* Asset & Timeframe Selectors */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex gap-2">
            {(['ETH', 'BTC'] as const).map((asset) => (
              <button
                key={asset}
                onClick={() => setFuturesForm({ asset })}
                className={`px-4 py-2 rounded-lg font-mono font-bold transition-all ${
                  futuresForm.asset === asset
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
                }`}
              >
                {asset}
              </button>
            ))}
          </div>
          
          <div className="flex gap-1 ml-auto">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-2 rounded font-mono text-sm transition-all ${
                  selectedTimeframe.value === tf.value
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Chart Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.value}
              onClick={() => setChartType(ct.value as any)}
              className={`px-3 py-1 rounded text-sm font-mono transition-all ${
                chartType === ct.value
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {ct.label}
            </button>
          ))}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-3 py-1 rounded text-sm font-mono transition-all flex items-center gap-1 ${
              showVolume
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            Volume
          </button>
          <button
            onClick={() => setShowMA(!showMA)}
            className={`px-3 py-1 rounded text-sm font-mono transition-all ${
              showMA
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500'
            }`}
          >
            MA(20)
          </button>
        </div>
        
        {/* Chart */}
        <div className="mb-6 bg-zinc-800/50 rounded-lg border border-zinc-700 p-4">
          {isChartLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div ref={chartContainerRef} className="w-full" />
          )}
        </div>
        
        {/* Trading Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        
        {/* Position Stats */}
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
            <p className="font-bold">Advanced Simulation Mode</p>
            <p className="mt-1">Enhanced charts with multiple timeframes, technical indicators, and chart types. No real positions are opened.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Calculate simple moving average
function calculateMA(data: PriceData[], period: number) {
  const result: Array<{ time: UTCTimestamp; value: number }> = [];
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: data[i].time,
      value: sum / period,
    });
  }
  
  return result;
}

// Generate mock price data as fallback
function generateMockPriceData(asset: 'ETH' | 'BTC'): PriceData[] {
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
