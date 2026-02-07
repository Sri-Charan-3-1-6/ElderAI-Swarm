import { useState, useEffect, useRef } from 'react';
import { startListening, stopListening, speak, stopSpeaking } from '../../utils/companion/voiceEngine';
import { getResponse } from '../../utils/companion/conversationBrain';
import { executeAction } from '../../utils/companion/actionHandler';
import { getUserProfile } from '../../utils/companion/memorySystem';

const AICompanion = () => {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [actionDisplay, setActionDisplay] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [userProfile] = useState(getUserProfile());
  
  const scrollRef = useRef();

  // Initial greeting when component mounts
  useEffect(() => {
    greetUser();
    
    // Cleanup on unmount or tab change
    return () => {
      stopListening();
      stopSpeaking();
      setIsTalking(false);
      setIsListening(false);
    };
  }, []);

  // Stop speaking when user switches tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSpeaking();
        stopListening();
        setIsTalking(false);
        setIsListening(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-scroll to bottom when new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // GREET USER
  const greetUser = async () => {
    const hour = new Date().getHours();
    const name = userProfile.name || 'dear friend';
    
    let timeGreeting = '';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';
    
    const message = `${timeGreeting} ${name}! I'm your AI companion. Hold the mic button and talk to me whenever you need.`;
    
    // Show greeting but don't auto-speak (let user initiate)
    setConversation([{
      type: 'ai',
      text: message,
      timestamp: Date.now()
    }]);
  };

  // START LISTENING
  const handleStartListening = () => {
    if (isTalking) {
      console.warn('AI is speaking, cannot listen');
      return;
    }
    
    const started = startListening(
      (result) => {
        if (result.isFinal) {
          handleUserMessage(result.text);
          setCurrentText('');
        } else {
          setCurrentText(result.text);
        }
      },
      () => {
        setIsListening(false);
        setCurrentText('');
      }
    );
    
    if (started) {
      setIsListening(true);
      setCurrentText('Listening...');
    } else {
      alert('Voice recognition not supported on this device. Please type your message instead.');
    }
  };

  // STOP LISTENING
  const handleStopListening = () => {
    stopListening();
    setIsListening(false);
    setCurrentText('');
  };

  // STOP SPEAKING
  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsTalking(false);
  };

  // PROCESS USER MESSAGE
  const handleUserMessage = async (text) => {
    if (!text || text.trim() === '') return;
    
    // Add user message to conversation
    const userMsg = {
      type: 'user',
      text: text,
      timestamp: Date.now()
    };
    setConversation(prev => [...prev, userMsg]);
    
    // Get AI response
    const response = await getResponse(text, conversation);
    setEmotion(response.emotion);
    
    // Speak AI response
    setIsTalking(true);
    await speak(response.text);
    setIsTalking(false);
    
    // Add AI response to conversation
    const aiMsg = {
      type: 'ai',
      text: response.text,
      emotion: response.emotion,
      timestamp: Date.now()
    };
    setConversation(prev => [...prev, aiMsg]);
    
    // Execute actions if any
    if (response.actions && response.actions.length > 0) {
      const actionResult = await executeAction(response.actions[0]);
      if (actionResult) {
        setActionDisplay(actionResult);
      }
    }
  };

  // TEXT INPUT (for those who prefer typing)
  const handleTextSubmit = (e) => {
    e.preventDefault();
    const input = e.target.elements.textInput;
    const text = input.value.trim();
    if (text) {
      handleUserMessage(text);
      input.value = '';
    }
  };

  // QUICK ACTIONS
  const handleQuickAction = async (action, params = {}) => {
    // Stop any ongoing speech first
    stopSpeaking();
    setIsTalking(false);
    
    // Execute the action
    const result = await executeAction(action, params);
    if (result) {
      setActionDisplay(result);
    }
  };

  return (
    <div className="companion-container" style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #e8f4f8 0%, #f8f9fa 100%)',
      overflow: 'hidden'
    }}>
      
      {/* HEADER */}
      <div className="companion-header" style={{
        padding: 'clamp(10px, 3vw, 20px)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        flexShrink: 0
      }}>
        <h1 style={{ 
          fontSize: 'clamp(20px, 5vw, 36px)', 
          margin: '0 0 clamp(5px, 1vw, 10px) 0', 
          fontWeight: 'bold',
          lineHeight: 1.2
        }}>
          💬 AI Companion
        </h1>
        <div style={{ 
          fontSize: 'clamp(14px, 3vw, 20px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 'clamp(5px, 1vw, 10px)',
          flexWrap: 'wrap'
        }}>
          {isTalking && <span>🗣️ Speaking...</span>}
          {isListening && <span className="pulse">👂 Listening...</span>}
          {!isTalking && !isListening && <span>✨ Always here</span>}
        </div>
      </div>

      {/* CONVERSATION AREA */}
      <div className="conversation-area" style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 'clamp(10px, 3vw, 20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(10px, 2vw, 15px)',
        WebkitOverflowScrolling: 'touch'
      }}>
        {conversation.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div className="message-bubble" style={{
              maxWidth: 'clamp(200px, 85%, 600px)',
              padding: 'clamp(12px, 3vw, 20px) clamp(15px, 4vw, 25px)',
              borderRadius: msg.type === 'user' ? 'clamp(15px, 3vw, 25px) clamp(15px, 3vw, 25px) 5px clamp(15px, 3vw, 25px)' : 'clamp(15px, 3vw, 25px) clamp(15px, 3vw, 25px) clamp(15px, 3vw, 25px) 5px',
              fontSize: 'clamp(16px, 4vw, 24px)',
              lineHeight: '1.6',
              backgroundColor: msg.type === 'user' ? '#667eea' : 'white',
              color: msg.type === 'user' ? 'white' : '#333',
              boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
              wordWrap: 'break-word',
              wordBreak: 'break-word'
            }}>
              {msg.type === 'ai' && (
                <span style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginRight: 'clamp(5px, 1.5vw, 10px)' }}>🤖</span>
              )}
              {msg.text}
              {msg.emotion && msg.emotion.primary && (
                <div style={{ 
                  fontSize: 'clamp(14px, 3vw, 18px)', 
                  marginTop: 'clamp(5px, 1.5vw, 10px)', 
                  opacity: 0.8,
                  fontStyle: 'italic'
                }}>
                  {msg.emotion.primary.emoji} {msg.emotion.primary.emotion}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* CURRENT LISTENING TEXT */}
        {currentText && (
          <div className="listening-indicator" style={{
            padding: 'clamp(12px, 3vw, 20px)',
            backgroundColor: '#fff3cd',
            borderRadius: 'clamp(10px, 2vw, 15px)',
            fontSize: 'clamp(16px, 3.5vw, 22px)',
            border: '2px dashed #ffc107',
            textAlign: 'center',
            wordBreak: 'break-word'
          }}>
            {currentText}
          </div>
        )}
        
        <div ref={scrollRef} />
      </div>

      {/* ACTION DISPLAY (YouTube, Weather, Stories, etc) */}
      {actionDisplay && (
        <div className="action-display" style={{
          padding: 'clamp(10px, 3vw, 20px)',
          backgroundColor: 'white',
          borderTop: '2px solid #ddd',
          maxHeight: 'clamp(300px, 50vh, 600px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          flexShrink: 0
        }}>
          {/* YouTube Player */}
          {actionDisplay.action === 'show_youtube' && (
            <div className="youtube-container">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'clamp(10px, 2vw, 15px)',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <h3 style={{ 
                  fontSize: 'clamp(18px, 4vw, 26px)', 
                  margin: 0,
                  flex: 1,
                  minWidth: '150px'
                }}>
                  🎵 {actionDisplay.data.title}
                </h3>
                <button
                  onClick={() => setActionDisplay(null)}
                  style={{
                    padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 24px)',
                    fontSize: 'clamp(16px, 3vw, 20px)',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'clamp(8px, 1.5vw, 10px)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ✕ Close
                </button>
              </div>
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: 'clamp(10px, 2vw, 15px)'
              }}>
                <iframe
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  src={actionDisplay.data.url + '?autoplay=1'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
          
          {/* Weather Display */}
          {actionDisplay.action === 'show_weather' && (
            <div className="weather-card" style={{
              padding: 'clamp(15px, 4vw, 25px)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 'clamp(12px, 3vw, 20px)',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 'clamp(48px, 12vw, 72px)', marginBottom: 'clamp(10px, 2vw, 15px)' }}>
                {actionDisplay.data.weatherCode >= 60 ? '🌧️' : actionDisplay.data.temp > 30 ? '☀️' : '⛅'}
              </div>
              <div style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: 'bold', marginBottom: 'clamp(5px, 1.5vw, 10px)' }}>
                {actionDisplay.data.temp}°C
              </div>
              <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', marginBottom: 'clamp(10px, 2vw, 15px)' }}>
                {actionDisplay.data.condition}
              </div>
              <div style={{ fontSize: 'clamp(16px, 3vw, 20px)', opacity: 0.9 }}>
                {actionDisplay.data.advice}
              </div>
              <button
                onClick={() => setActionDisplay(null)}
                style={{
                  marginTop: 'clamp(15px, 3vw, 20px)',
                  padding: 'clamp(10px, 2vw, 15px) clamp(20px, 4vw, 30px)',
                  fontSize: 'clamp(16px, 3vw, 20px)',
                  backgroundColor: 'white',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: 'clamp(8px, 2vw, 10px)',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Got it!
              </button>
            </div>
          )}
          
          {/* Text Display (Stories, Jokes) */}
          {actionDisplay.action === 'show_text' && (
            <div style={{
              padding: 'clamp(15px, 4vw, 25px)',
              backgroundColor: '#f8f9fa',
              borderRadius: 'clamp(10px, 3vw, 15px)',
              border: '2px solid #dee2e6'
            }}>
              {actionDisplay.data.title && (
                <h3 style={{ fontSize: 'clamp(20px, 5vw, 28px)', marginBottom: 'clamp(10px, 2vw, 15px)', color: '#495057' }}>
                  📖 {actionDisplay.data.title}
                </h3>
              )}
              <div style={{ 
                fontSize: 'clamp(16px, 4vw, 24px)', 
                lineHeight: '1.8',
                color: '#212529',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {actionDisplay.data.text}
              </div>
              <button
                onClick={() => setActionDisplay(null)}
                style={{
                  marginTop: 'clamp(15px, 3vw, 20px)',
                  padding: 'clamp(10px, 2vw, 15px) clamp(20px, 4vw, 30px)',
                  fontSize: 'clamp(16px, 3vw, 20px)',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'clamp(8px, 2vw, 10px)',
                  cursor: 'pointer'
                }}
              >
                Thank you!
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div style={{
        padding: 'clamp(10px, 3vw, 20px)',
        backgroundColor: 'white',
        borderTop: '2px solid #ddd',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(80px, 20vw, 120px), 1fr))',
        gap: 'clamp(8px, 2vw, 15px)'
      }}>
        <button
          onClick={() => handleQuickAction('play_music', { type: 'old_hindi' })}
          style={quickButtonStyle}
          disabled={isTalking || isListening}
        >
          🎵<br/><span style={{ fontSize: 'clamp(12px, 3vw, 16px)' }}>Music</span>
        </button>
        <button
          onClick={() => handleQuickAction('tell_story')}
          style={quickButtonStyle}
          disabled={isTalking || isListening}
        >
          📖<br/><span style={{ fontSize: 'clamp(12px, 3vw, 16px)' }}>Story</span>
        </button>
        <button
          onClick={() => handleQuickAction('tell_joke')}
          style={quickButtonStyle}
          disabled={isTalking || isListening}
        >
          😂<br/><span style={{ fontSize: 'clamp(12px, 3vw, 16px)' }}>Joke</span>
        </button>
        <button
          onClick={() => handleQuickAction('check_weather')}
          style={quickButtonStyle}
          disabled={isTalking || isListening}
        >
          🌤️<br/><span style={{ fontSize: 'clamp(12px, 3vw, 16px)' }}>Weather</span>
        </button>
      </div>

      {/* VOICE BUTTON */}
      <div style={{
        padding: 'clamp(15px, 3vw, 20px)',
        backgroundColor: 'white',
        borderTop: '2px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'clamp(10px, 2vw, 15px)'
      }}>
        {/* Voice Control Buttons */}
        <div style={{ display: 'flex', gap: 'clamp(15px, 3vw, 20px)', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Big Microphone Button */}
          <button
            onMouseDown={handleStartListening}
            onMouseUp={handleStopListening}
            onTouchStart={handleStartListening}
            onTouchEnd={handleStopListening}
            disabled={isTalking}
            style={{
              width: 'clamp(120px, 30vw, 180px)',
              height: 'clamp(120px, 30vw, 180px)',
              borderRadius: '50%',
              fontSize: 'clamp(48px, 12vw, 72px)',
              backgroundColor: isListening ? '#dc3545' : isTalking ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              cursor: isTalking ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
              position: 'relative',
              opacity: isTalking ? 0.6 : 1,
              minWidth: '80px',
              minHeight: '80px'
            }}
            className={isListening ? 'pulse' : ''}
          >
            {isListening ? '🎤' : isTalking ? '🗣️' : '💬'}
          </button>
          
          {/* Stop Speaking Button */}
          {isTalking && (
            <button
              onClick={handleStopSpeaking}
              style={{
                width: 'clamp(80px, 18vw, 100px)',
                height: 'clamp(80px, 18vw, 100px)',
                borderRadius: '50%',
                fontSize: 'clamp(32px, 8vw, 40px)',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite',
                minWidth: '60px',
                minHeight: '60px'
              }}
            >
              ⏹️
            </button>
          )}
        </div>
        
        <div style={{ fontSize: 'clamp(14px, 3.5vw, 20px)', color: '#6c757d', textAlign: 'center', fontWeight: 'bold', padding: '0 10px' }}>
          {isTalking ? '🗣️ AI is speaking... (Tap ⏹️ to stop)' : isListening ? '👂 Listening... Release to send' : '💬 Hold mic to talk'}
        </div>
        
        {/* Text Input (Alternative) */}
        <form onSubmit={handleTextSubmit} style={{ width: '100%', maxWidth: '600px', padding: '0 clamp(10px, 2vw, 15px)' }}>
          <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 10px)', flexWrap: 'nowrap' }}>
            <input
              name="textInput"
              type="text"
              placeholder="Or type your message..."
              style={{
                flex: 1,
                padding: 'clamp(10px, 2vw, 15px) clamp(15px, 3vw, 20px)',
                fontSize: 'clamp(14px, 3.5vw, 20px)',
                borderRadius: 'clamp(15px, 4vw, 25px)',
                border: '2px solid #dee2e6',
                outline: 'none',
                minWidth: '100px'
              }}
              disabled={isTalking || isListening}
            />
            <button
              type="submit"
              style={{
                padding: 'clamp(10px, 2vw, 15px) clamp(20px, 4vw, 30px)',
                fontSize: 'clamp(20px, 5vw, 24px)',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 'clamp(15px, 4vw, 25px)',
                cursor: 'pointer',
                minWidth: '60px'
              }}
              disabled={isTalking || isListening}
            >
              →
            </button>
          </div>
        </form>
      </div>

      {/* STYLES */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 20px rgba(220, 53, 69, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 8px 30px rgba(220, 53, 69, 0.5); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

// Quick button style - Fully responsive
const quickButtonStyle = {
  padding: 'clamp(12px, 3vw, 20px) clamp(8px, 2vw, 10px)',
  fontSize: 'clamp(20px, 5vw, 28px)',
  backgroundColor: '#f8f9fa',
  border: '2px solid #dee2e6',
  borderRadius: 'clamp(10px, 3vw, 15px)',
  cursor: 'pointer',
  textAlign: 'center',
  lineHeight: '1.3',
  transition: 'all 0.2s',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'clamp(3px, 1vw, 5px)',
  minHeight: 'clamp(70px, 15vw, 100px)'
};

export default AICompanion;
