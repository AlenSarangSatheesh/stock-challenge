/**
 * Stock API Service - Simple Price Fetching Only
 * Users type symbols manually, we fetch real prices
 */

const StockAPI = (function() {
  
  // Cache for prices (avoid repeated API calls)
  const priceCache = new Map();
  const CACHE_DURATION = 60000; // 1 minute
  
  /**
   * Get cached price if available
   */
  function getCachedPrice(symbol, exchange) {
    const key = `${symbol}-${exchange}`;
    const cached = priceCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 Using cached price for ${symbol}: ₹${cached.price}`);
      return cached.price;
    }
    return null;
  }
  
  /**
   * Cache a price
   */
  function cachePrice(symbol, exchange, price) {
    const key = `${symbol}-${exchange}`;
    priceCache.set(key, {
      price: price,
      timestamp: Date.now()
    });
  }
  
  /**
   * Fetch REAL stock price from Yahoo Finance
   * Accepts symbols in any case (converts to uppercase)
   */
  async function fetchStockPrice(symbol, exchange) {
    // Normalize symbol to uppercase
    symbol = symbol.toUpperCase().trim();
    
    // Check cache first
    const cached = getCachedPrice(symbol, exchange);
    if (cached !== null) {
      return cached;
    }
    
    const suffix = exchange === 'NSE' ? '.NS' : '.BO';
    const fullSymbol = symbol + suffix;
    
    console.log(`🔍 Fetching real price for ${fullSymbol}...`);
    
    try {
      // Direct Yahoo Finance API call (no CORS proxy needed for chart endpoint)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${fullSymbol}?interval=1d&range=1d`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate response
      if (!data.chart?.result?.[0]?.meta) {
        throw new Error('Invalid API response');
      }
      
      const meta = data.chart.result[0].meta;
      
      // Get current price or previous close
      const price = meta.regularMarketPrice || meta.previousClose;
      
      if (!price || price <= 0) {
        throw new Error('Invalid price value');
      }
      
      const finalPrice = parseFloat(price.toFixed(2));
      console.log(`✅ Real price fetched: ${symbol} = ₹${finalPrice}`);
      
      // Cache the price
      cachePrice(symbol, exchange, finalPrice);
      
      return finalPrice;
      
    } catch (error) {
      console.error(`❌ Failed to fetch price for ${symbol}:`, error.message);
      
      // User-friendly error message
      let errorMsg = `Could not fetch price for ${symbol} on ${exchange}. `;
      
      if (error.name === 'AbortError') {
        errorMsg += 'Request timed out. Please try again.';
      } else if (error.message.includes('404')) {
        errorMsg += 'Stock not found. Please verify the symbol is correct.';
      } else {
        errorMsg += 'Please check: 1) Symbol is correct, 2) Stock is listed on ' + exchange + ', 3) Market might be closed.';
      }
      
      throw new Error(errorMsg);
    }
  }
  
  /**
   * Clear price cache (useful before refresh)
   */
  function clearCache() {
    priceCache.clear();
    console.log('🧹 Price cache cleared');
  }

  // Public API
  return {
    fetchStockPrice,
    clearCache
  };
})();