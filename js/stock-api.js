/**
 * Stock API Service
 * Fetches REAL stock prices ONLY - No mock data
 */

const StockAPI = (function() {
  
  /**
   * Search stocks dynamically from Yahoo Finance API
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching stocks
   */
  async function searchStocks(query) {
    if (!query || query.length < 2) return [];
    
    try {
      // Yahoo Finance autocomplete API
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0&quotesQueryId=tss_match_phrase_query`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn('Yahoo Finance API request failed');
        return [];
      }
      
      const data = await response.json();
      
      if (!data.quotes || data.quotes.length === 0) {
        return [];
      }
      
      // Filter and format results - prioritize Indian stocks (.NS and .BO)
      const stocks = data.quotes
        .filter(quote => {
          // Include stocks that end with .NS (NSE) or .BO (BSE)
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
        .slice(0, 8); // Limit to 8 results
      
      return stocks;
      
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  /**
   * Fetch REAL stock price from Yahoo Finance - NO MOCK DATA
   * @param {string} symbol - Stock symbol
   * @param {string} exchange - Exchange (NSE/BSE)
   * @returns {Promise<number>} Stock price (throws error if fails)
   */
  async function fetchStockPrice(symbol, exchange) {
    try {
      // For NSE stocks, add .NS suffix
      // For BSE stocks, add .BO suffix
      const suffix = exchange === 'NSE' ? '.NS' : '.BO';
      const fullSymbol = symbol.toUpperCase() + suffix;
      
      console.log(`🔍 Fetching real price for ${fullSymbol}...`);
      
      // Using Yahoo Finance API
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${fullSymbol}?interval=1d&range=1d`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check for valid data
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error('No data returned from API');
      }
      
      const result = data.chart.result[0];
      
      // Check if market is open and get latest price
      const meta = result.meta;
      const price = meta.regularMarketPrice || meta.previousClose;
      
      if (!price || price <= 0) {
        throw new Error('Invalid price data');
      }
      
      const finalPrice = parseFloat(price.toFixed(2));
      console.log(`✅ Real price for ${symbol} (${exchange}): ₹${finalPrice}`);
      
      return finalPrice;
      
    } catch (error) {
      console.error(`❌ Failed to fetch real price for ${symbol}:`, error.message);
      throw new Error(`Could not fetch price for ${symbol}. Please check the stock symbol and try again.`);
    }
  }

  /**
   * Validate if stock symbol exists and can fetch price
   * @param {string} symbol - Stock symbol
   * @param {string} exchange - Exchange (NSE/BSE)
   * @returns {Promise<boolean>} True if valid
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