/**
 * Stock API Service - CORS-Fixed Version
 * Fetches REAL stock prices with CORS proxy
 */

const StockAPI = (function() {
  
  // CORS proxy options
  const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
  ];
  
  let currentProxyIndex = 0;
  
  /**
   * Get current CORS proxy
   */
  function getCorsProxy() {
    return CORS_PROXIES[currentProxyIndex % CORS_PROXIES.length];
  }
  
  /**
   * Switch to next proxy on failure
   */
  function switchProxy() {
    currentProxyIndex++;
    console.log(`🔄 Switching to proxy ${currentProxyIndex % CORS_PROXIES.length + 1}`);
  }
  
  /**
   * Search stocks dynamically
   */
  async function searchStocks(query) {
    if (!query || query.length < 2) return [];
    
    try {
      const proxy = getCorsProxy();
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
      
      const response = await fetch(proxy + encodeURIComponent(url), {
        method: 'GET',
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      
      if (!data.quotes || data.quotes.length === 0) {
        return [];
      }
      
      const stocks = data.quotes
        .filter(quote => {
          const symbol = quote.symbol || '';
          return symbol.endsWith('.NS') || symbol.endsWith('.BO');
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
            type: quote.quoteType || 'EQUITY'
          };
        })
        .slice(0, 8);
      
      return stocks;
      
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  /**
   * Fetch stock price with CORS proxy
   */
  async function fetchStockPrice(symbol, exchange) {
    const suffix = exchange === 'NSE' ? '.NS' : '.BO';
    const fullSymbol = symbol.toUpperCase() + suffix;
    
    console.log(`🔍 Fetching price for ${fullSymbol}...`);
    
    // Try with CORS proxy
    for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
      try {
        const proxy = getCorsProxy();
        const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${fullSymbol}?interval=1d&range=1d`;
        const url = proxy + encodeURIComponent(apiUrl);
        
        console.log(`Attempt ${attempt + 1}: Using proxy ${currentProxyIndex % CORS_PROXIES.length + 1}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        
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
        return finalPrice;
        
      } catch (error) {
        console.warn(`⚠️ Proxy ${attempt + 1} failed: ${error.message}`);
        switchProxy();
        
        // If last attempt, throw error
        if (attempt === CORS_PROXIES.length - 1) {
          throw new Error(
            `Failed to fetch price for ${symbol} on ${exchange}. ` +
            `Please verify: (1) Symbol is correct (2) Stock is actively traded (3) Try again in a moment. ` +
            `Current price: Check manually on NSE/BSE website.`
          );
        }
      }
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

  // Public API
  return {
    fetchStockPrice,
    searchStocks,
    validateStock
  };
})();