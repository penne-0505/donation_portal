/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './src/**/*.{ts,tsx,js,jsx}',
    './lib/**/*.{ts,tsx,js,jsx}',
    './functions/**/*.{ts,tsx,js,jsx}',
    './docs/**/*.{md,mdx}',
  ],
  safelist: [
    'glass',
    'glass-sm',
    'glass-md',
    'glass-lg',
    'glass-strong',
    'glass-card',
    'border-gradient-subtle',
    'shadow-minimal',
    'shadow-inner-light',
    'bg-root',
    'bg-surface',
    'bg-surface-strong',
  ],
};

export default config;
