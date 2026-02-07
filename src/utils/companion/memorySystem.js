// ============================================
// MEMORY SYSTEM
// Remembers everything about conversations
// ============================================

const MEMORY_KEY = 'ai_companion_memory';
const PROFILE_KEY = 'ai_companion_user_profile';

// Initialize memory structure
const createEmptyMemory = () => ({
  conversations: [],           // All chat messages
  lastChat: null,             // Last conversation info
  emotionHistory: [],         // Emotion trend over time
  topics: [],                 // Topics discussed
  preferences: {},            // User preferences learned
  statistics: {
    totalConversations: 0,
    totalWords: 0,
    averageEmotion: 'neutral',
    favoriteActivities: []
  }
});

// ============================================
// GET MEMORY
// ============================================
export const getMemory = () => {
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    if (!stored) return createEmptyMemory();
    
    const memory = JSON.parse(stored);
    // Ensure all properties exist
    return { ...createEmptyMemory(), ...memory };
  } catch (error) {
    console.error('Error loading memory:', error);
    return createEmptyMemory();
  }
};

// ============================================
// ADD TO MEMORY
// ============================================
export const addToMemory = (entry) => {
  const memory = getMemory();
  
  // Add conversation entry
  memory.conversations.push({
    ...entry,
    id: Date.now() + Math.random(),
    timestamp: entry.timestamp || Date.now()
  });
  
  // Update last chat
  memory.lastChat = {
    date: Date.now(),
    text: entry.text,
    type: entry.type
  };
  
  // Add emotion to history
  if (entry.emotion) {
    memory.emotionHistory.push({
      emotion: entry.emotion.primary?.emotion || 'neutral',
      confidence: entry.emotion.primary?.confidence || 0,
      timestamp: entry.timestamp || Date.now()
    });
  }
  
  // Track topics (extract keywords from conversation)
  if (entry.text) {
    const keywords = extractKeywords(entry.text);
    keywords.forEach(keyword => {
      if (!memory.topics.includes(keyword)) {
        memory.topics.push(keyword);
      }
    });
  }
  
  // Update statistics
  memory.statistics.totalConversations++;
  memory.statistics.totalWords += entry.text ? entry.text.split(' ').length : 0;
  
  // Keep only last 100 conversations
  if (memory.conversations.length > 100) {
    memory.conversations = memory.conversations.slice(-100);
  }
  
  // Keep only last 50 emotions
  if (memory.emotionHistory.length > 50) {
    memory.emotionHistory = memory.emotionHistory.slice(-50);
  }
  
  // Keep only last 30 topics
  if (memory.topics.length > 30) {
    memory.topics = memory.topics.slice(-30);
  }
  
  // Save to localStorage
  saveMemory(memory);
  
  return memory;
};

// ============================================
// SAVE MEMORY
// ============================================
const saveMemory = (memory) => {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch (error) {
    console.error('Error saving memory:', error);
  }
};

// ============================================
// CLEAR OLD MEMORY (older than 7 days)
// ============================================
export const clearOldMemory = () => {
  const memory = getMemory();
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  memory.conversations = memory.conversations.filter(c => c.timestamp > weekAgo);
  memory.emotionHistory = memory.emotionHistory.filter(e => e.timestamp > weekAgo);
  
  saveMemory(memory);
  return memory;
};

// ============================================
// CLEAR ALL MEMORY
// ============================================
export const clearAllMemory = () => {
  localStorage.removeItem(MEMORY_KEY);
  return createEmptyMemory();
};

// ============================================
// USER PROFILE
// ============================================
export const getUserProfile = () => {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) {
      return {
        name: 'Friend',
        age: null,
        birthday: null,
        language: 'en-IN',
        preferences: {
          musicType: 'old_hindi',
          wakeupTime: '07:00',
          sleepTime: '22:00'
        },
        family: [],
        medicalInfo: []
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading profile:', error);
    return { name: 'Friend' };
  }
};

export const updateUserProfile = (updates) => {
  const profile = getUserProfile();
  const updated = { ...profile, ...updates };
  
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
  
  return updated;
};

// ============================================
// GET CONVERSATION CONTEXT (last N messages)
// ============================================
export const getConversationContext = (count = 5) => {
  const memory = getMemory();
  return memory.conversations.slice(-count);
};

// ============================================
// GET EMOTION TREND
// ============================================
export const getEmotionTrend = (hours = 24) => {
  const memory = getMemory();
  const since = Date.now() - (hours * 60 * 60 * 1000);
  
  const recentEmotions = memory.emotionHistory.filter(e => e.timestamp > since);
  
  if (recentEmotions.length === 0) return 'neutral';
  
  // Count emotion occurrences
  const emotionCounts = {};
  recentEmotions.forEach(e => {
    emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
  });
  
  // Find most frequent
  let maxCount = 0;
  let dominantEmotion = 'neutral';
  
  for (const [emotion, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion;
    }
  }
  
  return dominantEmotion;
};

// ============================================
// HELPER: Extract keywords from text
// ============================================
const extractKeywords = (text) => {
  const common = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can'];
  
  const words = text.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !common.includes(word));
  
  return [...new Set(words)].slice(0, 5);
};
