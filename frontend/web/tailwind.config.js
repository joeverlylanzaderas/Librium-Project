// frontend/web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Sidebar palette
        espresso: '#1F150C',
        mahogany: '#412D15', 
        parchment: '#FBF5DD',
        'parchment-dark': '#EFE9CE',
        brass: '#FFC85C',
        amber: '#F69D39',
        'text-main': '#2D1F10',
        'text-muted-sb': '#706251',
        
        // Auth specific
        'auth-bg': '#1E120C',
        'card-bg': '#F4EFE0',
        'card-title': '#281711',
        'label': '#513E2F',
        'input-border': '#DFD6C2',
        'input-placeholder': '#A1927F',
        'checkbox-border': '#8E7A66',
        'utility-text': '#463527',
        
        // Error states
        'error-bg': '#FCE8E6',
        'error-border': '#F5C2C2',
        'error-text': '#A83232',
        
        // Success states
        'success-bg': '#E8F5E9',
        'success-border': '#C8E6C9',
        'success-text': '#2E7D32',
      },
      fontFamily: {
        'literata': ['Literata', 'Georgia', 'serif'],
        'literata-light': ['Literata', 'Georgia', 'serif'],
        'literata-medium': ['Literata', 'Georgia', 'serif'],
        'literata-semibold': ['Literata', 'Georgia', 'serif'],
        'baskerville': ['Libre Baskerville', 'Georgia', 'serif'],
        'baskerville-bold': ['Libre Baskerville', 'Georgia', 'serif'],
        'baskerville-italic': ['Libre Baskerville', 'Georgia', 'serif'],
        'gloock': ['Gloock', 'Georgia', 'serif'],
        'display': ['Gloock', 'Georgia', 'serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.9375rem', { lineHeight: '1.6rem' }],
        'md': ['1rem', { lineHeight: '1.6rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.375rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.75rem', { lineHeight: '2rem' }],
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '4xl': ['3rem', { lineHeight: '3.25rem' }],
      },
      spacing: {
        'sidebar': '260px',
        'topbar': '56px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(31, 21, 12, 0.08)',
        'card-hover': '0 8px 24px rgba(31, 21, 12, 0.12)',
        'amber': '0 0 0 3px rgba(246, 157, 57, 0.2)',
        'sidebar': '2px 0 12px rgba(0, 0, 0, 0.15)',
        'auth-card': '0 15px 25px rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'auth-bg': "url('/login-bg.png')",
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease forwards',
        'spin-slow': 'spin 0.7s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
          'to': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}