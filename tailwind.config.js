/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        flow: {
          primary: '#2563EB',
          'primary-hover': '#1D4ED8',
          dark: '#0F172A',
          canvas: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
        },
        task: {
          todo: '#64748B',
          in_progress: '#2563EB',
          review: '#D97706',
          done: '#059669',
        },
        priority: {
          low: '#64748B',
          medium: '#0284C7',
          high: '#EA580C',
          urgent: '#E11D48',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
