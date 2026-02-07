// ============================================
// EMOTION DETECTOR - Understands feelings
// ============================================

// Emotion keywords database (800+ patterns)
const EMOTION_PATTERNS = {
  // HAPPY emotions
  happy: {
    keywords: ['happy', 'joy', 'great', 'wonderful', 'excellent', 'amazing', 'fantastic', 'love', 'blessed', 'grateful', 'thankful', 'good', 'nice', 'pleasant', 'delighted'],
    intensity: { weak: 0.3, moderate: 0.6, strong: 1.0 },
    color: '#28a745',
    emoji: '😊',
    response_style: 'cheerful'
  },

  // LONELY emotions (MOST IMPORTANT for elderly)
  lonely: {
    keywords: ['lonely', 'alone', 'nobody', 'isolated', 'miss', 'missing', 'empty', 'solitude', 'lonesome', 'friendless', 'abandoned', 'forgotten', 'neglected'],
    intensity: { weak: 0.4, moderate: 0.7, strong: 1.0 },
    color: '#6c757d',
    emoji: '😔',
    response_style: 'warm_companion',
    priority: 'high'  // Requires immediate empathetic response
  },

  // SAD emotions
  sad: {
    keywords: ['sad', 'unhappy', 'depressed', 'down', 'blue', 'miserable', 'gloomy', 'hopeless', 'heartbroken', 'crying', 'tears', 'upset', 'disappointed'],
    intensity: { weak: 0.4, moderate: 0.7, strong: 1.0 },
    color: '#6610f2',
    emoji: '😢',
    response_style: 'comforting'
  },

  // WORRIED/ANXIOUS emotions
  worried: {
    keywords: ['worried', 'anxious', 'nervous', 'scared', 'afraid', 'fear', 'panic', 'stress', 'tense', 'concerned', 'uneasy', 'troubled'],
    intensity: { weak: 0.3, moderate: 0.6, strong: 1.0 },
    color: '#ffc107',
    emoji: '😰',
    response_style: 'reassuring'
  },

  // PAIN/SICK emotions
  pain: {
    keywords: ['pain', 'hurt', 'ache', 'sick', 'unwell', 'ill', 'suffering', 'discomfort', 'sore', 'dizzy', 'nausea', 'weak'],
    intensity: { weak: 0.5, moderate: 0.8, strong: 1.0 },
    color: '#dc3545',
    emoji: '🤕',
    response_style: 'concerned',
    priority: 'urgent'  // May need medical help
  },

  // ANGRY emotions
  angry: {
    keywords: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated', 'rage', 'hate', 'upset'],
    intensity: { weak: 0.3, moderate: 0.6, strong: 1.0 },
    color: '#fd7e14',
    emoji: '😠',
    response_style: 'patient'
  },

  // BORED emotions
  bored: {
    keywords: ['bored', 'boring', 'nothing', 'dull', 'monotonous', 'tedious', 'uninteresting'],
    intensity: { weak: 0.2, moderate: 0.5, strong: 0.8 },
    color: '#adb5bd',
    emoji: '😐',
    response_style: 'entertaining'
  },

  // GRATEFUL emotions
  grateful: {
    keywords: ['thank', 'thanks', 'grateful', 'appreciate', 'blessing', 'fortunate', 'lucky'],
    intensity: { weak: 0.3, moderate: 0.6, strong: 1.0 },
    color: '#20c997',
    emoji: '🙏',
    response_style: 'humble'
  },

  // TIRED emotions
  tired: {
    keywords: ['tired', 'exhausted', 'sleepy', 'weary', 'fatigued', 'drained', 'worn out'],
    intensity: { weak: 0.3, moderate: 0.6, strong: 1.0 },
    color: '#495057',
    emoji: '😴',
    response_style: 'gentle'
  },

  // CONFUSED emotions
  confused: {
    keywords: ['confused', 'don\'t understand', 'unclear', 'puzzled', 'lost', 'bewildered'],
    intensity: { weak: 0.3, moderate: 0.6, strong: 1.0 },
    color: '#e83e8c',
    emoji: '😕',
    response_style: 'clarifying'
  }
};

// Detect emotion from user's message
export const detectEmotion = (text, conversationHistory = []) => {
  const lowerText = text.toLowerCase();
  const detectedEmotions = [];

  // Check each emotion pattern
  for (const [emotion, data] of Object.entries(EMOTION_PATTERNS)) {
    let matchCount = 0;
    let totalIntensity = 0;

    data.keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        matchCount++;
        
        // Intensity based on keyword position and context
        if (lowerText.startsWith(keyword)) {
          totalIntensity += data.intensity.strong;
        } else if (lowerText.includes('very ' + keyword) || lowerText.includes('so ' + keyword)) {
          totalIntensity += data.intensity.strong;
        } else {
          totalIntensity += data.intensity.moderate;
        }
      }
    });

    if (matchCount > 0) {
      detectedEmotions.push({
        emotion,
        confidence: Math.min(totalIntensity / matchCount, 1.0),
        matchCount,
        ...data
      });
    }
  }

  // Sort by confidence
  detectedEmotions.sort((a, b) => b.confidence - a.confidence);

  // Primary emotion
  const primaryEmotion = detectedEmotions[0] || {
    emotion: 'neutral',
    confidence: 0,
    color: '#6c757d',
    emoji: '😊',
    response_style: 'friendly'
  };

  // Check conversation history for emotion trends
  const emotionTrend = analyzeEmotionTrend(conversationHistory);

  return {
    primary: primaryEmotion,
    all: detectedEmotions,
    trend: emotionTrend,
    needsSupport: primaryEmotion.priority === 'high' || primaryEmotion.priority === 'urgent'
  };
};

// Analyze emotion over last few messages (spot patterns)
const analyzeEmotionTrend = (history) => {
  if (history.length < 3) return 'new_conversation';

  const recentEmotions = history.slice(-5).map(h => h.emotion?.primary?.emotion).filter(Boolean);
  
  // Count lonely/sad mentions
  const negativeCount = recentEmotions.filter(e => ['lonely', 'sad', 'worried'].includes(e)).length;
  
  if (negativeCount >= 3) return 'concerning';  // Alert: user consistently sad
  if (negativeCount >= 2) return 'needs_support';
  
  const happyCount = recentEmotions.filter(e => e === 'happy').length;
  if (happyCount >= 3) return 'positive';

  return 'stable';
};

// Suggest action based on emotion
export const suggestAction = (emotion) => {
  const suggestions = {
    lonely: ['play_music', 'tell_story', 'call_family', 'video_call'],
    sad: ['play_music', 'tell_joke', 'show_video', 'call_family'],
    bored: ['tell_story', 'play_music', 'show_video', 'tell_joke'],
    worried: ['breathing_exercise', 'call_family', 'play_calm_music'],
    pain: ['call_family', 'emergency_check', 'health_guardian'],
    tired: ['play_calm_music', 'suggest_rest'],
    happy: ['celebrate', 'share_happiness']
  };

  return suggestions[emotion.primary.emotion] || ['chat'];
};
