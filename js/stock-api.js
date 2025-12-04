/**
 * Stock API Service - Clean CORS-Fixed Version
 * Fetches REAL stock prices with minimal console errors
 */

const StockAPI = (function() {
  
  // Best working CORS proxy (prioritize the most reliable)
  const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
  
  // Cache for recent price fetches (avoid redundant API calls)
  const priceCache = new Map();
  const CACHE_DURATION = 60000; // 1 minute
  
  /**
   * Get cached price if available and fresh
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
   * Search stocks dynamically from Yahoo Finance API
   * Returns REAL stocks from NSE/BSE, not hardcoded
   */
  async function searchStocks(query) {
    if (!query || query.length < 2) return [];
    
    try {
      // Yahoo Finance search/autocomplete API
      const apiUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
      const url = CORS_PROXY + encodeURIComponent(apiUrl);
      
      console.log(`🔍 Searching for "${query}"...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response || !response.ok) {
        console.warn('Search API failed');
        return [];
      }
      
      const data = await response.json();
      
      if (!data.quotes || data.quotes.length === 0) {
        console.log(`No results found for "${query}"`);
        return [];
      }
      
      // Filter for Indian stocks only (.NS for NSE, .BO for BSE)
      const stocks = data.quotes
        .filter(quote => {
          const symbol = quote.symbol || '';
          return (symbol.endsWith('.NS') || symbol.endsWith('.BO')) && 
                 quote.quoteType === 'EQUITY'; // Only equity stocks
        })
        .map(quote => {
          const fullSymbol = quote.symbol;
          let cleanSymbol = fullSymbol;
          let exchange = 'NSE';
          
          if (fullSymbol.endsWith('.NS')) {
            cleanSymbol = fullSymbol.replace('.NS', '');
            exchange = 'NSE';
          } else if (fullSymbol.endsWith('.BO')) {
            cleanSymbol = fullSymbol.replace('.BO', '');
            exchange = 'BSE';
          }
          
          return {
            symbol: cleanSymbol,
            name: quote.longname || quote.shortname || cleanSymbol,
            exchange: exchange,
            type: quote.quoteType || 'EQUITY',
            industry: quote.industry || '',
            sector: quote.sector || ''
          };
        })
        .slice(0, 10); // Limit to top 10 results
      
      console.log(`✅ Found ${stocks.length} stocks for "${query}"`);
      return stocks;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Search timed out');
      } else {
        console.error('Search error:', error.message);
      }
      return [];
    }
  }

  /**
   * Fetch stock price with CORS proxy and caching
   */
  async function fetchStockPrice(symbol, exchange) {
    // Check cache first
    const cached = getCachedPrice(symbol, exchange);
    if (cached !== null) {
      return cached;
    }
    
    const suffix = exchange === 'NSE' ? '.NS' : '.BO';
    const fullSymbol = symbol.toUpperCase() + suffix;
    
    console.log(`🔍 Fetching price for ${fullSymbol}...`);
    
    try {
      const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${fullSymbol}?interval=1d&range=1d`;
      const url = CORS_PROXY + encodeURIComponent(apiUrl);
      
      // Use fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.chart?.result?.[0]?.meta) {
        throw new Error('Invalid data structure');
      }
      
      const meta = data.chart.result[0].meta;
      const price = meta.regularMarketPrice || meta.previousClose;
      
      if (!price || price <= 0) {
        throw new Error('Invalid price value');
      }
      
      const finalPrice = parseFloat(price.toFixed(2));
      console.log(`✅ Price fetched: ${symbol} = ₹${finalPrice}`);
      
      // Cache the result
      cachePrice(symbol, exchange, finalPrice);
      
      return finalPrice;
      
    } catch (error) {
      console.error(`❌ Failed to fetch price for ${symbol}: ${error.message}`);
      
      // Provide helpful error message
      throw new Error(
        `Unable to fetch price for ${symbol} on ${exchange}. ` +
        `Please verify the symbol is correct and actively traded. ` +
        `If the issue persists, try again in a few moments.`
      );
    }
  }

  /**
   * Validate stock symbol
   */
  async function validateStock(symbol, exchange) {
    try {
      await fetchStockPrice(symbol, exchange);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Clear price cache (useful for refresh)
   */
  function clearCache() {
    priceCache.clear();
    console.log('🧹 Price cache cleared');
  }

  // Public API
  return {
    fetchStockPrice,
    searchStocks,
    validateStock,
    clearCache
  };
})();