/**
 * Firebase Service
 * Handles all Firebase/Firestore operations
 */

const FirebaseService = (function() {
  let db = null;
  let initialized = false;

  /**
   * Initialize Firebase
   */
  function init() {
    try {
      if (!firebase || !firebase.apps) {
        throw new Error('Firebase SDK not loaded');
      }

      if (firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
      }
      
      db = firebase.firestore();
      initialized = true;
      console.log('✅ Firebase initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      return false;
    }
  }

  /**
   * Check if Firebase is initialized
   */
  function isInitialized() {
    return initialized;
  }

  /**
   * Generate unique ID
   */
  function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get all participants from Firestore
   * @returns {Promise<Array>} Array of participant objects
   */
  async function getAllParticipants() {
    try {
      if (!initialized) throw new Error('Firebase not initialized');
      
      const snapshot = await db.collection(APP_CONFIG.collectionName).get();
      const participants = [];
      
      snapshot.forEach(doc => {
        participants.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`📊 Loaded ${participants.length} participants`);
      return participants;
    } catch (error) {
      console.error('Error getting participants:', error);
      throw error;
    }
  }

  /**
   * Add new participant to Firestore
   * @param {Object} participant - Participant data
   * @returns {Promise<Object>} Added participant with ID
   */
  async function addParticipant(participant) {
    try {
      if (!initialized) throw new Error('Firebase not initialized');
      
      const id = generateId();
      const participantData = {
        ...participant,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection(APP_CONFIG.collectionName).doc(id).set(participantData);
      
      console.log('✅ Participant added:', id);
      return { id, ...participantData };
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }

  /**
   * Update existing participant in Firestore
   * @param {string} id - Participant ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async function updateParticipant(id, updates) {
    try {
      if (!initialized) throw new Error('Firebase not initialized');
      
      const updateData = {
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection(APP_CONFIG.collectionName).doc(id).update(updateData);
      
      console.log('✅ Participant updated:', id);
    } catch (error) {
      console.error('Error updating participant:', error);
      throw error;
    }
  }

  /**
   * Delete participant from Firestore
   * @param {string} id - Participant ID
   * @returns {Promise<void>}
   */
  async function deleteParticipant(id) {
    try {
      if (!initialized) throw new Error('Firebase not initialized');
      
      await db.collection(APP_CONFIG.collectionName).doc(id).delete();
      
      console.log('✅ Participant deleted:', id);
    } catch (error) {
      console.error('Error deleting participant:', error);
      throw error;
    }
  }

  /**
   * Check if symbol is already taken by another participant
   * @param {string} symbol - Stock symbol to check
   * @param {string} excludeId - Participant ID to exclude (for updates)
   * @returns {Promise<boolean>} True if symbol exists
   */
  async function isSymbolTaken(symbol, excludeId = null) {
    try {
      if (!initialized) throw new Error('Firebase not initialized');
      
      const snapshot = await db.collection(APP_CONFIG.collectionName)
        .where('symbol', '==', symbol.toUpperCase())
        .get();
      
      if (snapshot.empty) return false;
      
      // Check if the found document is not the one we're excluding
      if (excludeId) {
        let isTaken = false;
        snapshot.forEach(doc => {
          if (doc.id !== excludeId) {
            isTaken = true;
          }
        });
        return isTaken;
      }
      
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking symbol:', error);
      throw error;
    }
  }

  /**
   * Batch update all participants (for price refresh)
   * @param {Array} participants - Array of participant objects with updates
   * @returns {Promise<void>}
   */
  async function batchUpdateParticipants(participants) {
    try {
      if (!initialized) throw new Error('Firebase not initialized');
      
      const batch = db.batch();
      const timestamp = firebase.firestore.FieldValue.serverTimestamp();
      
      participants.forEach(participant => {
        const docRef = db.collection(APP_CONFIG.collectionName).doc(participant.id);
        batch.update(docRef, {
          cmp: participant.cmp,
          change: participant.change,
          rank: participant.rank,
          updatedAt: timestamp
        });
      });
      
      await batch.commit();
      console.log('✅ Batch update completed for', participants.length, 'participants');
    } catch (error) {
      console.error('Error batch updating participants:', error);
      throw error;
    }
  }

  /**
   * Listen to real-time updates on participants collection
   * @param {Function} callback - Function to call when data changes
   * @returns {Function} Unsubscribe function
   */
  function subscribeToParticipants(callback) {
    try {
      if (!initialized) throw new Error('Firebase not initialized');
      
      const unsubscribe = db.collection(APP_CONFIG.collectionName)
        .onSnapshot(snapshot => {
          const participants = [];
          snapshot.forEach(doc => {
            participants.push({
              id: doc.id,
              ...doc.data()
            });
          });
          callback(participants);
        }, error => {
          console.error('Error in real-time listener:', error);
        });
      
      console.log('👂 Subscribed to real-time updates');
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to participants:', error);
      throw error;
    }
  }

  // Public API
  return {
    init,
    isInitialized,
    getAllParticipants,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    isSymbolTaken,
    batchUpdateParticipants,
    subscribeToParticipants
  };
})();