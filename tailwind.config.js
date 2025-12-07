/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          ink: '#0E0E0F',
          graphite: '#1A1A1C',
          charcoal: '#242426',
          slate: '#2E2F31',
        },
        text: {
          high: '#F8F8FA',
          soft: '#E4E4E6',
          dim: '#8D8D92',
        },
        accent: {
          mint: '#78FBA6',
        },
        track: {
          pink: '#FF66D4',
          blue: '#52D0FF',
          yellow: '#FFD75A',
          orange: '#FF8A4F',
          purple: '#9A5BFF',
          lime: '#C9FF6A',
          teal: '#4BFAC9',
          coral: '#FF5C7A',
        }
      },
      fontFamily: {
        sans: ['Quicksand', 'Nunito', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}

