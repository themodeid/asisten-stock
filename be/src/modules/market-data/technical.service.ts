import yahooFinance from 'yahoo-finance2';
import { formatTicker } from '../../utils/stockHelper';

export interface TechnicalIndicators {
  ticker: string;
  timeframe: string;
  current_price: number;
  rsi: { value: number; signal: 'Oversold' | 'Neutral' | 'Overbought'; description: string };
  macd: { macd_line: number; signal_line: number; histogram: number; signal: 'Bullish' | 'Bearish' | 'Neutral'; description: string };
  moving_averages: {
    sma_20: number;
    sma_50: number;
    sma_200: number;
    price_vs_sma20: string;
    price_vs_sma50: string;
    price_vs_sma200: string;
    golden_cross: boolean;
    death_cross: boolean;
  };
  bollinger_bands: {
    upper: number;
    middle: number;
    lower: number;
    position: 'Above Upper' | 'Near Upper' | 'Middle' | 'Near Lower' | 'Below Lower';
  };
  support_resistance: {
    support_1: number;
    resistance_1: number;
  };
  overall_signal: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  summary: string;
}

export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(prices.length - period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  const emas = [];
  
  let initialSma = 0;
  for (let i = 0; i < period; i++) {
    initialSma += prices[i];
  }
  initialSma /= period;
  emas.push(initialSma);
  
  for (let i = period; i < prices.length; i++) {
    const prevEma: number = emas[emas.length - 1];
    const currentEma: number = (prices[i] - prevEma) * k + prevEma;
    emas.push(currentEma);
  }
  return emas;
}

export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateMACD(prices: number[]) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  if (ema26.length === 0) return { macd_line: 0, signal_line: 0, histogram: 0 };
  
  const macdLineArr = [];
  for (let i = 0; i < ema26.length; i++) {
    const e12 = ema12[ema12.length - ema26.length + i];
    macdLineArr.push(e12 - ema26[i]);
  }
  
  const signalLineArr = calculateEMA(macdLineArr, 9);
  if (signalLineArr.length === 0) return { macd_line: 0, signal_line: 0, histogram: 0 };
  
  const macdLine = macdLineArr[macdLineArr.length - 1];
  const signalLine = signalLineArr[signalLineArr.length - 1];
  
  return {
    macd_line: macdLine,
    signal_line: signalLine,
    histogram: macdLine - signalLine
  };
}

export function calculateBollingerBands(prices: number[], period = 20) {
  if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };
  
  const slice = prices.slice(prices.length - period);
  const sma = calculateSMA(slice, period);
  
  let sumSquaredDiff = 0;
  for (let i = 0; i < slice.length; i++) {
    sumSquaredDiff += Math.pow(slice[i] - sma, 2);
  }
  
  const stdDev = Math.sqrt(sumSquaredDiff / period);
  
  return {
    upper: sma + stdDev * 2,
    middle: sma,
    lower: sma - stdDev * 2
  };
}

/**
 * Get technical analysis for a given ticker
 */
export async function getTechnicalAnalysis(ticker: string, timeframe = '3M'): Promise<TechnicalIndicators> {
  const formattedTicker = formatTicker(ticker);
  
  const endDate = new Date();
  
  // Fetch at least 1 year back for proper SMA200 calculation
  const fetchStartDate = new Date(endDate);
  fetchStartDate.setFullYear(fetchStartDate.getFullYear() - 1);

  const historicalData = await yahooFinance.historical(formattedTicker, {
    period1: fetchStartDate,
    period2: endDate,
  });

  if (!historicalData || historicalData.length === 0) {
    throw new Error(`Data histori untuk ${ticker} tidak ditemukan.`);
  }

  const prices = historicalData.map(h => h.close).filter(p => p != null) as number[];
  const highPrices = historicalData.map(h => h.high).filter(p => p != null) as number[];
  const lowPrices = historicalData.map(h => h.low).filter(p => p != null) as number[];
  
  const current_price = prices[prices.length - 1];

  const rsiValue = calculateRSI(prices, 14);
  let rsiSignal: 'Oversold' | 'Neutral' | 'Overbought' = 'Neutral';
  let rsiDesc = 'Netral';
  if (rsiValue > 70) {
    rsiSignal = 'Overbought';
    rsiDesc = 'Overbought (Rawan koreksi)';
  } else if (rsiValue < 30) {
    rsiSignal = 'Oversold';
    rsiDesc = 'Oversold (Potensi rebound)';
  }

  const macdData = calculateMACD(prices);
  let macdSignal: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  if (macdData.histogram > 0 && macdData.macd_line > macdData.signal_line) macdSignal = 'Bullish';
  else if (macdData.histogram < 0 && macdData.macd_line < macdData.signal_line) macdSignal = 'Bearish';
  
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);

  const bb = calculateBollingerBands(prices, 20);
  let bbPosition: 'Above Upper' | 'Near Upper' | 'Middle' | 'Near Lower' | 'Below Lower' = 'Middle';
  
  if (current_price > bb.upper) bbPosition = 'Above Upper';
  else if (current_price < bb.lower) bbPosition = 'Below Lower';
  else if (Math.abs(current_price - bb.upper) / current_price < 0.02) bbPosition = 'Near Upper';
  else if (Math.abs(current_price - bb.lower) / current_price < 0.02) bbPosition = 'Near Lower';

  const recentHigh = Math.max(...highPrices.slice(-20));
  const recentLow = Math.min(...lowPrices.slice(-20));
  
  let bullishCount = 0;
  let bearishCount = 0;

  if (rsiSignal === 'Oversold') bullishCount++;
  if (rsiSignal === 'Overbought') bearishCount++;

  if (macdSignal === 'Bullish') bullishCount++;
  if (macdSignal === 'Bearish') bearishCount++;

  if (current_price > sma50) bullishCount++;
  else if (current_price < sma50 && sma50 !== 0) bearishCount++;
  
  let overallSignal: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell' = 'Neutral';
  
  if (bullishCount >= 3) overallSignal = 'Strong Buy';
  else if (bullishCount === 2) overallSignal = 'Buy';
  else if (bearishCount >= 3) overallSignal = 'Strong Sell';
  else if (bearishCount === 2) overallSignal = 'Sell';

  const summary = `RSI di zona ${rsiDesc.toLowerCase().replace(/\(.+\)/, '').trim()} (${rsiValue.toFixed(1)}), MACD menunjukkan momentum ${macdSignal.toLowerCase()}, harga ${current_price > sma50 ? 'di atas' : 'di bawah'} SMA 50${sma200 > 0 ? ` dan ${current_price > sma200 ? 'di atas' : 'di bawah'} SMA 200` : ''}. Sinyal keseluruhan: ${overallSignal.toUpperCase()}.`;

  return {
    ticker,
    timeframe,
    current_price,
    rsi: {
      value: rsiValue,
      signal: rsiSignal,
      description: rsiDesc
    },
    macd: {
      macd_line: macdData.macd_line,
      signal_line: macdData.signal_line,
      histogram: macdData.histogram,
      signal: macdSignal,
      description: `Momentum ${macdSignal.toLowerCase()}`
    },
    moving_averages: {
      sma_20: sma20,
      sma_50: sma50,
      sma_200: sma200,
      price_vs_sma20: current_price > sma20 ? 'Above' : 'Below',
      price_vs_sma50: current_price > sma50 ? 'Above' : 'Below',
      price_vs_sma200: current_price > sma200 ? 'Above' : 'Below',
      golden_cross: sma50 > sma200 && (sma50 - sma200) / sma200 < 0.05,
      death_cross: sma50 < sma200 && (sma200 - sma50) / sma200 < 0.05
    },
    bollinger_bands: {
      upper: bb.upper,
      middle: bb.middle,
      lower: bb.lower,
      position: bbPosition
    },
    support_resistance: {
      support_1: recentLow,
      resistance_1: recentHigh
    },
    overall_signal: overallSignal,
    summary
  };
}
