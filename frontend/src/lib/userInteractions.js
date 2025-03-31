/**
 * Service for tracking user interactions and persistent connections
 * Stores data in localStorage to persist between sessions
 */

const STORAGE_KEY = 'vCommunicate_userInteractions';

/**
 * Get all stored user interactions
 * @returns {Object} User interaction data
 */
export const getUserInteractions = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { conversations: [], recentChats: [] };
  } catch (error) {
    console.error('Error retrieving user interactions:', error);
    return { conversations: [], recentChats: [] };
  }
};

/**
 * Save the entire interactions object
 * @param {Object} interactions - The interactions object to save
 */
export const saveUserInteractions = (interactions) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interactions));
  } catch (error) {
    console.error('Error saving user interactions:', error);
  }
};

/**
 * Add a user to the interactions list (both conversations and recents)
 * @param {Object} user - User object to add
 */
export const addUserInteraction = (user) => {
  if (!user || !user._id) return;
  
  try {
    const interactions = getUserInteractions();
    
    // Check if already in conversations list
    if (!interactions.conversations.includes(user._id)) {
      interactions.conversations.push(user._id);
    }
    
    // Update recent chats (most recent first, removing duplicates)
    interactions.recentChats = [
      user._id,
      ...interactions.recentChats.filter(id => id !== user._id)
    ].slice(0, 10); // Limit to 10 recent chats
    
    saveUserInteractions(interactions);
  } catch (error) {
    console.error('Error adding user interaction:', error);
  }
};

/**
 * Check if a user is in the interactions list
 * @param {string} userId - User ID to check
 * @returns {boolean} True if the user is in interactions list
 */
export const hasInteractedWith = (userId) => {
  if (!userId) return false;
  
  try {
    const interactions = getUserInteractions();
    return interactions.conversations.includes(userId);
  } catch (error) {
    console.error('Error checking user interaction:', error);
    return false;
  }
};

/**
 * Get the sorted list of recent chat user IDs
 * @returns {Array} Array of user IDs for recent chats
 */
export const getRecentChatUsers = () => {
  try {
    const interactions = getUserInteractions();
    return interactions.recentChats || [];
  } catch (error) {
    console.error('Error getting recent chats:', error);
    return [];
  }
};

/**
 * Clear all stored user interactions
 */
export const clearUserInteractions = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing user interactions:', error);
  }
}; 