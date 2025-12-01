/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ============================================
        // MODERN VIBRANT PALETTE
        // ============================================

        // Primary Brand (Indigo/Violet base)
        'brand': {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Primary - Vibrant Indigo
          600: '#4f46e5', // Hover
          700: '#4338ca', // Active
          800: '#3730a3',
          900: '#312e81',
        },

        // Secondary/Accent (Fuchsia/Pink for pop)
        'accent': {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef', // Primary Accent
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },

        // UI Foundation (Clean Slate/Gray)
        'surface': {
          DEFAULT: '#ffffff',
          secondary: '#f8fafc', // Very light gray for subtle separation
          tertiary: '#f1f5f9',  // Slightly darker for inputs/backgrounds
          hover: '#f3f4f6',
        },
        'background': {
          DEFAULT: '#f8fafc',   // Main app background
          alt: '#f1f5f9',
        },
        'border': {
          DEFAULT: '#e2e8f0',
          light: '#f1f5f9',
          dark: '#cbd5e1',
          focus: '#6366f1', // Brand color for focus
        },

        // Text Colors (High Contrast)
        'content': {
          DEFAULT: '#0f172a',     // Slate 900 - Primary
          secondary: '#475569',   // Slate 600 - Secondary
          tertiary: '#94a3b8',    // Slate 400 - Muted
          inverse: '#ffffff',     // White text
        },

        // Semantic Colors (Vibrant & Clear)
        'success': {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e', // Green 500
          600: '#16a34a',
          700: '#15803d',
        },
        'warning': {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b', // Amber 500
          600: '#d97706',
          700: '#b45309',
        },
        'error': {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444', // Red 500
          600: '#dc2626',
          700: '#b91c1c',
        },
        'info': {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6', // Blue 500
          600: '#2563eb',
          700: '#1d4ed8',
        },

        // Course Types (Modern Gradients Support)
        'course': {
          core: '#7c3aed',      // Violet
          'core-bg': '#f5f3ff',
          elective: '#06b6d4',  // Cyan
          'elective-bg': '#ecfeff',
        },

        // Legacy Aliases (Mapped to new palette)
        'ain-blue': { DEFAULT: '#6366f1', light: '#4f46e5', dark: '#4338ca' },
        'ain-gold': { DEFAULT: '#d946ef', light: '#e879f9', dark: '#c026d3' }, // Gold mapped to Pink/Fuchsia for modern feel
      },

      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', // Soft lift
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)', // High lift
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // Deep shadow
        'button': '0 4px 6px -1px rgba(99, 102, 241, 0.3), 0 2px 4px -1px rgba(99, 102, 241, 0.15)', // Colored shadow
        'button-hover': '0 10px 15px -3px rgba(99, 102, 241, 0.4), 0 4px 6px -2px rgba(99, 102, 241, 0.2)', // Stronger colored shadow
        'glow': '0 0 15px rgba(99, 102, 241, 0.5)', // Neon glow effect
      },

      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // Indigo to Violet
        'gradient-accent': 'linear-gradient(135deg, #d946ef 0%, #ec4899 100%)', // Fuchsia to Pink
      },
    },
  },
  plugins: [],
}

