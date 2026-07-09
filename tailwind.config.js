/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#ef3837', dark: '#d92300', light: '#fff1f0' },
        purple:  { brand: '#7c3aed', dark: '#6d28d9', light: '#ede9fe' },
      },
      fontFamily: {
        sans: ['Signika', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card:    '0 1px 6px rgba(0,0,0,0.06)',
        'card-md': '0 2px 12px rgba(0,0,0,0.08)',
        primary: '0 4px 14px rgba(239,56,55,0.28)',
        purple:  '0 4px 14px rgba(124,58,237,0.28)',
      },
      animation: {
        'fade-up':   'fadeUp 0.35s ease both',
        'slide-up':  'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        shimmer:     'shimmer 1.4s infinite',
        wsping:      'wsping 2s ease-in-out infinite',
        lspin:       'lspin 0.7s linear infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        wsping:  { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.45 } },
        lspin:   { to: { transform: 'rotate(360deg)' } },
      },
    },
  },
  plugins: [],
};
