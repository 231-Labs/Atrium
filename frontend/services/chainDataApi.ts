/**
 * Chain data fetching service
 * For fetching BTC, ETH, SUI and other cryptocurrency price and market data
 */

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number; // 24-hour price change percentage
  volume24h: number;
  marketCap: number;
  timestamp: number;
}

/**
 * Global market data
 */
export interface GlobalMarketData {
  totalMarketCap: number;
  totalVolume24h: number;
  marketCapChangePercentage24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCoins: number;
  markets: number;
}

/**
 * Fear and Greed Index data
 */
export interface FearGreedIndex {
  value: number; // 0-100
  valueClassification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: number;
}

/**
 * Trending coin data
 */
export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number;
  priceChangePercentage24h: number;
}

export interface ChainDataSnapshot {
  btc: CryptoPrice;
  eth: CryptoPrice;
  sui: CryptoPrice;
  wal: CryptoPrice; // Walrus Protocol
  globalMarket?: GlobalMarketData;
  trending?: TrendingCoin[];
  fearGreedIndex?: FearGreedIndex;
  timestamp: number;
  aggregatedMetrics: {
    averageChange: number; // Weighted average change (SUI > WAL > BTC > ETH)
    volatility: number; // Volatility indicator
    marketSentiment: 'bullish' | 'bearish' | 'neutral'; // Market sentiment
    marketActivity: 'high' | 'medium' | 'low'; // Market activity level
    trendingStrength: number; // Trending strength 0-10
    fearGreedValue?: number; // Fear and Greed Index value (0-100)
  };
}

class ChainDataApiService {
  private COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private PRICE_CHANGE_API = 'https://api.coinbase.com/v2/prices';
  private FEAR_GREED_API = 'https://api.alternative.me/fng/';
  private cache: ChainDataSnapshot | null = null;
  private cacheExpiry: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5-minute cache

  /**
   * Fetch global market data
   */
  private async fetchGlobalMarketData(): Promise<GlobalMarketData | undefined> {
    try {
      const url = `${this.COINGECKO_API}/global`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn('⚠️ Failed to fetch global market data');
        return undefined;
      }

      const result = await response.json();
      const data = result.data;
      
      return {
        totalMarketCap: data.total_market_cap?.usd || 0,
        totalVolume24h: data.total_volume?.usd || 0,
        marketCapChangePercentage24h: data.market_cap_change_percentage_24h_usd || 0,
        btcDominance: data.market_cap_percentage?.btc || 0,
        ethDominance: data.market_cap_percentage?.eth || 0,
        activeCoins: data.active_cryptocurrencies || 0,
        markets: data.markets || 0,
      };
    } catch (error) {
      console.warn('⚠️ Error fetching global market data:', error);
      return undefined;
    }
  }

  /**
   * Fetch trending coins data
   */
  private async fetchTrendingCoins(): Promise<TrendingCoin[] | undefined> {
    try {
      const url = `${this.COINGECKO_API}/search/trending`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn('⚠️ Failed to fetch trending coins');
        return undefined;
      }

      const result = await response.json();
      const trending = result.coins?.slice(0, 5).map((item: any) => ({
        id: item.item.id,
        name: item.item.name,
        symbol: item.item.symbol,
        marketCapRank: item.item.market_cap_rank || 999,
        priceChangePercentage24h: item.item.data?.price_change_percentage_24h?.usd || 0,
      })) || [];
      
      return trending;
    } catch (error) {
      console.warn('⚠️ Error fetching trending coins:', error);
      return undefined;
    }
  }

  /**
   * Fetch Fear and Greed Index from Alternative.me
   */
  private async fetchFearGreedIndex(): Promise<FearGreedIndex | undefined> {
    try {
      const url = `${this.FEAR_GREED_API}?limit=1`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn('⚠️ Failed to fetch Fear and Greed Index');
        return undefined;
      }

      const result = await response.json();
      const data = result.data?.[0];
      
      if (!data) {
        return undefined;
      }

      const value = parseInt(data.value, 10);
      const classification = data.value_classification as FearGreedIndex['valueClassification'];
      const timestamp = parseInt(data.timestamp, 10) * 1000; // Convert to milliseconds

      return {
        value,
        valueClassification: classification,
        timestamp,
      };
    } catch (error) {
      console.warn('⚠️ Error fetching Fear and Greed Index:', error);
      return undefined;
    }
  }

  /**
   * Fetch cryptocurrency prices from CoinGecko
   */
  private async fetchFromCoinGecko(): Promise<ChainDataSnapshot> {
    try {
      // Note: Walrus CoinGecko ID is 'walrus-2'
      const ids = 'bitcoin,ethereum,sui,walrus-2';
      const url = `${this.COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`;
      
      console.log('🔍 Fetching crypto prices from CoinGecko...');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      
      const btc: CryptoPrice = {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: data.bitcoin?.usd || 0,
        priceChange24h: data.bitcoin?.usd_24h_change || 0,
        volume24h: data.bitcoin?.usd_24h_vol || 0,
        marketCap: data.bitcoin?.usd_market_cap || 0,
        timestamp: Date.now(),
      };

      const eth: CryptoPrice = {
        symbol: 'ETH',
        name: 'Ethereum',
        price: data.ethereum?.usd || 0,
        priceChange24h: data.ethereum?.usd_24h_change || 0,
        volume24h: data.ethereum?.usd_24h_vol || 0,
        marketCap: data.ethereum?.usd_market_cap || 0,
        timestamp: Date.now(),
      };

      const sui: CryptoPrice = {
        symbol: 'SUI',
        name: 'Sui',
        price: data.sui?.usd || 0,
        priceChange24h: data.sui?.usd_24h_change || 0,
        volume24h: data.sui?.usd_24h_vol || 0,
        marketCap: data.sui?.usd_market_cap || 0,
        timestamp: Date.now(),
      };

      const wal: CryptoPrice = {
        symbol: 'WAL',
        name: 'Walrus',
        price: data['walrus-2']?.usd || 0,
        priceChange24h: data['walrus-2']?.usd_24h_change || 0,
        volume24h: data['walrus-2']?.usd_24h_vol || 0,
        marketCap: data['walrus-2']?.usd_market_cap || 0,
        timestamp: Date.now(),
      };

      // Fetch global market, trending coins, and Fear & Greed Index in parallel
      const [globalMarket, trending, fearGreedIndex] = await Promise.all([
        this.fetchGlobalMarketData(),
        this.fetchTrendingCoins(),
        this.fetchFearGreedIndex(),
      ]);

      // Weighted average calculation: SUI (40%) > WAL (30%) > BTC (20%) > ETH (10%)
      const weights = { sui: 0.4, wal: 0.3, btc: 0.2, eth: 0.1 };
      const averageChange = (
        sui.priceChange24h * weights.sui +
        wal.priceChange24h * weights.wal +
        btc.priceChange24h * weights.btc +
        eth.priceChange24h * weights.eth
      );
      
      const volatility = this.calculateVolatility([
        sui.priceChange24h,
        wal.priceChange24h,
        btc.priceChange24h,
        eth.priceChange24h,
      ]);

      const marketSentiment = this.determineMarketSentiment(averageChange, volatility);
      const marketActivity = this.calculateMarketActivity(btc, eth, sui, wal, globalMarket);
      const trendingStrength = this.calculateTrendingStrength(trending);

      const snapshot: ChainDataSnapshot = {
        btc,
        eth,
        sui,
        wal,
        globalMarket,
        trending,
        fearGreedIndex,
        timestamp: Date.now(),
        aggregatedMetrics: {
          averageChange,
          volatility,
          marketSentiment,
          marketActivity,
          trendingStrength,
          fearGreedValue: fearGreedIndex?.value,
        },
      };

      console.log('✅ Chain data fetched successfully:', {
        sui: `$${sui.price.toFixed(4)} (${sui.priceChange24h.toFixed(2)}%)`, // SUI displayed first
        wal: `$${wal.price.toFixed(4)} (${wal.priceChange24h.toFixed(2)}%)`,
        btc: `$${btc.price.toFixed(2)} (${btc.priceChange24h.toFixed(2)}%)`,
        eth: `$${eth.price.toFixed(2)} (${eth.priceChange24h.toFixed(2)}%)`,
        sentiment: marketSentiment,
        activity: marketActivity,
        trending: trendingStrength,
        fearGreed: fearGreedIndex ? `${fearGreedIndex.value} (${fearGreedIndex.valueClassification})` : 'N/A',
      });

      return snapshot;
    } catch (error) {
      console.error('❌ Error fetching from CoinGecko:', error);
      throw error;
    }
  }

  /**
   * Calculate volatility (standard deviation)
   */
  private calculateVolatility(changes: number[]): number {
    const mean = changes.reduce((sum, val) => sum + val, 0) / changes.length;
    const squaredDiffs = changes.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / changes.length;
    return Math.sqrt(variance);
  }

  /**
   * Determine market sentiment
   */
  private determineMarketSentiment(
    averageChange: number,
    volatility: number
  ): 'bullish' | 'bearish' | 'neutral' {
    // If average gain > 5% and volatility not too high, bullish
    if (averageChange > 5 && volatility < 10) {
      return 'bullish';
    }
    // If average drop < -5%, bearish
    if (averageChange < -5) {
      return 'bearish';
    }
    // Otherwise neutral
    return 'neutral';
  }

  /**
   * Calculate market activity level
   */
  private calculateMarketActivity(
    btc: CryptoPrice,
    eth: CryptoPrice,
    sui: CryptoPrice,
    wal: CryptoPrice,
    globalMarket?: GlobalMarketData
  ): 'high' | 'medium' | 'low' {
    // Calculate total volume (weighted)
    const weights = { sui: 0.4, wal: 0.3, btc: 0.2, eth: 0.1 };
    const totalVolume = 
      sui.volume24h * weights.sui +
      wal.volume24h * weights.wal +
      btc.volume24h * weights.btc +
      eth.volume24h * weights.eth;
    
    // If global market data available, use relative volume
    if (globalMarket && globalMarket.totalVolume24h > 0) {
      const volumeRatio = totalVolume / globalMarket.totalVolume24h;
      
      // Ratio of SUI + WAL + BTC + ETH to global volume
      if (volumeRatio > 0.4) return 'high';
      if (volumeRatio > 0.2) return 'medium';
      return 'low';
    }
    
    // Without global data, use absolute volume (in billions USD)
    const volumeInBillions = totalVolume / 1_000_000_000;
    if (volumeInBillions > 50) return 'high';
    if (volumeInBillions > 20) return 'medium';
    return 'low';
  }

  /**
   * Calculate trending strength (0-10)
   */
  private calculateTrendingStrength(trending?: TrendingCoin[]): number {
    if (!trending || trending.length === 0) return 0;
    
    // Calculate average change of trending coins
    const avgChange = trending.reduce((sum, coin) => 
      sum + Math.abs(coin.priceChangePercentage24h), 0
    ) / trending.length;
    
    // Convert to 0-10 strength value
    // Assume 20% average change = max score
    return Math.min(10, (avgChange / 20) * 10);
  }

  /**
   * Get current chain data snapshot (with cache)
   */
  async getChainDataSnapshot(forceRefresh: boolean = false): Promise<ChainDataSnapshot> {
    // Check cache
    const now = Date.now();
    if (!forceRefresh && this.cache && now < this.cacheExpiry) {
      console.log('📦 Returning cached chain data');
      return this.cache;
    }

    // Fetch new data
    const snapshot = await this.fetchFromCoinGecko();
    
    // Update cache
    this.cache = snapshot;
    this.cacheExpiry = now + this.CACHE_DURATION;
    
    return snapshot;
  }

  /**
   * Get single cryptocurrency price
   */
  async getPrice(symbol: 'BTC' | 'ETH' | 'SUI' | 'WAL'): Promise<CryptoPrice> {
    const snapshot = await this.getChainDataSnapshot();
    return snapshot[symbol.toLowerCase() as 'btc' | 'eth' | 'sui' | 'wal'];
  }

  /**
   * Subscribe to price updates (every minute)
   */
  subscribeToUpdates(callback: (snapshot: ChainDataSnapshot) => void): () => void {
    let isActive = true;

    const update = async () => {
      if (!isActive) return;
      
      try {
        const snapshot = await this.getChainDataSnapshot(true);
        callback(snapshot);
      } catch (error) {
        console.error('Error updating chain data:', error);
      }

      if (isActive) {
        setTimeout(update, 60 * 1000); // Update every minute
      }
    };

    // Immediately execute first update
    update();

    // Return unsubscribe function
    return () => {
      isActive = false;
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }
}

export const chainDataApi = new ChainDataApiService();

/**
 * Convenience function: Get chain data
 */
export async function getChainData(forceRefresh?: boolean): Promise<ChainDataSnapshot> {
  return chainDataApi.getChainDataSnapshot(forceRefresh);
}

/**
 * Convenience function: Subscribe to price updates
 */
export function subscribeToChainData(
  callback: (snapshot: ChainDataSnapshot) => void
): () => void {
  return chainDataApi.subscribeToUpdates(callback);
}

