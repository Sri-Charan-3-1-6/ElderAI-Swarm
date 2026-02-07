# 📱 Quick Reference: Responsive Breakpoints

## 🎯 At a Glance

| Device Type | Width Range | Voice Button | Quick Actions | Text Size |
|-------------|-------------|--------------|---------------|-----------|
| ⌚ **Smartwatch** | 240-320px | 80-100px | 2 columns | 12-14px |
| 📱 **Mobile S** | 320-375px | 110-120px | 2 columns | 14-16px |
| 📱 **Mobile M** | 375-425px | 130-140px | 2-3 columns | 16-18px |
| 📱 **Mobile L** | 425-600px | 150px | 3-4 columns | 18-20px |
| 📋 **Tablet** | 600-1024px | 160-170px | 4 columns | 20-22px |
| 🖥️ **Desktop** | 1024px+ | 180px | 4 columns | 22-24px |

---

## 🎨 CSS Patterns

### Text Sizing
```javascript
// Small (labels, secondary)
fontSize: 'clamp(12px, 3vw, 16px)'

// Medium (body text)
fontSize: 'clamp(16px, 4vw, 24px)'

// Large (headings)
fontSize: 'clamp(20px, 5vw, 36px)'

// Extra Large (emphasis)
fontSize: 'clamp(32px, 8vw, 48px)'
```

### Spacing
```javascript
// Tight
clamp(5px, 1.5vw, 10px)

// Normal
clamp(10px, 3vw, 20px)

// Generous
clamp(15px, 4vw, 25px)
```

### Buttons
```javascript
// Small (60-100px)
clamp(60px, 15vw, 100px)

// Medium (80-120px)
clamp(80px, 20vw, 120px)

// Large (120-180px)
clamp(120px, 30vw, 180px)
```

---

## 🔧 How to Adjust

### Make Text Larger
```javascript
// Before
fontSize: 'clamp(16px, 4vw, 24px)'

// After (increase max)
fontSize: 'clamp(16px, 4vw, 28px)'
```

### Make Button Smaller on Mobile
```javascript
// Before
width: 'clamp(120px, 30vw, 180px)'

// After (decrease min)
width: 'clamp(100px, 30vw, 180px)'
```

### Add More Padding
```javascript
// Before
padding: 'clamp(10px, 3vw, 20px)'

// After (increase both)
padding: 'clamp(15px, 4vw, 25px)'
```

---

## 📱 Device Pixel Widths

### Common Devices
```
Apple Watch Series 7+:    396px
iPhone SE:                375px
iPhone 12/13:             390px
iPhone 14 Pro:            393px
iPhone 14 Pro Max:        430px
Galaxy S21:               360px
Pixel 6:                  393px
iPad Mini:                768px
iPad Air:                 820px
iPad Pro:                 1024px
MacBook Air:              1280px
Desktop HD:               1920px
Desktop 4K:               3840px
```

---

## ✅ Quick Checklist

Before deploying, verify:

- [ ] Text readable on 240px screen
- [ ] Voice button ≥ 80px on smallest screen
- [ ] No horizontal scroll on any size
- [ ] Touch targets ≥ 44x44px (accessibility)
- [ ] YouTube maintains 16:9 ratio
- [ ] Quick actions show 2-4 columns appropriately
- [ ] All animations smooth
- [ ] No text overflow

---

## 🚀 Test Commands

### Start Dev Server
```bash
cd "d:\ElderAI Swarm\elderai-swarm"
npm run dev
```

### Open in Browser
```
http://localhost:3000
```

### DevTools Shortcut
```
F12 (Open DevTools)
Ctrl+Shift+M (Toggle Device Toolbar)
```

---

## 📖 Full Documentation

- [Complete Responsive Guide](./RESPONSIVE_DESIGN_COMPLETE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [AI Companion Docs](./AI_COMPANION_COMPLETE.md)

---

**Status**: ✅ Fully Responsive  
**Version**: 2.0.0  
**Updated**: December 2024
