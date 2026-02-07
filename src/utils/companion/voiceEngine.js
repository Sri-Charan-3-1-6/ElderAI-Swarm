// ============================================
// VOICE ENGINE - Handles all speech
// ============================================

let recognition = null;
let synthesis = window.speechSynthesis;
let currentUtterance = null;

// Initialize speech recognition (browser built-in)
export const initVoiceRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported');
    return null;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;           // Keep listening
  recognition.interimResults = true;        // Show partial results
  recognition.lang = 'en-IN';              // Indian English
  recognition.maxAlternatives = 3;         // Multiple interpretations

  return recognition;
};

// Start listening
export const startListening = (onResult, onEnd) => {
  if (!recognition) recognition = initVoiceRecognition();
  if (!recognition) return false;

  recognition.onresult = (event) => {
    const results = event.results;
    const latest = results[results.length - 1];
    
    if (latest.isFinal) {
      const text = latest[0].transcript;
      const confidence = latest[0].confidence;
      onResult({ text, confidence, isFinal: true });
    } else {
      const text = latest[0].transcript;
      onResult({ text, confidence: 0, isFinal: false });
    }
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };

  try {
    recognition.start();
    return true;
  } catch (error) {
    console.error('Failed to start recognition:', error);
    return false;
  }
};

// Stop listening
export const stopListening = () => {
  if (recognition) {
    recognition.stop();
  }
};

// SPEAK with natural voice
export const speak = (text, options = {}) => {
  return new Promise((resolve) => {
    // Stop any current speech
    if (synthesis.speaking) {
      synthesis.cancel();
    }

    // Small delay to fix Chrome bug
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Voice settings for elderly-friendly speech
      utterance.lang = options.lang || 'en-IN';
      utterance.rate = options.rate || 0.85;     // Slower = clearer
      utterance.pitch = options.pitch || 1.1;    // Slightly higher = friendlier
      utterance.volume = options.volume || 1.0;  // Max volume

      // Select best voice (prefer female Indian English if available)
      const voices = synthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.lang.includes('en-IN') && v.name.toLowerCase().includes('female')
      ) || voices.find(v => v.lang.includes('en')) || voices[0];
      
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      currentUtterance = utterance;
      synthesis.speak(utterance);
    }, 100);
  });
};

// Stop speaking
export const stopSpeaking = () => {
  if (synthesis.speaking) {
    synthesis.cancel();
  }
};

// Check if currently speaking
export const isSpeaking = () => {
  return synthesis.speaking;
};

// Get available voices
export const getVoices = () => {
  return synthesis.getVoices();
};

// Load voices (call on app start)
export const loadVoices = (callback) => {
  let voices = synthesis.getVoices();
  
  if (voices.length > 0) {
    callback(voices);
  } else {
    synthesis.onvoiceschanged = () => {
      voices = synthesis.getVoices();
      callback(voices);
    };
  }
};
