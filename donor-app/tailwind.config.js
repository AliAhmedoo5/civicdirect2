/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Fintech Premium Colors
        fintech: {
          dark: '#0A0E17',
          card: '#131B2A',
          border: '#1F2937',
          cyan: '#06B6D4',
          green: '#10B981',
          accent: '#00D4FF',
        }
      }
    },
  },
  plugins: [],
}
