/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6'
        },
        success: {
          DEFAULT: '#10B981'
        },
        warning: {
          DEFAULT: '#F59E0B'
        },
        danger: {
          DEFAULT: '#EF4444'
        },
        'app-bg': {
          DEFAULT: '#f19066'
        }
      },
      borderRadius: {
        card: '12px'
      },
      boxShadow: {
        card: '0 8px 24px rgba(15, 23, 42, 0.08)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        pulseSoft: 'pulseSoft 1.5s ease-in-out infinite',
        floatIn: 'floatIn 450ms ease-out'
      }
    }
  },
  plugins: []
};
