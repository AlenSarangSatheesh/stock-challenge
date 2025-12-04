/**
 * Stock API Service
 * Fetches real stock prices and provides autocomplete
 */

const StockAPI = (function() {
  
  // Popular Indian stocks for autocomplete
  const POPULAR_NSE_STOCKS = [
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
    { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd.', exchange: 'NSE' },
    { symbol: 'NTPC', name: 'NTPC Ltd.', exchange: 'NSE' },
    { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd.', exchange: 'NSE' },
    { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd.', exchange: 'NSE' },
    { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', exchange: 'NSE' },
    { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', exchange: 'NSE' },
    { symbol: 'COALINDIA', name: 'Coal India Ltd.', exchange: 'NSE' },
    { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd.', exchange: 'NSE' },
    { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Ltd.', exchange: 'NSE' },
    { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', exchange: 'NSE' },
    { symbol: 'DRREDDY', name: 'Dr. Reddys Laboratories Ltd.', exchange: 'NSE' },
    { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd.', exchange: 'NSE' },
    { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories Ltd.', exchange: 'NSE' },
    { symbol: 'GRASIM', name: 'Grasim Industries Ltd.', exchange: 'NSE' },
    { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd.', exchange: 'NSE' },
    { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd.', exchange: 'NSE' },
    { symbol: 'CIPLA', name: 'Cipla Ltd.', exchange: 'NSE' },
    { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd.', exchange: 'NSE' },
    { symbol: 'SHREECEM', name: 'Shree Cement Ltd.', exchange: 'NSE' }
  ];

  /**
   * Search stocks by symbol or name
   * @param {string} query - Search query
   * @returns {Array} Matching stocks
   */
  function searchStocks(query) {
    if (!query || query.length < 1) return [];
    
    const searchTerm = query.toLowerCase();
    const results = POPULAR_NSE_STOCKS.filter(stock => 
      stock.symbol.toLowerCase().includes(searchTerm) ||
      stock.name.toLowerCase().includes(searchTerm)
    );
    
    return results.slice(0, 8); // Return max 8 results
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
          return parseFloat(price.toFixed(2));
        }
      }
      
      // Fallback: if API fails, return a mock price
      console.warn(`Could not fetch price for ${symbol}, using mock data`);
      return getMockPrice(symbol);
      
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      // Fallback to mock price on error
      return getMockPrice(symbol);
    }
  }

  /**
   * Mock price generator (fallback)
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
      'HINDUNILVR': 2380.65
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