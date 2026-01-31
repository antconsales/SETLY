/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // SETLY Color Palette
        'setly-black': '#0A0A0A',
        'setly-dark': '#121212',
        'setly-gray': '#1A1A1A',
        'setly-border': '#2A2A2A',
        'setly-text': '#E5E5E5',
        'setly-muted': '#666666',
        'setly-accent': '#4ADE80',
        'setly-glow': 'rgba(255,255,255,0.1)',
      },
      fontFamily: {
        'mono': ['SpaceMono_400Regular', 'monospace'],
        'mono-bold': ['SpaceMono_700Bold', 'monospace'],
      },
      borderWidth: {
        '0.5': '0.5px',
      },
    },
  },
  plugins: [],
};
