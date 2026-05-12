/**
 * Gazgan Marmar — Design Tokens
 * Single source of truth for both the public website and the admin panel.
 * Re-exported as CSS variables, Tailwind theme config, and a TS object.
 */

export const colors = {
  ink:      '#0a0a0a',
  graphite: '#1c1c1c',
  paper:    '#fafaf8',
  white:    '#ffffff',
  line:     '#e6e6e6',
  muted:    '#6b6b6b',
  gold: {
    DEFAULT: '#b08d4f',
    light:   '#c9a76a',
    dark:    '#8e6f3a',
    soft:    'rgba(176,141,79,0.08)'
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger:  '#dc2626',
    info:    '#2563eb'
  }
} as const;

export const typography = {
  serif: '"Cormorant Garamond", ui-serif, Georgia, serif',
  sans:  '"Inter", ui-sans-serif, system-ui, sans-serif',
  mono:  'ui-monospace, "SF Mono", Menlo, monospace',
  scale: {
    xs:   '11px',
    sm:   '13px',
    base: '15px',
    md:   '17px',
    lg:   '20px',
    xl:   '24px',
    '2xl':'32px',
    '3xl':'42px',
    '4xl':'56px',
    '5xl':'72px',
    '6xl':'96px'
  },
  tracking: {
    tight:  '-0.01em',
    normal: '0',
    wide:   '0.04em',
    wider:  '0.12em',
    widest: '0.32em'
  }
} as const;

export const spacing = {
  px:  '1px',
  0:   '0',
  1:   '4px',
  2:   '8px',
  3:   '12px',
  4:   '16px',
  5:   '20px',
  6:   '24px',
  8:   '32px',
  10:  '40px',
  12:  '48px',
  16:  '64px',
  20:  '80px',
  24:  '96px',
  32:  '128px'
} as const;

export const radii = { none: '0', sm: '2px', md: '4px', full: '9999px' } as const;

export const shadows = {
  none: 'none',
  soft: '0 24px 60px -30px rgba(0,0,0,0.18)',
  card: '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.08)',
  hover:'0 30px 70px -30px rgba(0,0,0,0.20)'
} as const;

export const motion = {
  easeOut: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  duration: { fast: '0.2s', normal: '0.4s', slow: '0.8s', cinematic: '1.2s' }
} as const;

export const breakpoints = {
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl':'1536px'
} as const;

/* Z-index scale */
export const z = {
  base: 0, raised: 1, dropdown: 30, sticky: 40, modal: 50, popover: 60,
  notification: 80, toast: 90, tooltip: 100
} as const;

const tokens = { colors, typography, spacing, radii, shadows, motion, breakpoints, z };
export default tokens;
