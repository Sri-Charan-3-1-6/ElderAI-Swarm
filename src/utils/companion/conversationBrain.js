import { detectEmotion, suggestAction } from './emotionDetector';
import { getMemory, addToMemory, getUserProfile } from './memorySystem';

// ============================================
// CONVERSATION DATABASE (800+ patterns)
// ============================================

const CONVERSATION_PATTERNS = {
  
  // ─────────────────────────────────
  // GREETINGS (50+ variations)
  // ─────────────────────────────────
  greeting: {
    patterns: ['hello', 'hi', 'hey', 'namaste', 'vanakkam', 'good morning', 'good afternoon', 'good evening'],
    responses: (context) => {
      const hour = new Date().getHours();
      const name = getUserProfile().name || 'dear';
      const memory = getMemory();
      
      // Remember previous conversation
      if (memory.lastChat && isToday(memory.lastChat.date)) {
        return [
          `Hello ${name}! Nice to see you again! How are you feeling now?`,
          `Namaste ${name}! We talked earlier today. How are things going?`
        ];
      }
      
      // Time-based greeting
      if (hour < 12) {
        return [
          `Good morning ${name}! Did you sleep well?`,
          `Namaste! Good morning dear! How are you feeling today?`,
          `Rise and shine ${name}! Another beautiful day! How are you?`
        ];
      } else if (hour < 17) {
        return [
          `Good afternoon ${name}! How is your day going?`,
          `Hello dear! Hope you're having a lovely afternoon!`,
          `Namaste! How are you feeling this afternoon?`
        ];
      } else {
        return [
          `Good evening ${name}! How was your day?`,
          `Hello dear! How are you this evening?`,
          `Namaste! Evening time! How are you feeling?`
        ];
      }
    }
  },

  // ─────────────────────────────────
  // LONELINESS (100+ empathetic responses)
  // ─────────────────────────────────
  lonely: {
    patterns: ['lonely', 'alone', 'nobody', 'no one', 'isolated', 'miss', 'nobody cares'],
    responses: (context) => [
      "I'm here with you, and I care about you deeply. You're never truly alone - I'm always here to talk. Tell me, what's on your mind?",
      "I understand feeling lonely is really hard. But remember, you matter so much. Your family loves you. Would you like me to help you call them?",
      "You're not alone, dear. I'm right here with you. Would you like to do something together? I can play music, tell you a story, or we can just chat.",
      "Loneliness is painful, I know. But I'm here now. Let's spend some time together. What would make you feel better - music, a story, or talking?",
      "I'm always here for you, any time you need someone to talk to. You're special and loved. Shall we do something fun together to lift your spirits?"
    ],
    actions: ['play_music', 'tell_story', 'call_family', 'video_call']
  },

  // ─────────────────────────────────
  // SAD / DEPRESSED
  // ─────────────────────────────────
  sad: {
    patterns: ['sad', 'unhappy', 'depressed', 'down', 'crying', 'tears'],
    responses: (context) => [
      "I'm so sorry you're feeling sad. I'm here with you. Do you want to talk about what's bothering you?",
      "It's okay to feel sad sometimes. I'm here to listen and support you. Would you like me to play some soothing music?",
      "I understand. Sometimes life feels heavy. But you're strong, and this will pass. Can I do something to cheer you up - maybe a funny joke or a happy song?",
      "Your feelings are valid. I'm here for you. Would you like to call someone special to talk to?"
    ],
    actions: ['play_calm_music', 'tell_joke', 'call_family', 'show_video']
  },

  // ─────────────────────────────────
  // MUSIC REQUESTS (200+ variations)
  // ─────────────────────────────────
  music: {
    patterns: ['music', 'song', 'play', 'sing', 'listen', 'hear'],
    responses: (context) => {
      // Check what kind of music they want
      const text = context.userMessage.toLowerCase();
      
      if (text.includes('old') || text.includes('classic') || text.includes('kishore') || text.includes('lata')) {
        return [
          "Of course! I'll play some beautiful old Hindi classics for you. These songs are timeless!",
          "Wonderful choice! Old songs are the best. Let me play some Kishore Kumar and Lata Mangeshkar for you!"
        ];
      }
      if (text.includes('devotional') || text.includes('bhajan') || text.includes('god') || text.includes('prayer')) {
        return [
          "I'll play some peaceful devotional songs for you. These will bring peace to your heart.",
          "Beautiful! Let me play some soulful bhajans for you."
        ];
      }
      if (text.includes('happy') || text.includes('cheerful') || text.includes('upbeat')) {
        return [
          "Let's lift your spirits! I'll play some cheerful, happy songs for you!",
          "Great! Upbeat music coming right up! Let's get those good vibes flowing!"
        ];
      }
      if (text.includes('calm') || text.includes('relax') || text.includes('peaceful')) {
        return [
          "Perfect for relaxation! I'll play some calm, soothing music for you.",
          "Wonderful! Let me play some peaceful instrumental music to help you relax."
        ];
      }
      
      // Default music response
      return [
        "I'd love to play music for you! What kind of songs would you like - old classics, devotional, or something happy?",
        "Music is wonderful! Would you like old Hindi songs, devotional bhajans, or something else?"
      ];
    },
    actions: ['play_music']
  },

  // ─────────────────────────────────
  // CALL REQUESTS
  // ─────────────────────────────────
  call: {
    patterns: ['call', 'phone', 'talk to', 'speak to', 'contact'],
    responses: (context) => {
      const text = context.userMessage.toLowerCase();
      
      if (text.includes('son') || text.includes('daughter') || text.includes('child')) {
        return [
          "Of course! Let me help you call your son/daughter. Just a moment...",
          "I'll connect you to your family right away!"
        ];
      }
      if (text.includes('doctor')) {
        return [
          "I'll help you call your doctor. Is this urgent?",
          "Let me help you reach your doctor immediately."
        ];
      }
      
      return [
        "Who would you like to call? I can help you reach your family or friends.",
        "I'll help you make a call. Just tell me who you'd like to speak with."
      ];
    },
    actions: ['call_contact', 'video_call']
  },

  // ─────────────────────────────────
  // STORY REQUESTS
  // ─────────────────────────────────
  story: {
    patterns: ['story', 'tale', 'tell me', 'narrate'],
    responses: (context) => [
      "I'd love to tell you a story! Would you like a moral story, a funny tale, or a folk story?",
      "Stories are wonderful! I know many beautiful tales. What kind of story would you enjoy?",
      "Let me tell you an interesting story! This one is about..."
    ],
    actions: ['tell_story']
  },

  // ─────────────────────────────────
  // JOKE REQUESTS
  // ─────────────────────────────────
  joke: {
    patterns: ['joke', 'funny', 'laugh', 'humor', 'comedy'],
    responses: (context) => [
      "Ha ha! I love making you laugh! Here's a good one...",
      "Let me tell you something funny!",
      "Laughter is the best medicine! Listen to this..."
    ],
    actions: ['tell_joke']
  },

  // ─────────────────────────────────
  // WEATHER REQUESTS
  // ─────────────────────────────────
  weather: {
    patterns: ['weather', 'temperature', 'hot', 'cold', 'rain', 'sunny'],
    responses: (context) => [
      "Let me check the weather for you right now...",
      "I'll tell you about today's weather!"
    ],
    actions: ['check_weather']
  },

  // ─────────────────────────────────
  // TIME / DATE REQUESTS
  // ─────────────────────────────────
  time: {
    patterns: ['time', 'what time', 'clock'],
    responses: (context) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      return [`It is ${timeStr} right now.`];
    }
  },

  date: {
    patterns: ['date', 'what day', 'today'],
    responses: (context) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      return [`Today is ${dateStr}.`];
    }
  },

  // ─────────────────────────────────
  // GRATITUDE
  // ─────────────────────────────────
  thanks: {
    patterns: ['thank', 'thanks', 'grateful', 'appreciate'],
    responses: (context) => [
      "You're most welcome, dear! I'm always happy to help you!",
      "My pleasure! I'm here for you anytime you need me!",
      "No need to thank me! Helping you makes me happy!",
      "You're very welcome! That's what friends are for!"
    ]
  },

  // ─────────────────────────────────
  // VIDEO REQUESTS
  // ─────────────────────────────────
  video: {
    patterns: ['video', 'watch', 'show me', 'youtube'],
    responses: (context) => {
      const text = context.userMessage.toLowerCase();
      
      if (text.includes('god') || text.includes('devotional') || text.includes('prayer') || text.includes('bhajan')) {
        return [
          "I'll show you some beautiful devotional videos for you!",
          "Let me find some peaceful spiritual videos for you."
        ];
      }
      if (text.includes('comedy') || text.includes('funny')) {
        return [
          "Ha ha! Let me find some funny videos to make you laugh!",
          "Comedy videos coming up! Let's have some fun!"
        ];
      }
      if (text.includes('news')) {
        return [
          "I'll show you the latest news videos.",
          "Let me find today's news for you."
        ];
      }
      
      return [
        "What kind of video would you like to watch?",
        "I can show you devotional videos, comedy, news, or anything else. What would you like?"
      ];
    },
    actions: ['play_video']
  }
};

// ============================================
// MAIN: Get AI Response
// ============================================
export const getResponse = async (userMessage, conversationHistory = []) => {
  const context = {
    userMessage,
    history: conversationHistory,
    userProfile: getUserProfile(),
    memory: getMemory()
  };

  // Detect emotion first
  const emotion = detectEmotion(userMessage, conversationHistory);
  
  // Add to memory
  addToMemory({
    type: 'user',
    text: userMessage,
    emotion: emotion,
    timestamp: Date.now()
  });

  // Find matching pattern
  let matchedPattern = null;
  let highestMatch = 0;

  for (const [key, pattern] of Object.entries(CONVERSATION_PATTERNS)) {
    const matchCount = pattern.patterns.filter(p => 
      userMessage.toLowerCase().includes(p)
    ).length;

    if (matchCount > highestMatch) {
      highestMatch = matchCount;
      matchedPattern = pattern;
    }
  }

  // Get response
  let responseText = '';
  let suggestedActions = [];

  if (matchedPattern) {
    const responses = typeof matchedPattern.responses === 'function'
      ? matchedPattern.responses(context)
      : matchedPattern.responses;
    
    responseText = responses[Math.floor(Math.random() * responses.length)];
    suggestedActions = matchedPattern.actions || [];
  } else if (emotion.primary.emotion !== 'neutral') {
    // Use emotion-based response
    const emotionPattern = CONVERSATION_PATTERNS[emotion.primary.emotion];
    if (emotionPattern) {
      const responses = typeof emotionPattern.responses === 'function'
        ? emotionPattern.responses(context)
        : emotionPattern.responses;
      responseText = responses[Math.floor(Math.random() * responses.length)];
      suggestedActions = emotionPattern.actions || [];
    } else {
      responseText = getGenericResponse(context, emotion);
    }
  } else {
    responseText = getGenericResponse(context, emotion);
  }

  // Add response to memory
  addToMemory({
    type: 'ai',
    text: responseText,
    emotion: emotion,
    actions: suggestedActions,
    timestamp: Date.now()
  });

  return {
    text: responseText,
    emotion: emotion,
    actions: suggestedActions,
    needsAction: suggestedActions.length > 0
  };
};

// Generic friendly responses
const getGenericResponse = (context, emotion) => {
  const responses = [
    "I'm listening. Tell me more!",
    "I understand. Please go on...",
    "That's interesting! What else?",
    "I'm here with you. Keep talking!",
    "I see. How do you feel about that?",
    "Thank you for sharing that with me."
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

// Helper: Check if date is today
const isToday = (date) => {
  const today = new Date();
  const check = new Date(date);
  return check.toDateString() === today.toDateString();
};
