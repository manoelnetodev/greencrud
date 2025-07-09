/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#01cc61', // Green
        secondary: '#006b33', // Darker Green
        accent: '#01cc61', // Green
        background: '#171717', // Dark background
        surface: '#262626', // Slightly lighter surface for cards/modals
        text: '#FFFFFF', // White text
        textSecondary: '#A3A3A3', // Gray text for secondary info
        border: '#2F2F2F', // Border color
        success: '#10b981', // Green for success
        warning: '#f59e0b', // Orange for warning
        error: '#ef4444', // Red for error
      },
      borderRadius: {
        'lg': '16px', // More rounded corners
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Use Inter as default sans-serif font
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in-up': {
          '0%': { transform: 'scale(0.95) translateY(10px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'scale-in-up': 'scale-in-up 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
