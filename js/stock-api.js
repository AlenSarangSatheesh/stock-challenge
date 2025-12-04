/**
 * Stock API Service - CORS-Free Version
 * Uses multiple fallback methods to fetch real stock data
 */

const StockAPI = (function() {
  
  // Cache for recent searches and prices
  const searchCache = new Map();
  const priceCache = new Map();
  const CACHE_DURATION = 60000; // 1 minute
  
  /**
   * Search stocks using Yahoo Finance with CORS proxy
   * This searches ALL NSE/BSE stocks dynamically
   */
  async function searchStocks(query) {
    if (!query || query.length < 2) return [];
    
    // Check cache first
    const cached = searchCache.get(query.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 Using cached search results for "${query}"`);
      return cached.results;
    }
    
    try {
      // Use allorigins.win as CORS proxy (most reliable)
      const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0&enableFuzzyQuery=false`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(searchUrl)}`;
      
      console.log(`🔍 Searching for "${query}"...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.quotes || data.quotes.length === 0) {
        console.log(`No results found for "${query}"`);
        return [];
      }
      
      // Filter for Indian stocks (.NS for NSE, .BO for BSE)
      const stocks = data.quotes
        .filter(quote => {
          const symbol = quote.symbol || '';
          return (symbol.endsWith('.NS') || symbol.endsWith('.BO')) && 
                 (quote.quoteType === 'EQUITY' || !quote.quoteType);
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
            industry: quote.industry || ''
          };
        })
        .slice(0, 10); // Top 10 results
      
      console.log(`✅ Found ${stocks.length} stocks for "${query}"`);
      
      // Cache the results
      searchCache.set(query.toLowerCase(), {
        results: stocks,
        timestamp: Date.now()
      });
      
      return stocks;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Search timed out');
      } else {
        console.error('Search failed:', error.message);
      }
      
      // Return empty array on error
      return [];
    }
  }

  /**
   * Fetch real stock price from Yahoo Finance
   */
  async function fetchStockPrice(symbol, exchange) {
    // Check cache first
    const cacheKey = `${symbol}-${exchange}`;
    const cached = priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 Using cached price for ${symbol}: ₹${cached.price}`);
      return cached.price;
    }
    
    const suffix = exchange === 'NSE' ? '.NS' : '.BO';
    const fullSymbol = symbol.toUpperCase() + suffix;
    
    console.log(`🔍 Fetching price for ${fullSymbol}...`);
    
    try {
      // Use Yahoo Finance chart API with CORS proxy
      const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${fullSymbol}?interval=1d&range=1d`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate response structure
      if (!data.chart?.result?.[0]?.meta) {
        throw new Error('Invalid response structure');
      }
      
      const meta = data.chart.result[0].meta;
      const price = meta.regularMarketPrice || meta.previousClose;
      
      if (!price || price <= 0) {
        throw new Error('Invalid price value');
      }
      
      const finalPrice = parseFloat(price.toFixed(2));
      console.log(`✅ Real price for ${symbol}: ₹${finalPrice}`);
      
      // Cache the price
      priceCache.set(cacheKey, {
        price: finalPrice,
        timestamp: Date.now()
      });
      
      return finalPrice;
      
    } catch (error) {
      console.error(`❌ Failed to fetch price for ${symbol}:`, error.message);
      
      throw new Error(
        `Could not fetch price for ${symbol} on ${exchange}. ` +
        `Please verify the stock symbol is correct and try again. ` +
        `If the market is closed, this feature may be temporarily unavailable.`
      );
    }
  }

  /**
   * Validate if stock exists and can fetch price
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
   * Clear all caches
   */
  function clearCache() {
    searchCache.clear();
    priceCache.clear();
    console.log('🧹 All caches cleared');
  }

  // Public API
  return {
    fetchStockPrice,
    searchStocks,
    validateStock,
    clearCache
  };
})();