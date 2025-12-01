/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // UNIVERSITY BRAND COLORS
        // Primary brand color with accessible variants
        // ============================================
        'brand': {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066cc',      // Primary brand - good contrast on white
          600: '#0052a3',      // Darker variant for hover states
          700: '#003d7a',      // Even darker for active states
          800: '#002952',      // Very dark for special emphasis
          900: '#001429',      // Darkest shade
        },
        // Accent/Gold color with accessible variants
        'accent': {
          50: '#fef9e7',
          100: '#fdf3cf',
          200: '#fbe79f',
          300: '#f9db6f',
          400: '#f7cf3f',
          500: '#c9a227',      // Primary accent - darker gold for better contrast
          600: '#a18420',      // Hover state
          700: '#796319',      // Active state
          800: '#514212',      // Dark variant
          900: '#28210a',      // Darkest
        },
        // ============================================
        // UI FOUNDATION COLORS
        // Background, surface, and border colors
        // ============================================
        'surface': {
          DEFAULT: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
          hover: '#e2e8f0',
        },
        'background': {
          DEFAULT: '#f1f5f9',
          alt: '#e2e8f0',
        },
        'border': {
          DEFAULT: '#cbd5e1',
          light: '#e2e8f0',
          dark: '#94a3b8',
        },
        // ============================================
        // TEXT COLORS
        // Accessible text colors for various contexts
        // ============================================
        'content': {
          DEFAULT: '#0f172a',     // Primary text - high contrast
          secondary: '#334155',   // Secondary text - good contrast
          tertiary: '#64748b',    // Tertiary/muted text
          inverse: '#ffffff',     // Text on dark backgrounds
        },
        // ============================================
        // SEMANTIC/STATUS COLORS
        // Success, warning, error, info states
        // ============================================
        'success': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',      // Primary success - good contrast
          700: '#15803d',      // Hover state
          800: '#166534',      // Active state
        },
        'warning': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',      // Primary warning
          700: '#b45309',      // Hover state
          800: '#92400e',      // Active state
        },
        'error': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',      // Primary error - good contrast
          700: '#b91c1c',      // Hover state
          800: '#991b1b',      // Active state
        },
        'info': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',      // Primary info
          700: '#1d4ed8',      // Hover state
          800: '#1e40af',      // Active state
        },
        // ============================================
        // INTERACTIVE ELEMENT COLORS
        // Buttons, links, and other interactive elements
        // ============================================
        'primary': {
          DEFAULT: '#0066cc',
          hover: '#0052a3',
          active: '#003d7a',
          disabled: '#94a3b8',
        },
        'secondary': {
          DEFAULT: '#475569',
          hover: '#334155',
          active: '#1e293b',
        },
        // ============================================
        // COURSE TYPE COLORS
        // Distinct colors for course categorization
        // ============================================
        'course': {
          core: '#7c3aed',
          'core-bg': '#f5f3ff',
          elective: '#0891b2',
          'elective-bg': '#ecfeff',
        },
        // ============================================
        // LEGACY ALIASES (for backward compatibility)
        // These map to the new color system
        // ============================================
        'ain-blue': {
          DEFAULT: '#0066cc',
          light: '#0052a3',
          dark: '#003d7a',
        },
        'ain-gold': {
          DEFAULT: '#c9a227',
          light: '#d4b03a',
          dark: '#a18420',
        },
        'ui-bg': '#f1f5f9',
        'ui-card': '#ffffff',
        'ui-border': '#cbd5e1',
        'ui-text': {
          primary: '#0f172a',
          secondary: '#334155',
          light: '#64748b',
        },
        'danger': {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
          light: '#fee2e2',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'button': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'button-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [],
}

