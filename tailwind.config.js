/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          blue: '#3b82f6',
          pink: '#ec4899',
          purple: '#8b5cf6',
        },
        // High-contrast palette for accessibility (WCAG AA compliant)
        hc: {
          primary: '#9333ea',      // High contrast purple
          secondary: '#2563eb',    // High contrast blue
          success: '#16a34a',      // High contrast green
          error: '#dc2626',        // High contrast red
          warning: '#ea580c',      // High contrast orange
          text: '#ffffff',         // Pure white for text
          textSecondary: '#e5e7eb', // Light gray for secondary text
          bg: '#111827',           // Dark background
          bgSecondary: '#1f2937',  // Slightly lighter background
          border: '#4b5563',       // Medium gray for borders
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
