/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          DEFAULT: '#005EA2',
          light: '#005EA2', // with opacity 10%
          lighter: '#005EA2', // with opacity 2%
          dark: '#1162D7',
        },
        secondary: {
          DEFAULT: '#4F79CC',
          teal: '#3DC8C3',
          tealLight: '#3DC8C3', // with opacity 5%
        },
        // Accent colors
        success: '#6EC68B',
        danger: '#FF6B6B',
        // Neutral colors
        dark: {
          DEFAULT: '#2C3E50',
          gray: '#292929',
        },
        gray: {
          DEFAULT: '#5B5B5B',
          light: '#F2F4F7',
          lighter: '#F4F7FC',
          lightest: '#F9FAFB',
          medium: '#CCCCCC',
          blue: '#99A9B6',
        },
        // Backgrounds
        bg: {
          card: '#FFFFFF',
          page: '#F2F4F7',
          subtle: '#E7EEF4', 
          disabled: '#D1DAE6', // with opacity 35%
        },
      },
    },
  },
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}