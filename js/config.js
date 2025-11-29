/**
 * Firebase Configuration
 * 
 * IMPORTANT: This file contains placeholder values.
 * In production, these values will be injected via GitHub Actions
 * from GitHub Secrets during deployment.
 * 
 * For local development:
 * 1. Copy this file to config.local.js
 * 2. Replace placeholder values with your actual Firebase config
 * 3. Add config.local.js to .gitignore (already included)
 * 4. Import config.local.js instead in index.html during local dev
 */

// Firebase configuration object
const firebaseConfig = {
  apiKey: "FIREBASE_API_KEY_PLACEHOLDER",
  authDomain: "FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
  projectId: "FIREBASE_PROJECT_ID_PLACEHOLDER",
  storageBucket: "FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
  appId: "FIREBASE_APP_ID_PLACEHOLDER"
};

// Mock prices for demonstration
// In production, replace with real API calls to NSE/BSE
const MOCK_PRICES = {
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

// Application constants
const APP_CONFIG = {
  collectionName: 'participants',
  deadlineDay: 0, // Sunday (0 = Sunday, 1 = Monday, etc.)
  deadlineHour: 0, // 12:00 AM
  deadlineMinute: 0,
  referenceDay: 5, // Friday (for last Friday price)
  maxNameLength: 50,
  maxSymbolLength: 20,
  mockPriceVariation: 0.1, // +/- 10% variation for mock prices
  refreshDelay: 700 // ms delay for simulated API calls
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig, MOCK_PRICES, APP_CONFIG };
}