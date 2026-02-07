![ElderAI Swarm Cover](assets/cover.svg)

# ElderAI Swarm 🧓💙

**Never Leave Your Parents Alone** - A comprehensive, offline-first elderly care platform with 5 intelligent AI agents working together to ensure the safety, health, and well-being of elderly family members.

## 🌟 Features

### 🏥 Health Guardian
- Real-time health monitoring with vitals tracking (BP, heart rate, blood sugar, temperature)
- Daily health check-ins with mood and symptom tracking
- Medicine reminders with OCR prescription scanning
- Fall detection and emergency response
- Health reports for doctor visits
- Hydration tracking

### 💊 Medicine Buddy
- Smart medicine schedule management
- OCR-powered prescription scanning (offline using Tesseract.js)
- Intelligent timing planner (considers empty stomach, before/after meals)
- Voice reminders with multi-language support
- Compliance tracking and missed dose alerts
- Medicine inventory management

### 🚨 Emergency Responder
- One-tap emergency activation
- Automatic contact notification via SMS/WhatsApp
- Real-time location tracking
- Emergency history logging
- Test mode for safety drills
- Fall detection integration

### 📅 Life Coordinator
- Appointment scheduling and reminders
- Task management with completion tracking
- Bill payment reminders
- Grocery list management
- Family contact directory
- Daily routine tracking
- Voice memo recording
- Transport booking assistance

### 🤖 Daily Companion
- AI-powered conversational companion
- Emotion detection and empathetic responses
- Music, video, and story recommendations
- Voice interaction (speech recognition & synthesis)
- Weather updates and time/date assistance
- Memory system that remembers conversations
- Joke telling and entertainment

## 🎯 Fully Responsive Design

All 51 components have been converted to be **100% responsive** across all devices:
- **Mobile-first approach** with fluid scaling using `clamp()`
- **Touch-friendly** with 44px minimum touch targets (WCAG 2.1 Level AA compliant)
- **Smart text sizing** that scales from smartwatch (240px) to desktop (1920px+)
- **Optimized layouts** that adapt seamlessly to any screen size
- **Accessibility-focused** with proper contrast and readable fonts

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open: **http://localhost:3000/**

## 📱 Routes

- `/` — Landing page with feature overview
- `/family` — Family Dashboard (monitor elderly family member)
- `/elder` — Elder Interface (simplified, large-button interface for elderly)

## 💾 Offline-First Architecture

- ✅ **No external APIs required** - works completely offline
- ✅ **Rule-based AI** with 800+ conversation patterns
- ✅ **localStorage persistence** - no backend needed
- ✅ **OCR prescription scanning** using Tesseract.js (offline)
- ✅ **Voice recognition & synthesis** using browser APIs
- ✅ **Progressive Web App** ready

## 🔧 Tech Stack

- **React 18** - UI framework
- **Vite 7.3** - Build tool & dev server
- **Tailwind CSS** - Styling with responsive utilities
- **Lucide React** - Icon library
- **Tesseract.js** - Offline OCR for prescriptions
- **Web Speech API** - Voice recognition & synthesis
- **Geolocation API** - Location tracking for emergencies
- **LocalStorage** - Data persistence

## 🌐 Optional: AI-Powered Chat (Daily Companion)

By default, the Daily Companion uses rule-based responses. You can optionally enable full AI chat:

### Option 1: Ollama (Local LLM - Recommended)

1. Install and run [Ollama](https://ollama.ai)
2. Pull a model: `ollama pull llama3.1`
3. Create `.env` file:

```env
VITE_AI_MODE=ollama
VITE_AI_BASE_URL=http://localhost:11434
VITE_AI_MODEL=llama3.1
```

### Option 2: OpenAI-Compatible API

```env
VITE_AI_MODE=openai
VITE_AI_BASE_URL=https://api.openai.com/v1
VITE_AI_API_KEY=your-api-key
VITE_AI_MODEL=gpt-4
```

## 🎨 Responsive Conversion

All components use the following responsive patterns:

### Text Sizing
```css
/* Old (Fixed) */
text-xl → fontSize: 'clamp(1.125rem, 4.5vw, 1.25rem)'

/* Touch Targets (WCAG Compliant) */
height: 'clamp(3rem, 10vw, 3.5rem)'
minHeight: '44px'

/* Spacing */
padding: 'clamp(1rem, 3vw, 1.5rem)'
gap: 'clamp(0.75rem, 2vw, 1rem)'
```

### Icon Sizing
```jsx
React.cloneElement(icon, { 
  style: { 
    width: 'clamp(1.25rem, 5vw, 1.5rem)', 
    height: 'clamp(1.25rem, 5vw, 1.5rem)' 
  } 
})
```

## 📊 Project Structure

```
elderai-swarm/
├── src/
│   ├── components/
│   │   ├── agents/          # 5 AI agents
│   │   ├── health/          # Health tracking components
│   │   ├── life/            # Life coordination features
│   │   ├── shared/          # Reusable components
│   │   └── layout/          # Navigation & layout
│   ├── pages/               # Main route pages
│   ├── utils/               # Utilities & helpers
│   │   ├── companion/       # AI companion engine
│   │   ├── prescriptionAnalyser.js  # OCR scanning
│   │   ├── healthCalculations.js    # Health scoring
│   │   └── ...
│   ├── data/                # Sample data & schedules
│   ├── i18n/                # Internationalization
│   └── styles/              # Global styles
├── public/                  # Static assets
└── assets/                  # Images & icons
```

## 🌍 Multi-Language Support

Built-in support for:
- English (en-IN)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)

## 🔐 Privacy & Security

- **No data leaves your device** - everything stored locally
- **No cloud dependencies** - works completely offline
- **No tracking or analytics** - your data is yours
- **Open source** - audit the code yourself

## 🎯 Target Users

### For Elderly (Elder Interface)
- **Large, touch-friendly buttons** (4xl text)
- **Simple navigation** with voice commands
- **Clear visual feedback** with color-coded status
- **Voice-first interaction** for accessibility

### For Family (Family Dashboard)
- **Real-time monitoring** of health metrics
- **Alert notifications** for emergencies
- **Activity timeline** to see daily patterns
- **Quick access** to all agent features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 💡 Acknowledgments

Built with love for elderly care and family peace of mind.

**Never Leave Your Parents Alone** 💙

