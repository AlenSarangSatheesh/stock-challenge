/**
 * Stock Challenge - Main Application
 * Coordinates between Firebase service and UI manager
 */

(function() {
  // Application state
  let participants = [];
  let myEntry = null; // Stored in localStorage: { id, name, symbol }
  let isEditing = false;
  let unsubscribe = null;
  

  /**
 * Setup stock autocomplete with live API search
 * 
 * INSTRUCTIONS: Replace the setupStockAutocomplete() function in your js/app.js
 * with this complete version
 */

  
  /**
   * Initialize the application
   * This function should be added to js/app.js after the setupStockAutocomplete() function
   * and before the window.addEventListener('beforeunload') line
   */
  async function init() {
    try {
      console.log('🚀 Initializing Stock Challenge App...');

      // 1. Initialize UI elements
      UIManager.initElements();
      console.log('✅ UI elements initialized');

      // 2. Initialize Firebase
      const firebaseInitialized = FirebaseService.init();
      if (!firebaseInitialized) {
        UIManager.showError('Failed to initialize Firebase. Please refresh the page.');
        return;
      }

      // 3. Load user's entry from localStorage
      loadMyEntry();
      console.log('✅ User entry loaded');

      // 4. Set up event listeners
      setupEventListeners();
      console.log('✅ Event listeners set up');

      

      // 6. Load participants from Firebase
      await loadParticipants();
      console.log('✅ Participants loaded');

      // 7. Subscribe to real-time updates
      subscribeToUpdates();
      console.log('✅ Real-time updates subscribed');

      console.log('✅ Stock Challenge App initialized successfully!');

    } catch (error) {
      console.error('❌ Error initializing app:', error);
      UIManager.showError('Failed to initialize app. Please refresh the page.');
    }
  }

  

  /**
   * Load user's entry from localStorage
   */
  function loadMyEntry() {
    try {
      const stored = localStorage.getItem('stockChallengeEntry');
      if (stored) {
        myEntry = JSON.parse(stored);
        UIManager.updateHeaderButton(true);
      }
    } catch (error) {
      console.error('Error loading user entry:', error);
    }
  }

  /**
   * Save user's entry to localStorage
   */
  function saveMyEntry(entry) {
    myEntry = entry;
    localStorage.setItem('stockChallengeEntry', JSON.stringify(entry));
    UIManager.updateHeaderButton(true);
  }

  /**
   * Clear user's entry from localStorage
   */
  function clearMyEntry() {
    myEntry = null;
    localStorage.removeItem('stockChallengeEntry');
    UIManager.updateHeaderButton(false);
  }

  /**
   * Load all participants from Firebase
   */
  async function loadParticipants() {
    try {
      UIManager.showLoading();
      participants = await FirebaseService.getAllParticipants();
      UIManager.renderLeaderboard(participants);
    } catch (error) {
      console.error('Error loading participants:', error);
      UIManager.showError('Failed to load participants. Please refresh the page.');
    }
  }

  /**
   * Subscribe to real-time updates
   */
  function subscribeToUpdates() {
    try {
      unsubscribe = FirebaseService.subscribeToParticipants((updatedParticipants) => {
        participants = updatedParticipants;
        UIManager.renderLeaderboard(participants);
      });
    } catch (error) {
      console.error('Error subscribing to updates:', error);
    }
  }

  /**
   * Get last Friday's date
   */
  function getLastFriday() {
    const today = new Date();
    const day = today.getDay();
    const diff = day >= 5 ? day - 5 : day + 2;
    const friday = new Date(today);
    friday.setDate(today.getDate() - diff);
    friday.setHours(0, 0, 0, 0);
    return friday;
  }

  /**
   * Check if deadline has passed (Sunday 12:00 AM)
   */
  function isDeadlinePassed() {
  return false; // Temporarily disabled for testing
  }

  /**
  * Fetch stock price using real API
  */
  async function fetchStockPrice(symbol, exchange) {
    return await StockAPI.fetchStockPrice(symbol, exchange);
  }

  /**
   * Handle form submission (new entry or update)
   */
  /**
 * Handle form submission (new entry or update)
 * UPDATED: Accepts stock symbols in any case (lowercase, uppercase, mixed)
 */
  async function handleFormSubmit(event) {
    event.preventDefault();
    UIManager.hideError();

    // Get form values and normalize symbol to UPPERCASE
    const formValues = UIManager.getFormValues();
    const name = formValues.name;
    const symbol = formValues.symbol.toUpperCase().trim(); // Convert to uppercase
    const exchange = formValues.exchange;

    // Validation
    if (!name || !symbol) {
      UIManager.showError('Please fill all fields');
      return;
    }

    // Validate symbol format (letters, numbers, & and - only)
    const symbolRegex = /^[A-Z0-9&\-]+$/;
    if (!symbolRegex.test(symbol)) {
      UIManager.showError('Stock symbol can only contain letters, numbers, & and -');
      return;
    }

    if (isDeadlinePassed()) {
      UIManager.showError('Deadline has passed! Cannot submit entries after Sunday 11:59 PM');
      return;
    }

    try {
      UIManager.setButtonLoading(UIManager.elements.submitBtn, true);

      // Check if symbol is already taken (case-insensitive comparison)
      const symbolTaken = await FirebaseService.isSymbolTaken(symbol, myEntry?.id);
      if (symbolTaken) {
        UIManager.showError(`Stock symbol ${symbol} is already taken by another participant`);
        return;
      }

      // Fetch REAL stock price
      let price;
      try {
        UIManager.showSuccess(`Fetching price for ${symbol}...`);
        price = await fetchStockPrice(symbol, exchange);
        console.log(`✅ Successfully fetched price: ₹${price}`);
      } catch (error) {
        UIManager.showError(
          `Failed to fetch price for ${symbol} on ${exchange}. ` +
          `Please verify: 1) Symbol is correct (e.g., RELIANCE, TCS, INFY) ` +
          `2) Stock is listed on ${exchange} ` +
          `3) Market might be closed`
        );
        return;
      }

      // Validate price
      if (!price || price <= 0) {
        UIManager.showError(`Invalid price returned for ${symbol}. Please try a different stock.`);
        return;
      }

      if (isEditing && myEntry) {
        // Update existing entry
        await FirebaseService.updateParticipant(myEntry.id, {
          name,
          symbol, // Already uppercase
          exchange,
          lastFridayPrice: price,
          cmp: price,
          change: 0
        });

        saveMyEntry({ id: myEntry.id, name, symbol });
        UIManager.showSuccess(`Entry updated! ${symbol} @ ₹${price}`);
      } else {
        // Create new entry
        const newParticipant = await FirebaseService.addParticipant({
          name,
          symbol, // Already uppercase
          exchange,
          lastFridayPrice: price,
          cmp: price,
          change: 0,
          rank: 0
        });

        saveMyEntry({ id: newParticipant.id, name, symbol });
        UIManager.showSuccess(`Entry submitted! ${symbol} @ ₹${price}`);
      }

      // Reset form and close
      UIManager.hideEntryForm();
      isEditing = false;

    } catch (error) {
      console.error('Error submitting entry:', error);
      UIManager.showError('Failed to submit entry. Please try again.');
    } finally {
      UIManager.setButtonLoading(UIManager.elements.submitBtn, false);
    }
  }

  /**
   * Handle delete entry
   */
  async function handleDeleteEntry() {
    if (!myEntry) {
      UIManager.showError('No entry to delete');
      return;
    }
    
    if (isDeadlinePassed()) {
      UIManager.showError('Deadline has passed! Cannot delete entries after Sunday 12:00 AM');
      return;
    }
    
    if (!confirm('Are you sure you want to delete your entry?')) {
      return;
    }
    
    try {
      UIManager.setButtonLoading(UIManager.elements.deleteBtn, true, 'Deleting...');
      
      await FirebaseService.deleteParticipant(myEntry.id);
      
      clearMyEntry();
      UIManager.hideEntryForm();
      isEditing = false;
      UIManager.showSuccess('Entry deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting entry:', error);
      UIManager.showError('Failed to delete entry. Please try again.');
    } finally {
      UIManager.setButtonLoading(UIManager.elements.deleteBtn, false);
    }
  }

  /**
 * Handle refresh prices
 */
  async function handleRefreshPrices() {
    if (participants.length === 0) {
      UIManager.showError('No participants to refresh');
      return;
    }

    try {
      UIManager.setRefreshLoading(true);
      UIManager.hideError();

      console.log('🔄 Refreshing prices for all participants...');

      // Fetch new prices for all participants
      const updatePromises = participants.map(async (p) => {
        try {
          const newPrice = await fetchStockPrice(p.symbol, p.exchange);
          const change = p.lastFridayPrice
            ? ((newPrice - p.lastFridayPrice) / p.lastFridayPrice) * 100
            : 0;

          console.log(`✅ ${p.symbol}: ₹${newPrice} (${change.toFixed(2)}%)`);

          return {
            id: p.id,
            cmp: newPrice,
            change: +change.toFixed(2),
            success: true
          };
        } catch (error) {
          console.error(`❌ Failed to fetch price for ${p.symbol}:`, error);
          // Keep existing price if fetch fails
          return {
            id: p.id,
            cmp: p.cmp || 0,
            change: p.change || 0,
            success: false
          };
        }
      });

      const updates = await Promise.all(updatePromises);

      // Check if any prices were successfully fetched
      const successCount = updates.filter(u => u.success).length;
      if (successCount === 0) {
        UIManager.showError('Failed to fetch prices for any stocks. Please check your internet connection.');
        return;
      }

      // Sort by change (descending) and assign ranks
      updates.sort((a, b) => b.change - a.change);
      const rankedUpdates = updates.map((update, index) => ({
        ...update,
        rank: index + 1
      }));

      // Batch update in Firebase
      await FirebaseService.batchUpdateParticipants(rankedUpdates);

      const failCount = updates.length - successCount;
      if (failCount > 0) {
        UIManager.showSuccess(`Prices refreshed! (${successCount} succeeded, ${failCount} failed)`);
      } else {
        UIManager.showSuccess('All prices refreshed successfully!');
      }

      console.log(`✅ Refresh complete: ${successCount}/${updates.length} stocks updated`);

    } catch (error) {
      console.error('Error refreshing prices:', error);
      UIManager.showError('Failed to refresh prices. Please try again.');
    } finally {
      UIManager.setRefreshLoading(false);
    }
  }

  /**
   * Handle toggle entry button (Join/Edit)
   */
  function handleToggleEntry() {
    UIManager.hideError();
    
    if (!myEntry) {
      // Show new entry form
      isEditing = false;
      UIManager.showEntryForm(false);
    } else {
      // Show edit form
      if (isDeadlinePassed()) {
        UIManager.showError('Deadline has passed! Cannot edit entries after Sunday 12:00 AM');
        return;
      }
      
      const myParticipant = participants.find(p => p.id === myEntry.id);
      if (!myParticipant) {
        UIManager.showError('Your entry was not found. Please try again.');
        clearMyEntry();
        return;
      }
      
      isEditing = true;
      UIManager.showEntryForm(true, myParticipant);
    }
  }

  /**
   * Set up all event listeners
   */
  function setupEventListeners() {
    // Toggle entry button
    UIManager.elements.toggleEntryBtn.addEventListener('click', handleToggleEntry);
    
    // Close form button
    UIManager.elements.closeForm.addEventListener('click', () => {
      UIManager.hideEntryForm();
      isEditing = false;
    });
    
    // Form submission
    UIManager.elements.entryForm.addEventListener('submit', handleFormSubmit);
    
    // Delete button
    UIManager.elements.deleteBtn.addEventListener('click', handleDeleteEntry);
    
    // Refresh prices button
    UIManager.elements.refreshBtn.addEventListener('click', handleRefreshPrices);
    
    // Clear error button
    UIManager.elements.clearError.addEventListener('click', UIManager.hideError);
    
    // Clear success button
    UIManager.elements.clearSuccess.addEventListener('click', UIManager.hideSuccess);
    
    // Listen for storage changes (from other tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === 'stockChallengeEntry') {
        loadMyEntry();
      }
    });
  }

  /**
   * Cleanup on page unload
   */
  window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  // Initialize app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();