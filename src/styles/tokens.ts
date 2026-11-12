/**
 * PratibhaScan Design Tokens
 * Company: KAARYAN LABS
 * Design System: Light-themed, modern SaaS for sports technology
 */

export const tokens = {
  colors: {
    // Primary Brand - Teal
    primary: {
      50: '#F0FDFA',
      100: '#CCFBF1',
      200: '#99F6E4',
      300: '#5EEAD4',
      400: '#2DD4BF',
      500: '#14B8A6',
      600: '#0D9488', // Primary Teal Accent
      700: '#0F766E',
      800: '#115E59',
      900: '#134E4A',
      950: '#042F2E',
    },
    // Secondary Brand - Blue
    secondary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB', // Secondary Blue Accent
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
      950: '#172554',
    },
    // Deep Navy & Neutral Scale
    navy: {
      50: '#F8FAFC',  // Very light grey background
      100: '#F1F5F9', // Secondary card background
      200: '#E2E8F0', // Soft card border
      300: '#CBD5E1', // Subtle divider
      400: '#94A3B8', // Muted text / placeholder
      500: '#64748B', // Secondary text
      600: '#475569', // Body text
      700: '#334155', // High-emphasis body
      800: '#1E293B', // Dark headings
      900: '#0F172A', // Deep navy primary text
      950: '#020617', // Pitch navy
    },
    // Semantic States
    semantic: {
      success: {
        bg: '#F0FDF4',
        text: '#15803D',
        border: '#BBF7D0',
      },
      warning: {
        bg: '#FFFBEB',
        text: '#B45309',
        border: '#FDE68A',
      },
      error: {
        bg: '#FEF2F2',
        text: '#B91C1C',
        border: '#FECACA',
      },
      info: {
        bg: '#F0F9FF',
        text: '#0369A1',
        border: '#BAE6FD',
      },
    },
    surface: {
      white: '#FFFFFF',
      subtle: '#F8FAFC',
      card: '#FFFFFF',
      border: '#E2E8F0',
      divider: '#F1F5F9',
    },
  },

  typography: {
    fontFamily: {
      sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  radii: {
    sm: '0.25rem',  // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem',   // 8px
    xl: '0.75rem',  // 12px
    '2xl': '1rem',  // 16px
    '3xl': '1.5rem',// 24px
    full: '9999px',
  },

  shadows: {
    xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
    sm: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.05)',
  },
} as const;

export type DesignTokens = typeof tokens;
