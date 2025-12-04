/**
 * Stock API Service
 * Fetches real stock prices and searches ALL stocks dynamically using Yahoo Finance API
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
        return getFallbackSuggestions(query);
      }
      
      const data = await response.json();
      
      if (!data.quotes || data.quotes.length === 0) {
        return getFallbackSuggestions(query);
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
      
      // If no Indian stocks found, show fallback
      if (stocks.length === 0) {
        return getFallbackSuggestions(query);
      }
      
      return stocks;
      
    } catch (error) {
      console.error('Error searching stocks:', error);
      return getFallbackSuggestions(query);
    }
  }

  /**
   * Fallback suggestions when API fails
   * @param {string} query - Search query
   * @returns {Array} Popular stocks matching query
   */
  function getFallbackSuggestions(query) {
    const popularStocks = [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', exchange: 'NSE' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', exchange: 'NSE' },
      { symbol: 'INFY', name: 'Infosys Ltd.', exchange: 'NSE' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', exchange: 'NSE' },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', exchange: 'NSE' },
      { symbol: 'ITC', name: 'ITC Ltd.', exchange: 'NSE' },
      { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', exchange: 'NSE' },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', exchange: 'NSE' },
      { symbol: 'LT', name: 'Larsen & Toubro Ltd.', exchange: 'NSE' },
      { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', exchange: 'NSE' },
      { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', exchange: 'NSE' },
      { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', exchange: 'NSE' },
      { symbol: 'WIPRO', name: 'Wipro Ltd.', exchange: 'NSE' },
      { symbol: 'TITAN', name: 'Titan Company Ltd.', exchange: 'NSE' },
      { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', exchange: 'NSE' },
      { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', exchange: 'NSE' },
      { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.', exchange: 'NSE' },
      { symbol: 'NESTLEIND', name: 'Nestle India Ltd.', exchange: 'NSE' },
      { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', exchange: 'NSE' },
      { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Ltd.', exchange: 'NSE' },
      { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', exchange: 'NSE' },
      { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd.', exchange: 'NSE' },
      { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', exchange: 'NSE' },
      { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', exchange: 'NSE' },
      { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd.', exchange: 'NSE' },
      { symbol: 'NTPC', name: 'NTPC Ltd.', exchange: 'NSE' },
      { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd.', exchange: 'NSE' },
      { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd.', exchange: 'NSE' }
    ];
    
    const searchTerm = query.toLowerCase();
    return popularStocks
      .filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm)
      )
      .slice(0, 8);
  }

  /**
   * Fetch real stock price from Yahoo Finance
   * @param {string} symbol - Stock symbol
   * @param {string} exchange - Exchange (NSE/BSE)
   * @returns {Promise<number>} Stock price
   */
  async function fetchStockPrice(symbol, exchange) {
    try {
      // For NSE stocks, add .NS suffix
      // For BSE stocks, add .BO suffix
      const suffix = exchange === 'NSE' ? '.NS' : '.BO';
      const fullSymbol = symbol.toUpperCase() + suffix;
      
      // Using Yahoo Finance API
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${fullSymbol}?interval=1d&range=1d`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      
      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const price = result.meta.regularMarketPrice;
        
        if (price && price > 0) {
          console.log(`✅ Fetched real price for ${symbol}: ₹${price}`);
          return parseFloat(price.toFixed(2));
        }
      }
      
      // Fallback: if API fails, return a mock price
      console.warn(`⚠️ Could not fetch price for ${symbol}, using mock data`);
      return getMockPrice(symbol);
      
    } catch (error) {
      console.error(`❌ Error fetching price for ${symbol}:`, error);
      // Fallback to mock price on error
      return getMockPrice(symbol);
    }
  }

  /**
   * Mock price generator (fallback when API fails)
   */
  function getMockPrice(symbol) {
    const mockPrices = {
      'RELIANCE': 2450.50,
      'TCS': 3680.20,
      'INFY': 1450.00,
      'HDFCBANK': 1650.75,
      'TATAMOTORS': 920.30,
      'WIPRO': 445.60,
      'ITC': 425.80,
      'SBIN': 610.25,
      'BHARTIARTL': 890.40,
      'HINDUNILVR': 2380.65,
      'ICICIBANK': 985.30,
      'KOTAKBANK': 1720.90,
      'LT': 3150.20,
      'AXISBANK': 1045.70,
      'MARUTI': 9850.40
    };
    
    const base = mockPrices[symbol.toUpperCase()] || (Math.random() * 1000 + 500);
    const variation = (Math.random() - 0.5) * 0.05; // +/-2.5%
    return parseFloat((base * (1 + variation)).toFixed(2));
  }

  // Public API
  return {
    fetchStockPrice,
    searchStocks
  };
})();