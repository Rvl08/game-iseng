/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'game-bg': '#0a0a12',
        'game-bg-gradient': '#12121f',
        'game-primary': '#ff3366',
        'game-secondary': '#00ffcc',
        'game-accent': '#ffcc00',
        'game-warning': '#ff6600',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      animation: {
        'float': 'float 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,51,102,0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255,51,102,0.8)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
}
