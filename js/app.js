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
   * Initialize application
   */
  async function init() {
    console.log('🚀 Initializing Stock Challenge...');
    
    // Initialize UI elements
    UIManager.initElements();
    
    // Initialize Firebase
    const firebaseReady = FirebaseService.init();
    
    if (!firebaseReady) {
      UIManager.showError('Failed to connect to database. Please refresh the page.');
      return;
    }
    
    // Load user's entry from localStorage
    loadMyEntry();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    await loadParticipants();
    
    // Subscribe to real-time updates
    subscribeToUpdates();
    
    console.log('✅ Application initialized');
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
   * Fetch stock price (mock implementation)
   * Replace with real NSE/BSE API in production
   */
  async function fetchStockPrice(symbol, exchange) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const basePrice = MOCK_PRICES[symbol.toUpperCase()] || (Math.random() * 1000 + 500);
        const variation = (Math.random() - 0.5) * APP_CONFIG.mockPriceVariation;
        const price = +(basePrice * (1 + variation)).toFixed(2);
        resolve(price);
      }, APP_CONFIG.refreshDelay);
    });
  }

  /**
   * Handle form submission (new entry or update)
   */
  async function handleFormSubmit(event) {
    event.preventDefault();
    UIManager.hideError();
    
    const { name, symbol, exchange } = UIManager.getFormValues();
    
    // Validation
    if (!name || !symbol) {
      UIManager.showError('Please fill all fields');
      return;
    }
    
    if (isDeadlinePassed()) {
      UIManager.showError('Deadline has passed! Cannot submit entries after Sunday 12:00 AM');
      return;
    }
    
    try {
      UIManager.setButtonLoading(UIManager.elements.submitBtn, true);
      
      // Check if symbol is already taken
      const symbolTaken = await FirebaseService.isSymbolTaken(symbol, myEntry?.id);
      if (symbolTaken) {
        UIManager.showError('This stock symbol is already taken by another participant');
        return;
      }
      
      // Fetch stock price
      const price = await fetchStockPrice(symbol, exchange);
      
      if (isEditing && myEntry) {
        // Update existing entry
        await FirebaseService.updateParticipant(myEntry.id, {
          name,
          symbol,
          exchange,
          lastFridayPrice: price,
          cmp: price,
          change: 0
        });
        
        saveMyEntry({ id: myEntry.id, name, symbol });
        UIManager.showSuccess('Entry updated successfully!');
      } else {
        // Create new entry
        const newParticipant = await FirebaseService.addParticipant({
          name,
          symbol,
          exchange,
          lastFridayPrice: price,
          cmp: price,
          change: 0,
          rank: 0
        });
        
        saveMyEntry({ id: newParticipant.id, name, symbol });
        UIManager.showSuccess('Entry submitted successfully!');
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
      
      // Fetch new prices for all participants
      const updatePromises = participants.map(async (p) => {
        const newPrice = await fetchStockPrice(p.symbol, p.exchange);
        const change = p.lastFridayPrice 
          ? ((newPrice - p.lastFridayPrice) / p.lastFridayPrice) * 100 
          : 0;
        
        return {
          id: p.id,
          cmp: newPrice,
          change: +change.toFixed(2)
        };
      });
      
      const updates = await Promise.all(updatePromises);
      
      // Sort by change (descending) and assign ranks
      updates.sort((a, b) => b.change - a.change);
      const rankedUpdates = updates.map((update, index) => ({
        ...update,
        rank: index + 1
      }));
      
      // Batch update in Firebase
      await FirebaseService.batchUpdateParticipants(rankedUpdates);
      
      UIManager.showSuccess('Prices refreshed successfully!');
      
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