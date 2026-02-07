import { speak } from './voiceEngine';
import { getMusicByType } from './musicLibrary';
import { getRandomStory } from './storyDatabase';
import { getRandomJoke } from './jokeDatabase';

// ============================================
// ACTION HANDLER
// Executes all real actions
// ============================================

// PLAY MUSIC
export const playMusic = async (type = 'old_hindi') => {
  const song = getMusicByType(type);
  
  await speak(`I'm playing ${song.title} for you. Enjoy the music!`);
  
  return {
    action: 'show_youtube',
    data: song
  };
};

// PLAY VIDEO
export const playVideo = async (type) => {
  const videos = {
    devotional: [
      { title: 'Morning Prayers & Mantras', url: 'https://www.youtube.com/embed/tlHnDhLvAxg' },
      { title: 'Bhagavad Gita Explained', url: 'https://www.youtube.com/embed/jTW3chi_gqs' },
      { title: 'Vishnu Mantras', url: 'https://www.youtube.com/embed/zKOqNb0DhLk' }
    ],
    comedy: [
      { title: 'Clean Comedy Videos', url: 'https://www.youtube.com/embed/videoseries?list=PLiyjwVB09t5zpYxBvlLCPHf_M9QLxcQKX' }
    ],
    news: [
      { title: 'NDTV 24x7 LIVE', url: 'https://www.youtube.com/embed/WB-y7_ymPJ4' },
      { title: 'DD News LIVE', url: 'https://www.youtube.com/embed/jV73H3RZdzE' }
    ]
  };
  
  const playlist = videos[type] || videos.devotional;
  const video = playlist[Math.floor(Math.random() * playlist.length)];
  
  await speak(`Here's a video for you!`);
  
  return {
    action: 'show_youtube',
    data: video
  };
};

// TELL STORY
export const tellStory = async () => {
  const story = getRandomStory();
  
  await speak(`Let me tell you a beautiful story called "${story.title}".`);
  await new Promise(r => setTimeout(r, 2000));
  await speak(story.text);
  
  return {
    action: 'show_text',
    data: { title: story.title, text: story.text, category: story.category }
  };
};

// TELL JOKE
export const tellJoke = async () => {
  const joke = getRandomJoke();
  
  await speak(joke);
  await new Promise(r => setTimeout(r, 1000));
  await speak("Did you like that one? I have many more!");
  
  return {
    action: 'show_text',
    data: { text: joke, type: 'joke' }
  };
};

// CHECK WEATHER
export const checkWeather = async () => {
  try {
    // Free API - no key needed!
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=13.08&longitude=80.27&current_weather=true&temperature_unit=celsius'
    );
    
    if (!response.ok) throw new Error('Weather API failed');
    
    const data = await response.json();
    const temp = Math.round(data.current_weather.temperature);
    const windSpeed = data.current_weather.windspeed;
    const weatherCode = data.current_weather.weathercode;
    
    let condition = 'clear and sunny';
    let advice = 'Perfect day for a walk!';
    
    if (weatherCode >= 80) {
      condition = 'rainy with showers';
      advice = 'Stay indoors or carry an umbrella!';
    } else if (weatherCode >= 60) {
      condition = 'rainy';
      advice = 'Better to stay inside today!';
    } else if (weatherCode >= 40) {
      condition = 'cloudy';
      advice = 'Nice weather for a short walk!';
    } else if (temp > 35) {
      advice = 'Very hot! Stay hydrated and indoors if possible!';
    } else if (temp < 15) {
      advice = 'Cold day! Wear warm clothes if going out!';
    }
    
    const message = `The temperature right now is ${temp} degrees Celsius. It is ${condition}. ${advice}`;
    
    await speak(message);
    
    return {
      action: 'show_weather',
      data: { temp, condition, advice, windSpeed, weatherCode }
    };
  } catch (error) {
    const fallback = "I'm having trouble checking the weather right now. Please try again in a moment.";
    await speak(fallback);
    return {
      action: 'show_text',
      data: { text: fallback }
    };
  }
};

// MAKE CALL
export const makeCall = async (contactName) => {
  const contacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
  
  if (!contactName) {
    await speak("Who would you like to call? Tell me the name.");
    return {
      action: 'show_contacts',
      data: contacts
    };
  }
  
  const contact = contacts.find(c => 
    c.name.toLowerCase().includes(contactName.toLowerCase())
  );
  
  if (contact) {
    await speak(`Calling ${contact.name} now. Please wait.`);
    
    // Open phone dialer
    setTimeout(() => {
      window.location.href = `tel:${contact.phone}`;
    }, 1000);
    
    return {
      action: 'call_initiated',
      data: contact
    };
  } else {
    await speak(`I couldn't find ${contactName} in your contacts. Would you like to see your full contact list?`);
    return {
      action: 'show_contacts',
      data: contacts
    };
  }
};

// VIDEO CALL
export const videoCall = async (contactName) => {
  await speak("I'll help you start a video call. Opening WhatsApp now.");
  
  // Can open WhatsApp or other video call apps
  const contacts = JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
  const contact = contacts.find(c => 
    c.name.toLowerCase().includes(contactName?.toLowerCase() || '')
  );
  
  if (contact && contact.phone) {
    // Open WhatsApp video call (if WhatsApp installed)
    const whatsappUrl = `https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`;
    window.open(whatsappUrl, '_blank');
  }
  
  return {
    action: 'video_call_options',
    data: { contactName, contacts }
  };
};

// TELL TIME
export const tellTime = async () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
  
  const message = `The time is ${timeStr}.`;
  await speak(message);
  
  return {
    action: 'show_text',
    data: { text: message, time: timeStr }
  };
};

// TELL DATE
export const tellDate = async () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const message = `Today is ${dateStr}.`;
  await speak(message);
  
  return {
    action: 'show_text',
    data: { text: message, date: dateStr }
  };
};

// EXECUTE ACTION
export const executeAction = async (actionName, params = {}) => {
  try {
    switch (actionName) {
      case 'play_music':
        return await playMusic(params.type);
      case 'play_video':
        return await playVideo(params.type);
      case 'tell_story':
        return await tellStory();
      case 'tell_joke':
        return await tellJoke();
      case 'check_weather':
        return await checkWeather();
      case 'call_contact':
      case 'make_call':
        return await makeCall(params.name);
      case 'video_call':
        return await videoCall(params.name);
      case 'tell_time':
        return await tellTime();
      case 'tell_date':
        return await tellDate();
      default:
        console.warn('Unknown action:', actionName);
        return null;
    }
  } catch (error) {
    console.error('Action execution error:', error);
    await speak("Sorry, I had trouble doing that. Please try again.");
    return null;
  }
};
