/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'industrial': {
          900: '#0a0f14',
          800: '#131b24',
          700: '#1c2833',
          600: '#263545',
          500: '#3a4d5e',
          400: '#5a7289',
          300: '#8aa3b8',
          200: '#b8ccd9',
          100: '#e0ebf2',
        },
        'relay-on': '#00ff88',
        'relay-off': '#ff3366',
        'relay-pending': '#ffaa00',
        'accent': {
          cyan: '#00d4ff',
          orange: '#ff6b35',
          purple: '#a855f7',
        }
      },
      fontFamily: {
        'display': ['Orbitron', 'monospace'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'body': ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '100%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 20px #00d4ff',
        'neon-green': '0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 20px #00ff88',
        'neon-red': '0 0 5px #ff3366, 0 0 10px #ff3366, 0 0 20px #ff3366',
        'neon-orange': '0 0 5px #ff6b35, 0 0 10px #ff6b35, 0 0 20px #ff6b35',
      }
    },
  },
  plugins: [],
}
