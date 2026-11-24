/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans Variable"', 'system-ui', 'sans-serif'] },
      colors: {
        rbr: {
          50: '#EEF5FA', 100: '#D9E8F3', 200: '#B3D1E7', 300: '#86B4D5', 400: '#4F8FBD',
          500: '#2E78AD', 600: '#23669A', 700: '#1C5380', 800: '#174266', 900: '#11324D', 950: '#0B2133',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(17,50,77,.05), 0 4px 16px rgba(17,50,77,.06)',
        lift: '0 2px 4px rgba(17,50,77,.06), 0 10px 28px rgba(17,50,77,.12)',
      },
      borderRadius: { xl2: '0.875rem' },
    },
  },
  plugins: [],
}
